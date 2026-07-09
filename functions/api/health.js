import { json } from "../_lib/api.js";

const expectedTables = [
  "leads", "audit_submissions", "lead_events", "workspaces", "users", "workspace_members",
  "sessions", "modules", "workspace_modules", "orders", "personas", "cards", "human_needs",
  "products", "pilot_profiles", "payment_links", "order_reservations", "workspace_files", "invoices",
  "user_contact_methods", "workspace_preferences", "api_tokens", "notifications", "activity_events",
  "invite_codes", "invite_code_events"
];
async function count(env, table, where = "") { try { const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} ${where}`).first(); return row?.total ?? 0; } catch { return null; } }
async function latest(env, table, cols = "id, workspace_id, created_at", where = "") { try { return await env.DB.prepare(`SELECT ${cols} FROM ${table} ${where} ORDER BY created_at DESC LIMIT 1`).first(); } catch { return null; } }

export async function onRequestGet({ env }) {
  const db = { bound: Boolean(env.DB), writable: false, tables: [], missing_tables: expectedTables };
  const metrics = { leads_total: null, audits_total: null, claimed_audits_total: null, orders_total: null, events_total: null, products_total: null, active_products_total: null, payment_links_total: null, active_payment_links_total: null, reservations_total: null, converted_reservations_total: null, files_total: null, invoices_total: null, invited_users_total: null, verified_users_total: null, pending_password_resets_total: null, invite_codes_total: null, users_total: null, workspaces_total: null, admins_total: null, last_lead: null, last_audit: null, last_product: null, last_payment_link: null, last_reservation: null, last_file: null, last_invoice: null };
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      const tableResult = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
      db.writable = true; db.tables = (tableResult.results || []).map((row) => row.name); db.missing_tables = expectedTables.filter((name) => !db.tables.includes(name));
      if (db.tables.includes("leads")) metrics.leads_total = await count(env, "leads");
      if (db.tables.includes("audit_submissions")) { metrics.audits_total = await count(env, "audit_submissions"); metrics.claimed_audits_total = await count(env, "audit_submissions", "WHERE status = 'claimed'"); metrics.last_audit = await latest(env, "audit_submissions", "id, workspace_id, contact_email, business_name, status, created_at"); }
      if (db.tables.includes("lead_events")) metrics.events_total = await count(env, "lead_events");
      if (db.tables.includes("orders")) metrics.orders_total = await count(env, "orders");
      if (db.tables.includes("products")) { metrics.products_total = await count(env, "products", "WHERE status != 'archived'"); metrics.active_products_total = await count(env, "products", "WHERE status = 'active'"); metrics.last_product = await latest(env, "products", "id, workspace_id, title, product_type, status, price_amount, currency, created_at", "WHERE status != 'archived'"); }
      if (db.tables.includes("payment_links")) { metrics.payment_links_total = await count(env, "payment_links", "WHERE status != 'archived'"); metrics.active_payment_links_total = await count(env, "payment_links", "WHERE status = 'active'"); metrics.last_payment_link = await latest(env, "payment_links", "id, workspace_id, product_id, title, status, amount_cents, currency, created_at", "WHERE status != 'archived'"); }
      if (db.tables.includes("order_reservations")) { metrics.reservations_total = await count(env, "order_reservations"); metrics.converted_reservations_total = await count(env, "order_reservations", "WHERE status = 'converted'"); metrics.last_reservation = await latest(env, "order_reservations", "id, workspace_id, payment_link_id, product_id, status, reservation_type, created_at"); }
      if (db.tables.includes("workspace_files")) { metrics.files_total = await count(env, "workspace_files", "WHERE status = 'active'"); metrics.last_file = await latest(env, "workspace_files", "id, workspace_id, title, file_type, visibility, created_at", "WHERE status = 'active'"); }
      if (db.tables.includes("invoices")) { metrics.invoices_total = await count(env, "invoices", "WHERE status != 'archived'"); metrics.last_invoice = await latest(env, "invoices", "id, workspace_id, invoice_number, status, amount_cents, currency, created_at", "WHERE status != 'archived'"); }
      if (db.tables.includes("users")) { metrics.users_total = await count(env, "users"); metrics.admins_total = await count(env, "users", "WHERE role = 'admin' AND status = 'active'"); metrics.invited_users_total = await count(env, "users", "WHERE status = 'invited'"); metrics.verified_users_total = await count(env, "users", "WHERE email_verified_at IS NOT NULL"); metrics.pending_password_resets_total = await count(env, "users", "WHERE password_reset_token_hash IS NOT NULL"); }
      if (db.tables.includes("workspaces")) metrics.workspaces_total = await count(env, "workspaces");
      if (db.tables.includes("invite_codes")) metrics.invite_codes_total = await count(env, "invite_codes");
      if (db.tables.includes("leads")) metrics.last_lead = await latest(env, "leads", "id, workspace_id, source, contact_name, contact_email, business_name, status, created_at");
    } catch { db.error = "D1 binding exists but query failed. Run migrations."; }
  }
  return json({
    ok: true,
    service: "BOOSTR Labs API",
    version: "0.3.9-operational-polish",
    db,
    metrics,
    readiness: { endpoint: "/api/readiness", admin_bootstrap: "/api/admin/bootstrap", admin_readiness_ui: "/admin/readiness", admin_bootstrap_key_configured: Boolean(env.BOOSTR_ADMIN_BOOTSTRAP_KEY) },
    auth_recovery: { request_endpoint: "/api/password-reset/request", confirm_endpoint: "/api/password-reset/confirm", public_route: "/forgot-password", debug_links_enabled: env.ENVIRONMENT === "development" || env.ALLOW_DEBUG_AUTH_LINKS === "true" },
    email_verification: { request_endpoint: "/api/email-verification/request", confirm_endpoint: "/api/email-verification/confirm", public_route: "/verify-email", debug_links_enabled: env.ENVIRONMENT === "development" || env.ALLOW_DEBUG_AUTH_LINKS === "true" },
    manager_operations: { workspaces_endpoint: "/api/manager/workspaces", workspaces_ui: "/manager/workspaces", role_required: "admin_or_manager" },
    invite_acceptance: { endpoint: "/api/invitations/accept", public_route: "/accept-invite", sets_password: true, creates_session: true },
    intelligence: { summary_endpoint: "/api/insights/summary", run_endpoint: "/api/insights/run", workspace_ui: "/app/intelligence", creates_action_cards: true, deduplicates_open_recommendations: true, llm_required: false },
    audit_claim: { endpoint: "/api/audit/:id/claim", manager_ui: "/manager/leads", creates_workspace: true, creates_client_invite_when_email_exists: true, creates_action_cards: true },
    products: { endpoint: "/api/products", item_endpoint: "/api/products/:id", workspace_ui: "/app/products", returns_relationship_graph: true, creates_real_workspace_products: true, stripe_required: false },
    smart_links: { endpoint: "/api/payment-links", item_endpoint: "/api/payment-links/:id", public_offer_endpoint: "/api/public/payment-links/:id", public_route: "/pay/:id", reservations_endpoint: "/api/order-reservations", reservation_invoice_endpoint: "/api/order-reservations/:id/invoice", creates_real_reservations: true, stripe_required: false },
    files: { endpoint: "/api/files", item_endpoint: "/api/files/:id", workspace_ui: "/app/files", stores_metadata_links: true },
    invoices: { endpoint: "/api/invoices", item_endpoint: "/api/invoices/:id", workspace_ui: "/app/invoices", manual_pre_stripe_records: true },
    mobile: { global_css: "/assets/boostr-mother/mobile-polish.css", injected_by_console: true },
    endpoints: ["/api/health", "/api/readiness", "/api/manager/workspaces", "/api/password-reset/request", "/api/password-reset/confirm", "/api/email-verification/request", "/api/email-verification/confirm", "/api/invitations/accept", "/api/insights/summary", "/api/insights/run", "/api/audit/:id/claim", "/api/products", "/api/products/:id", "/api/payment-links", "/api/order-reservations", "/api/order-reservations/:id/invoice", "/api/files", "/api/invoices", "/api/cards"]
  });
}
