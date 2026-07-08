import { json } from "../_lib/api.js";

const requiredMigrations = ["0010_invite_codes.sql", "0011_seed_initial_invite_codes.sql", "0012_signup_workspace_bootstrap.sql", "0013_operational_80_foundation.sql"];
const criticalTables = ["users", "workspaces", "workspace_members", "sessions", "personas", "cards", "products", "payment_links", "order_reservations", "workspace_files", "invoices", "workspace_preferences", "activity_events", "invite_codes", "invite_code_events"];
const criticalUserColumns = ["username", "phone", "normalized_phone", "password_hash", "default_workspace_id", "default_persona_id", "language", "signup_source", "invite_code_id", "onboarding_status", "invite_token_hash", "invite_token_expires_at", "invite_accepted_at"];
const criticalProductColumns = ["workspace_id", "title", "product_type", "status", "price_amount", "currency", "description", "asset_status", "fulfillment_type", "requires_account", "allow_guest_checkout"];
const criticalFileColumns = ["workspace_id", "title", "file_url", "file_type", "visibility", "status", "metadata_json"];
const criticalInvoiceColumns = ["workspace_id", "customer_name", "customer_email", "invoice_number", "status", "amount_cents", "currency", "line_items_json"];
async function tableExists(env, table) { const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1").bind(table).first(); return Boolean(row?.name); }
async function columnsFor(env, table) { const result = await env.DB.prepare(`PRAGMA table_info(${table})`).all(); return (result.results || []).map((row) => row.name); }

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ env }) {
  const checks = { db_bound: Boolean(env.DB), critical_tables: {}, critical_columns: { users: {}, products: {}, workspace_files: {}, invoices: {} }, invite_codes_table: false, seeded_invite_codes: false, admin_exists: false, admin_bootstrap_available: Boolean(env.BOOSTR_ADMIN_BOOTSTRAP_KEY), operational_endpoints: { invite_acceptance: true, insights: true, files: true, invoices: true } };
  const nextSteps = [];
  if (!env.DB) return json({ ok: true, status: "needs_config", service: "BOOSTR Labs", checks, required_migrations: requiredMigrations, next_steps: ["Bind Cloudflare D1 as DB before production QA."] });
  let status = "ready";
  try {
    await env.DB.prepare("SELECT 1 AS ok").first();
    for (const table of criticalTables) checks.critical_tables[table] = await tableExists(env, table);
    checks.invite_codes_table = checks.critical_tables.invite_codes;
    const columnGroups = [["users", criticalUserColumns], ["products", criticalProductColumns], ["workspace_files", criticalFileColumns], ["invoices", criticalInvoiceColumns]];
    for (const [table, cols] of columnGroups) if (checks.critical_tables[table]) { const existing = await columnsFor(env, table); for (const column of cols) checks.critical_columns[table][column] = existing.includes(column); }
    if (checks.critical_tables.users) { const admin = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1").first(); checks.admin_exists = Boolean(admin?.id); }
    if (checks.critical_tables.invite_codes) { const inviteCount = await env.DB.prepare("SELECT COUNT(*) AS total FROM invite_codes WHERE status = 'active'").first(); checks.seeded_invite_codes = Number(inviteCount?.total || 0) > 0; }
    const missingTables = Object.entries(checks.critical_tables).filter(([, exists]) => !exists).map(([name]) => name);
    const missingColumns = Object.entries(checks.critical_columns).flatMap(([table, columns]) => Object.entries(columns).filter(([, exists]) => !exists).map(([name]) => `${table}.${name}`));
    if (missingTables.length || missingColumns.length) { status = "missing_migrations"; nextSteps.push("Apply D1 migrations through 0013_operational_80_foundation.sql."); if (missingTables.length) nextSteps.push(`Missing tables: ${missingTables.join(", ")}.`); if (missingColumns.length) nextSteps.push(`Missing columns: ${missingColumns.join(", ")}.`); }
    if (status === "ready" && !checks.seeded_invite_codes) { status = "degraded"; nextSteps.push("Seed invite codes with migration 0011 or configure secure env fallback."); }
    if (status === "ready" && !checks.admin_exists) { status = checks.admin_bootstrap_available ? "degraded" : "needs_config"; nextSteps.push(checks.admin_bootstrap_available ? "Bootstrap the first admin through POST /api/admin/bootstrap." : "Configure BOOSTR_ADMIN_BOOTSTRAP_KEY to bootstrap the first admin."); }
  } catch { status = "degraded"; nextSteps.push("Readiness query failed. Confirm D1 migrations and binding configuration."); }
  return json({ ok: true, status, service: "BOOSTR Labs", checks, required_migrations: requiredMigrations, next_steps: nextSteps });
}
