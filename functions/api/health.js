import { json } from "../_lib/api.js";

const expectedTables = [
  "leads",
  "audit_submissions",
  "lead_events",
  "workspaces",
  "users",
  "workspace_members",
  "sessions",
  "modules",
  "workspace_modules",
  "orders",
  "personas",
  "cards",
  "human_needs",
  "products",
  "pilot_profiles",
  "payment_links",
  "order_reservations",
  "user_contact_methods",
  "workspace_preferences",
  "api_tokens",
  "notifications",
  "activity_events",
  "invite_codes",
  "invite_code_events"
];

export async function onRequestGet({ env }) {
  const db = { bound: Boolean(env.DB), writable: false, tables: [], missing_tables: expectedTables };
  const metrics = {
    leads_total: null,
    audits_total: null,
    orders_total: null,
    events_total: null,
    invite_codes_total: null,
    last_lead: null,
    last_audit: null
  };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      const tableResult = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
      ).all();
      db.writable = true;
      db.tables = (tableResult.results || []).map((row) => row.name);
      db.missing_tables = expectedTables.filter((name) => !db.tables.includes(name));

      if (["leads", "audit_submissions", "orders", "lead_events"].every((name) => db.tables.includes(name))) {
        const [leadsTotal, auditsTotal, ordersTotal, eventsTotal, lastLead, lastAudit] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM leads").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM audit_submissions").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM orders").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM lead_events").first(),
          env.DB.prepare(
            `SELECT id, source, contact_name, contact_email, business_name, status, created_at
             FROM leads
             ORDER BY created_at DESC
             LIMIT 1`
          ).first(),
          env.DB.prepare(
            `SELECT id, source, contact_name, contact_email, business_name, status, created_at
             FROM audit_submissions
             ORDER BY created_at DESC
             LIMIT 1`
          ).first()
        ]);

        metrics.leads_total = leadsTotal?.total ?? 0;
        metrics.audits_total = auditsTotal?.total ?? 0;
        metrics.orders_total = ordersTotal?.total ?? 0;
        metrics.events_total = eventsTotal?.total ?? 0;
        metrics.last_lead = lastLead || null;
        metrics.last_audit = lastAudit || null;
      }
      if (db.tables.includes("invite_codes")) {
        const inviteCodesTotal = await env.DB.prepare("SELECT COUNT(*) AS total FROM invite_codes").first();
        metrics.invite_codes_total = inviteCodesTotal?.total ?? 0;
      }
    } catch (error) {
      db.error = "D1 binding exists but query failed. Run migrations.";
    }
  }

  return json({
    ok: true,
    service: "BOOSTR Labs API",
    version: "0.3.1-secret-code",
    db,
    metrics,
    manager: {
      pin_configured: Boolean(env.MANAGER_PIN || env.ADMIN_PIN),
      pin_fallback_enabled: env.ENVIRONMENT === "development" || env.ALLOW_MANAGER_PIN_FALLBACK === "true"
    },
    secret_code: {
      endpoint: "/api/invite-codes/validate",
      env_fallback_configured: Boolean(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE),
      plaintext_exposed: false,
      usage_increment_on_validate: false
    },
    endpoints: [
      "/api/health",
      "/api/me",
      "/api/profile",
      "/api/profile/contacts",
      "/api/profile/contacts/:id",
      "/api/personas",
      "/api/personas/:id",
      "/api/personas/switch",
      "/api/workspace-preferences",
      "/api/security",
      "/api/security/change-password",
      "/api/security/sessions",
      "/api/security/sessions/:id",
      "/api/security/logout-all",
      "/api/integrations/api-tokens",
      "/api/integrations/api-tokens/:id",
      "/api/notifications",
      "/api/notifications/:id",
      "/api/activity",
      "/api/session",
      "/api/workspaces",
      "/api/db-init",
      "/api/audit",
      "/api/invite-codes/validate",
      "/api/demo/janko-os",
      "/api/intake",
      "/api/leads",
      "/api/leads?type=summary",
      "/api/leads/:id",
      "/api/events",
      "/api/modules",
      "/api/orders",
      "/api/cards",
      "/api/cards/:id",
      "/api/cards/:id/action",
      "/api/human-needs",
      "/api/human-needs/latest",
      "/api/workspaces/:workspace_id/cards"
    ]
  });
}
