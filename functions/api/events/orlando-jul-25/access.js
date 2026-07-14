import { clean, hashPassword, json, jsonError, now, readJson, requireDb, requireRole } from "../../../_lib/api.js";

const WORKSPACE_SLUG = "event-orlando-jul-25";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function ensureWorkspace(env, timestamp) {
  const existing = await env.DB.prepare("SELECT id, name, slug FROM workspaces WHERE slug = ? LIMIT 1")
    .bind(WORKSPACE_SLUG)
    .first();
  if (existing?.id) return existing;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
     VALUES (?, 'event', 'Fuerte Promotions · Orlando Jul 25', ?, NULL, 'active', ?, ?)`
  ).bind(id, WORKSPACE_SLUG, timestamp, timestamp).run();
  return { id, name: "Fuerte Promotions · Orlando Jul 25", slug: WORKSPACE_SLUG };
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const email = clean(payload.email, 180).toLowerCase();
  const username = clean(payload.username || "gemese", 80).toLowerCase();
  const name = clean(payload.name || "Gemese", 120);
  const password = clean(payload.password, 500);

  if (!email || !email.includes("@")) {
    return jsonError("valid_email_required", "A valid email is required.", 400, { fields: ["email"] });
  }
  if (password.length < 10) {
    return jsonError("weak_password", "Temporary password must be at least 10 characters.", 400, { fields: ["password"] });
  }

  const timestamp = now();
  const workspace = await ensureWorkspace(env, timestamp);
  const passwordHash = await hashPassword(password);
  const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ? OR username = ? LIMIT 1")
    .bind(email, username)
    .first();
  const userId = existing?.id || crypto.randomUUID();

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE users
       SET email = ?, username = ?, name = ?, role = 'partner', workspace_id = ?, default_workspace_id = ?,
           status = 'active', password_hash = ?, password_set_at = ?, updated_at = ?
       WHERE id = ?`
    ).bind(email, username, name, workspace.id, workspace.id, passwordHash, timestamp, timestamp, userId).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, username, name, role, workspace_id, default_workspace_id, status,
        password_hash, password_set_at, signup_source, onboarding_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'partner', ?, ?, 'active', ?, ?, 'event_os_manager_provisioned', 'ready', ?, ?)`
    ).bind(userId, email, username, name, workspace.id, workspace.id, passwordHash, timestamp, timestamp, timestamp).run();
  }

  const membership = await env.DB.prepare(
    "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1"
  ).bind(workspace.id, userId).first();

  if (membership?.id) {
    await env.DB.prepare(
      "UPDATE workspace_members SET role = 'partner', status = 'active', updated_at = ? WHERE id = ?"
    ).bind(timestamp, membership.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, 'partner', 'active', ?, ?)`
    ).bind(crypto.randomUUID(), workspace.id, userId, timestamp, timestamp).run();
  }

  const persona = await env.DB.prepare(
    "SELECT id FROM personas WHERE workspace_id = ? AND user_id = ? AND persona_type = 'artist' LIMIT 1"
  ).bind(workspace.id, userId).first();
  if (!persona?.id) {
    await env.DB.prepare(
      `INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, 'artist', 'GEMESE · Event Lead Manager', 'active', ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      userId,
      workspace.id,
      JSON.stringify({ scope: "event-orlando-jul-25", permissions: ["leads.read", "leads.status.update"] }),
      timestamp,
      timestamp
    ).run();
  }

  return json({
    ok: true,
    user: { id: userId, email, username, name, role: "partner" },
    workspace,
    dashboard: "/events/orlando-jul-25/control/"
  }, 201);
}
