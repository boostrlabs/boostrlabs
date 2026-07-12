import { clean, json, jsonError, now, requireDb, requireSession, requireWorkspaceAccess } from "../_lib/api.js";

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_requests (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    requested_by_user_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_requests_workspace ON admin_requests(workspace_id, created_at DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status, created_at DESC)").run();
}

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;
  const payload = await request.json().catch(() => null);
  if (!payload) return jsonError("invalid_json", "Invalid JSON body.", 400);

  const workspaceId = clean(payload.workspace_id, 120);
  if (!workspaceId) return jsonError("workspace_required", "Selecciona un workspace.", 400);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;

  const requestType = clean(payload.request_type || "general", 80);
  const title = clean(payload.title || "Solicitud para BOOSTR Admin", 220);
  const details = clean(payload.details || "", 2000) || null;
  const id = crypto.randomUUID();
  const timestamp = now();

  await ensureSchema(env);
  await env.DB.prepare(`INSERT INTO admin_requests
    (id, workspace_id, requested_by_user_id, request_type, title, details, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`)
    .bind(id, workspaceId, auth.user.id, requestType, title, details, timestamp, timestamp).run();

  return json({ ok: true, request: { id, workspace_id: workspaceId, request_type: requestType, title, details, status: "open", created_at: timestamp } }, 201);
}
