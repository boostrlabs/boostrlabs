import { json, managerAuth } from "../_lib/api.js";

export async function onRequestGet({ request, env }) {
  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  if (!env.DB) {
    return json({ ok: false, error: "D1 DB binding missing." }, 503);
  }

  try {
    // Create tables if they don't exist
    const migrations = [
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL DEFAULT 'website',
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        preferred_contact_method TEXT,
        business_name TEXT,
        industry TEXT,
        project_goal TEXT,
        budget_range TEXT,
        timeline TEXT,
        current_status TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        assigned_to TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS audit_submissions (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL DEFAULT 'boostr-audit',
        page_url TEXT,
        language TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        contact_raw TEXT,
        business_name TEXT,
        industry TEXT,
        stage TEXT,
        traffic TEXT,
        signals INTEGER DEFAULT 0,
        recommended_modules TEXT,
        answers_json TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS lead_events (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        audit_submission_id TEXT,
        event_type TEXT NOT NULL,
        payload_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
        FOREIGN KEY (audit_submission_id) REFERENCES audit_submissions(id) ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        owner_email TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        workspace_id TEXT,
        status TEXT NOT NULL DEFAULT 'invited',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        workspace_id TEXT,
        source TEXT NOT NULL DEFAULT 'manual',
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        item_name TEXT NOT NULL,
        item_type TEXT,
        amount_cents INTEGER DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        fulfillment_status TEXT NOT NULL DEFAULT 'pending',
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
      );`,
      `INSERT OR IGNORE INTO modules (id, name, slug, category, status, description, created_at, updated_at)
       VALUES
         ('mod_audit', 'BOOSTR Audit', 'boostr-audit', 'lead-capture', 'active', 'Public diagnostic intake and recommendation flow.', datetime('now'), datetime('now')),
         ('mod_smart_links', 'Smart Links', 'smart-links', 'front-door', 'available', 'Custom partner front doors and deep links.', datetime('now'), datetime('now')),
         ('mod_manager_os', 'Manager OS', 'manager-os', 'operations', 'active', 'Internal lead and operations workspace.', datetime('now'), datetime('now')),
         ('mod_checkout', 'Smart Checkout', 'smart-checkout', 'commerce', 'planned', 'Order and payment flow for products, services and licenses.', datetime('now'), datetime('now')),
         ('mod_artist_os', 'Artist OS', 'artist-os', 'vertical', 'available', 'Artist infrastructure without creative control.', datetime('now'), datetime('now'));`
    ];

    let executed = 0;
    for (const sql of migrations) {
      try {
        await env.DB.exec(sql);
        executed++;
      } catch (e) {
        // Table may already exist, that's fine
        console.log("Migration note:", e.message);
      }
    }

    // Verify tables exist
    const tableResult = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    const tables = (tableResult.results || []).map((row) => row.name);

    return json({
      ok: true,
      message: "Database initialization complete",
      tables_created: executed,
      tables_present: tables,
      ready: tables.includes("leads") && tables.includes("audit_submissions")
    });
  } catch (error) {
    console.error("Database init failed:", error);
    return json({ ok: false, error: error.message }, 500);
  }
}
