import {
  authCanSeeAll,
  clean,
  clearSessionCookie,
  createSession,
  isValidEmail,
  json,
  jsonError,
  readJson,
  requireDb,
  requireSession,
  sessionCookie,
  verifyPassword,
  now
} from "../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function sessionPayload(env, auth) {
  const activeWorkspaceId = auth.active_workspace_id;
  const activeMembership = auth.memberships.find((item) => item.workspace_id === activeWorkspaceId) || null;
  const moduleQuery = activeWorkspaceId
    ? env.DB.prepare(
        `SELECT modules.slug, modules.name, modules.category,
                COALESCE(workspace_modules.status, 'locked') AS status
         FROM modules
         LEFT JOIN workspace_modules
           ON workspace_modules.module_id = modules.id
          AND workspace_modules.workspace_id = ?
         ORDER BY modules.category, modules.name`
      ).bind(activeWorkspaceId)
    : env.DB.prepare(
        `SELECT slug, name, category, status
         FROM modules
         ORDER BY category, name`
      );

  const modules = await moduleQuery.all();

  return {
    user: auth.user,
    role: activeMembership?.role || auth.roles[0] || auth.user.role,
    roles: auth.roles,
    workspaces: auth.memberships.map((item) => ({
      id: item.workspace_id,
      name: item.workspace_name,
      type: item.workspace_type,
      slug: item.workspace_slug,
      role: item.role
    })),
    active_workspace: activeWorkspaceId
      ? {
          id: activeWorkspaceId,
          name: activeMembership?.workspace_name || null,
          type: activeMembership?.workspace_type || null,
          slug: activeMembership?.workspace_slug || null
        }
      : null,
    visible_modules: modules.results || []
  };
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  return json({ ok: true, ...(await sessionPayload(env, auth)) });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const email = clean(payload.email, 180).toLowerCase();
  const password = clean(payload.password, 500);
  if (!email || !password) {
    return jsonError("credentials_required", "Email and password are required.", 400, { fields: ["email", "password"] });
  }
  if (!isValidEmail(email)) {
    return jsonError("invalid_email", "Use a valid email address.", 400, { fields: ["email"] });
  }

  const user = await env.DB.prepare(
    `SELECT id, email, name, role, workspace_id, status, password_hash
     FROM users
     WHERE lower(email) = ?
     LIMIT 1`
  )
    .bind(email)
    .first();

  if (!user?.id || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return jsonError("invalid_credentials", "Invalid email or password.", 401);
  }
  if (user.status && !["active", "invited"].includes(user.status)) {
    return jsonError("user_inactive", "User is not active.", 403);
  }

  const memberships = await env.DB.prepare(
    `SELECT workspace_members.workspace_id, workspace_members.role, workspace_members.status,
            workspaces.name AS workspace_name, workspaces.type AS workspace_type, workspaces.slug AS workspace_slug
     FROM workspace_members
     LEFT JOIN workspaces ON workspaces.id = workspace_members.workspace_id
     WHERE workspace_members.user_id = ?
       AND workspace_members.status = 'active'
     ORDER BY workspace_members.created_at ASC`
  )
    .bind(user.id)
    .all();

  const roles = [...new Set([user.role, ...(memberships.results || []).map((item) => item.role)].filter(Boolean))];
  const requestedWorkspaceId = clean(payload.active_workspace_id || payload.workspace_id, 120);
  let activeWorkspaceId = requestedWorkspaceId || user.workspace_id || memberships.results?.[0]?.workspace_id || null;
  const authPreview = { roles, memberships: memberships.results || [] };

  if (requestedWorkspaceId && !authCanSeeAll(authPreview)) {
    const allowed = memberships.results?.some((item) => item.workspace_id === requestedWorkspaceId);
    if (!allowed) return jsonError("workspace_access_denied", "Workspace access denied.", 403);
  }
  if (requestedWorkspaceId && authCanSeeAll(authPreview)) {
    const workspace = await env.DB.prepare("SELECT id FROM workspaces WHERE id = ? LIMIT 1").bind(requestedWorkspaceId).first();
    if (!workspace?.id) return jsonError("workspace_not_found", "Workspace not found.", 404);
  }

  await env.DB.prepare("UPDATE users SET last_login_at = ?, status = CASE WHEN status = 'invited' THEN 'active' ELSE status END, updated_at = ? WHERE id = ?")
    .bind(now(), now(), user.id)
    .run();

  const session = await createSession(env, request, user.id, activeWorkspaceId);
  const auth = await requireSession(new Request(request.url, { headers: { Authorization: `Bearer ${session.token}` } }), env);
  if (!auth.ok) return auth.response;

  return json(
    {
      ok: true,
      token: session.token,
      expires_at: session.expires_at,
      ...(await sessionPayload(env, auth))
    },
    201,
    { "Set-Cookie": sessionCookie(session.token, request) }
  );
}

export async function onRequestDelete({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  if (auth.session?.id) {
    const timestamp = now();
    await env.DB.prepare("UPDATE sessions SET status = 'revoked', revoked_at = ?, updated_at = ? WHERE id = ?")
      .bind(timestamp, timestamp, auth.session.id)
      .run();
  }

  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(request) });
}
