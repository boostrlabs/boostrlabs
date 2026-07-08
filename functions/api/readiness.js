import { json } from "../_lib/api.js";

const requiredMigrations = [
  "0010_invite_codes.sql",
  "0011_seed_initial_invite_codes.sql",
  "0012_signup_workspace_bootstrap.sql"
];

const criticalTables = [
  "users",
  "workspaces",
  "workspace_members",
  "sessions",
  "personas",
  "cards",
  "workspace_preferences",
  "activity_events",
  "invite_codes",
  "invite_code_events"
];

const criticalUserColumns = [
  "username",
  "phone",
  "normalized_phone",
  "password_hash",
  "default_workspace_id",
  "default_persona_id",
  "language",
  "signup_source",
  "invite_code_id",
  "onboarding_status"
];

async function tableExists(env, table) {
  const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind(table)
    .first();
  return Boolean(row?.name);
}

async function columnsFor(env, table) {
  const result = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  return (result.results || []).map((row) => row.name);
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  const checks = {
    db_bound: Boolean(env.DB),
    critical_tables: {},
    critical_columns: { users: {} },
    signup_endpoint: true,
    session_endpoint: true,
    dashboard_endpoint: true,
    invite_codes_table: false,
    seeded_invite_codes: false,
    admin_exists: false,
    admin_bootstrap_available: Boolean(env.BOOSTR_ADMIN_BOOTSTRAP_KEY)
  };

  const nextSteps = [];

  if (!env.DB) {
    return json({
      ok: true,
      status: "needs_config",
      service: "BOOSTR Labs",
      checks,
      required_migrations: requiredMigrations,
      next_steps: ["Bind Cloudflare D1 as DB before production signup/login QA."]
    });
  }

  let status = "ready";

  try {
    await env.DB.prepare("SELECT 1 AS ok").first();

    for (const table of criticalTables) {
      checks.critical_tables[table] = await tableExists(env, table);
    }

    checks.invite_codes_table = checks.critical_tables.invite_codes;

    if (checks.critical_tables.users) {
      const userColumns = await columnsFor(env, "users");
      for (const column of criticalUserColumns) {
        checks.critical_columns.users[column] = userColumns.includes(column);
      }

      const admin = await env.DB.prepare(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1"
      ).first();
      checks.admin_exists = Boolean(admin?.id);
    }

    if (checks.critical_tables.invite_codes) {
      const inviteCount = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM invite_codes WHERE status = 'active'"
      ).first();
      checks.seeded_invite_codes = Number(inviteCount?.total || 0) > 0;
    }

    const missingTables = Object.entries(checks.critical_tables)
      .filter(([, exists]) => !exists)
      .map(([name]) => name);
    const missingColumns = Object.entries(checks.critical_columns.users)
      .filter(([, exists]) => !exists)
      .map(([name]) => `users.${name}`);

    if (missingTables.length || missingColumns.length) {
      status = "missing_migrations";
      nextSteps.push("Apply D1 migrations 0010, 0011, and 0012.");
      if (missingTables.length) nextSteps.push(`Missing tables: ${missingTables.join(", ")}.`);
      if (missingColumns.length) nextSteps.push(`Missing columns: ${missingColumns.join(", ")}.`);
    }

    if (status === "ready" && !checks.seeded_invite_codes) {
      status = "degraded";
      nextSteps.push("Seed invite codes with migration 0011 or configure a secure env fallback.");
    }

    if (status === "ready" && !checks.admin_exists) {
      if (checks.admin_bootstrap_available) {
        status = "degraded";
        nextSteps.push("Bootstrap the first admin through POST /api/admin/bootstrap.");
      } else {
        status = "needs_config";
        nextSteps.push("Configure BOOSTR_ADMIN_BOOTSTRAP_KEY to bootstrap the first admin.");
      }
    }
  } catch (error) {
    status = "degraded";
    nextSteps.push("Readiness query failed. Confirm D1 migrations and binding configuration.");
  }

  return json({
    ok: true,
    status,
    service: "BOOSTR Labs",
    checks,
    required_migrations: requiredMigrations,
    next_steps: nextSteps
  });
}
