import {
  authRoles,
  clean,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  jsonError,
  now,
  readJson,
  requireDb,
  sessionCookie
} from "../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const allowed = env.ENVIRONMENT === "development" || env.ALLOW_DEV_SESSION === "true";
  const configured = clean(env.MANAGER_PIN || env.ADMIN_PIN || "", 120);
  const supplied = clean(request.headers.get("X-Manager-Pin") || "", 120);
  if (!allowed) return jsonError("dev_session_disabled", "Development session setup is disabled.", 403);
  if (!configured || supplied !== configured) return jsonError("invalid_pin", "Invalid PIN.", 401);

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const email = clean(payload.email, 180).toLowerCase();
  const password = clean(payload.password, 500);
  const role = clean(payload.role || "manager", 40);
  if (!email || !password) {
    return jsonError("credentials_required", "Email and password are required.", 400, { fields: ["email", "password"] });
  }
  if (!isValidEmail(email)) return jsonError("invalid_email", "Use a valid email address.", 400, { fields: ["email"] });
  if (password.length < 8) return jsonError("password_too_short", "Password must be at least 8 characters.", 400, { fields: ["password"] });
  if (!authRoles.has(role)) return jsonError("invalid_role", "Role is not supported.", 400, { fields: ["role"] });

  const timestamp = now();
  const membershipRole = ["admin", "manager", "partner", "client", "artist"].includes(role) ? role : "client";
  let workspaceId = clean(payload.workspace_id, 120);
  const workspaceSlug = clean(payload.workspace_slug || "boostr-internal", 120);
  let workspace = workspaceId
    ? await env.DB.prepare("SELECT id FROM workspaces WHERE id = ? LIMIT 1").bind(workspaceId).first()
    : null;

  if (!workspace?.id && workspaceSlug) {
    workspace = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? LIMIT 1").bind(workspaceSlug).first();
    workspaceId = workspace?.id || workspaceId;
  }

  if (!workspace?.id) {
    workspaceId = workspaceId || crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO workspaces (
        id, type, name, slug, owner_email, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        name = excluded.name,
        owner_email = excluded.owner_email,
        status = 'active',
        updated_at = excluded.updated_at`
    )
      .bind(
        workspaceId,
        clean(payload.workspace_type || "internal", 40),
        clean(payload.workspace_name || "BOOSTR Internal", 180),
        workspaceSlug || null,
        email,
        timestamp,
        timestamp
      )
      .run();
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE lower(email) = ? LIMIT 1").bind(email).first();
  const userId = existing?.id || crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE users
       SET name = ?, role = ?, workspace_id = ?, status = 'active',
           password_hash = ?, password_set_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(clean(payload.name || email, 160), role, workspaceId, passwordHash, timestamp, timestamp, userId)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, name, role, workspace_id, status, password_hash, password_set_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`
    )
      .bind(userId, email, clean(payload.name || email, 160), role, workspaceId, passwordHash, timestamp, timestamp, timestamp)
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO workspace_members (
      id, workspace_id, user_id, role, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?)
     ON CONFLICT(workspace_id, user_id) DO UPDATE SET
      role = excluded.role,
      status = 'active',
      updated_at = excluded.updated_at`
  )
    .bind(crypto.randomUUID(), workspaceId, userId, membershipRole, timestamp, timestamp)
    .run();

  const existingPersona = await env.DB.prepare(
    "SELECT id FROM personas WHERE workspace_id = ? AND user_id = ? AND persona_type = ? LIMIT 1"
  )
    .bind(workspaceId, userId, role)
    .first();

  if (existingPersona?.id) {
    await env.DB.prepare(
      `UPDATE personas
       SET display_name = ?, status = 'active', metadata_json = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        clean(payload.display_name || payload.name || email, 160),
        JSON.stringify({ bootstrap: true, membership_role: membershipRole }),
        timestamp,
        existingPersona.id
      )
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO personas (
        id, workspace_id, user_id, persona_type, display_name, status, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        userId,
        role,
        clean(payload.display_name || payload.name || email, 160),
        JSON.stringify({ bootstrap: true, membership_role: membershipRole }),
        timestamp,
        timestamp
      )
      .run();
  }

  const session = await createSession(env, request, userId, workspaceId);
  return json(
    {
      ok: true,
      token: session.token,
      expires_at: session.expires_at,
      user_id: userId,
      workspace_id: workspaceId,
      role,
      membership_role: membershipRole
    },
    201,
    { "Set-Cookie": sessionCookie(session.token, request) }
  );
}
