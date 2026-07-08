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
    products_total: null,
    active_products_total: null,
    payment_links_total: null,
    active_payment_links_total: null,
    reservations_total: null,
    invite_codes_total: null,
    users_total: null,
    workspaces_total: null,
    admins_total: null,
    last_lead: null,
    last_audit: null,
    last_product: null,
    last_payment_link: null,
    last_reservation: null
  };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      const tableResult = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
      db.writable = true;
      db.tables = (tableResult.results || []).map((row) => row.name);
      db.missing_tables = expectedTables.filter((name) => !db.tables.includes(name));

      if (["leads", "audit_submissions", "orders", "lead_events"].every((name) => db.tables.includes(name))) {
        const [leadsTotal, auditsTotal, ordersTotal, eventsTotal, lastLead, lastAudit] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM leads").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM audit_submissions").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM orders").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM lead_events").first(),
          env.DB.prepare(`SELECT id, source, contact_name, contact_email, business_name, status, created_at FROM leads ORDER BY created_at DESC LIMIT 1`).first(),
          env.DB.prepare(`SELECT id, source, contact_name, contact_email, business_name, status, created_at FROM audit_submissions ORDER BY created_at DESC LIMIT 1`).first()
        ]);
        metrics.leads_total = leadsTotal?.total ?? 0;
        metrics.audits_total = auditsTotal?.total ?? 0;
        metrics.orders_total = ordersTotal?.total ?? 0;
        metrics.events_total = eventsTotal?.total ?? 0;
        metrics.last_lead = lastLead || null;
        metrics.last_audit = lastAudit || null;
      }
      if (db.tables.includes("products")) {
        const [productsTotal, activeProductsTotal, lastProduct] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM products WHERE status != 'archived'").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM products WHERE status = 'active'").first(),
          env.DB.prepare(`SELECT id, workspace_id, title, product_type, status, price_amount, currency, created_at FROM products WHERE status != 'archived' ORDER BY created_at DESC LIMIT 1`).first()
        ]);
        metrics.products_total = productsTotal?.total ?? 0;
        metrics.active_products_total = activeProductsTotal?.total ?? 0;
        metrics.last_product = lastProduct || null;
      }
      if (db.tables.includes("payment_links")) {
        const [linksTotal, activeLinksTotal, lastLink] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM payment_links WHERE status != 'archived'").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM payment_links WHERE status = 'active'").first(),
          env.DB.prepare(`SELECT id, workspace_id, product_id, title, status, amount_cents, currency, created_at FROM payment_links WHERE status != 'archived' ORDER BY created_at DESC LIMIT 1`).first()
        ]);
        metrics.payment_links_total = linksTotal?.total ?? 0;
        metrics.active_payment_links_total = activeLinksTotal?.total ?? 0;
        metrics.last_payment_link = lastLink || null;
      }
      if (db.tables.includes("order_reservations")) {
        const [reservationsTotal, lastReservation] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM order_reservations").first(),
          env.DB.prepare(`SELECT id, workspace_id, payment_link_id, product_id, status, reservation_type, created_at FROM order_reservations ORDER BY created_at DESC LIMIT 1`).first()
        ]);
        metrics.reservations_total = reservationsTotal?.total ?? 0;
        metrics.last_reservation = lastReservation || null;
      }
      if (db.tables.includes("invite_codes")) {
        const inviteCodesTotal = await env.DB.prepare("SELECT COUNT(*) AS total FROM invite_codes").first();
        metrics.invite_codes_total = inviteCodesTotal?.total ?? 0;
      }
      if (db.tables.includes("users")) {
        const [usersTotal, adminsTotal] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS total FROM users").first(),
          env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'").first()
        ]);
        metrics.users_total = usersTotal?.total ?? 0;
        metrics.admins_total = adminsTotal?.total ?? 0;
      }
      if (db.tables.includes("workspaces")) {
        const workspacesTotal = await env.DB.prepare("SELECT COUNT(*) AS total FROM workspaces").first();
        metrics.workspaces_total = workspacesTotal?.total ?? 0;
      }
    } catch (error) {
      db.error = "D1 binding exists but query failed. Run migrations.";
    }
  }

  return json({
    ok: true,
    service: "BOOSTR Labs API",
    version: "0.3.5-smart-link-reservations",
    db,
    metrics,
    manager: {
      pin_configured: Boolean(env.MANAGER_PIN || env.ADMIN_PIN),
      pin_fallback_enabled: env.ENVIRONMENT === "development" || env.ALLOW_MANAGER_PIN_FALLBACK === "true"
    },
    readiness: {
      endpoint: "/api/readiness",
      admin_bootstrap: "/api/admin/bootstrap",
      admin_readiness_ui: "/admin/readiness",
      admin_bootstrap_key_configured: Boolean(env.BOOSTR_ADMIN_BOOTSTRAP_KEY)
    },
    signup: {
      endpoint: "/api/signup",
      username_check: "/api/signup/check-username",
      dashboard: "/api/dashboard",
      creates_workspace: true,
      creates_default_cards: true,
      increments_invite_usage_after_signup: true
    },
    products: {
      endpoint: "/api/products",
      item_endpoint: "/api/products/:id",
      workspace_ui: "/app/products",
      creates_real_workspace_products: true,
      stripe_required: false
    },
    smart_links: {
      endpoint: "/api/payment-links",
      item_endpoint: "/api/payment-links/:id",
      public_offer_endpoint: "/api/public/payment-links/:id",
      public_route: "/pay/:id",
      reservations_endpoint: "/api/order-reservations",
      creates_real_reservations: true,
      stripe_required: false
    },
    secret_code: {
      endpoint: "/api/invite-codes/validate",
      env_fallback_configured: Boolean(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE),
      plaintext_exposed: false,
      usage_increment_on_validate: false
    },
    endpoints: [
      "/api/health",
      "/api/readiness",
      "/api/admin/bootstrap",
      "/api/session",
      "/api/signup",
      "/api/signup/check-username",
      "/api/dashboard",
      "/api/audit",
      "/api/invite-codes/validate",
      "/api/products",
      "/api/products/:id",
      "/api/payment-links",
      "/api/payment-links/:id",
      "/api/public/payment-links/:id",
      "/api/order-reservations",
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
