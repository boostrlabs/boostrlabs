import { json } from "../_lib/api.js";

const expectedTables = ["leads", "audit_submissions", "lead_events", "workspaces", "users", "modules", "orders"];

export async function onRequestGet({ env }) {
  const db = { bound: Boolean(env.DB), writable: false, tables: [], missing_tables: expectedTables };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      const tableResult = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
      ).all();
      db.writable = true;
      db.tables = (tableResult.results || []).map((row) => row.name);
      db.missing_tables = expectedTables.filter((name) => !db.tables.includes(name));
    } catch (error) {
      db.error = "D1 binding exists but query failed. Run migrations.";
    }
  }

  return json({
    ok: true,
    service: "BOOSTR Labs API",
    version: "0.3.0-backend",
    db,
    manager: {
      pin_configured: Boolean(env.MANAGER_PIN || env.ADMIN_PIN)
    },
    endpoints: [
      "/api/health",
      "/api/audit",
      "/api/intake",
      "/api/leads",
      "/api/leads?type=summary",
      "/api/leads/:id",
      "/api/modules",
      "/api/orders"
    ]
  });
}
