import { clean, defaultWorkspaceId, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../_lib/api.js";
import { customOsRoles } from "../_lib/custom-os.js";

const visibilitySet = new Set(["private", "workspace", "client_visible", "public_link"]);
const typeSet = new Set(["link", "document", "image", "audio", "video", "contract", "deliverable", "proof", "other"]);
const cols = "id, workspace_id, uploaded_by_user_id, related_type, related_id, title, file_url, file_type, visibility, status, metadata_json, created_at, updated_at";
const limit = (v) => Math.min(Math.max(Number(v || 50) || 50, 1), 100);
const meta = (v) => { try { return JSON.stringify(typeof v === "string" ? JSON.parse(v) : (v || {})); } catch { return JSON.stringify({ note: clean(v, 800) }); } };
function resolveWorkspace(auth, requested) { const workspaceId = clean(requested, 120) || defaultWorkspaceId(auth); const access = requireWorkspaceAccess(auth, workspaceId); if (!access.ok) return { ok: false, response: access.response }; return { ok: true, workspace_id: workspaceId }; }

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const db = requireDb(env); if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles); if (!auth.ok) return auth.response;
  const url = new URL(request.url); const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id")); if (!workspace.ok) return workspace.response;
  const filters = ["workspace_id = ?", "status = 'active'"]; const binds = [workspace.workspace_id];
  const q = clean(url.searchParams.get("q"), 120).toLowerCase(); const relatedType = clean(url.searchParams.get("related_type"), 80);
  if (q) { filters.push("(lower(title) LIKE ? OR lower(file_url) LIKE ?)"); binds.push(`%${q}%`, `%${q}%`); }
  if (relatedType) { filters.push("related_type = ?"); binds.push(relatedType); }
  const result = await env.DB.prepare(`SELECT ${cols} FROM workspace_files WHERE ${filters.join(" AND ")} ORDER BY created_at DESC LIMIT ?`).bind(...binds, limit(url.searchParams.get("limit"))).all();
  return json({ ok: true, workspace_id: workspace.workspace_id, files: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env); if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles); if (!auth.ok) return auth.response;
  const parsed = await readJson(request); if (!parsed.ok) return parsed.response;
  const p = parsed.payload || {}; const workspace = resolveWorkspace(auth, p.workspace_id); if (!workspace.ok) return workspace.response;
  const title = clean(p.title || p.name, 180); if (!title) return jsonError("file_title_required", "File title is required.", 400, { fields: ["title"] });
  const fileType = typeSet.has(clean(p.file_type, 40)) ? clean(p.file_type, 40) : "link";
  const visibility = visibilitySet.has(clean(p.visibility, 40)) ? clean(p.visibility, 40) : "workspace";
  const id = crypto.randomUUID(); const timestamp = now();
  await env.DB.prepare(`INSERT INTO workspace_files (id, workspace_id, uploaded_by_user_id, related_type, related_id, title, file_url, file_type, visibility, status, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`).bind(id, workspace.workspace_id, auth.user?.id || null, clean(p.related_type, 80) || null, clean(p.related_id, 120) || null, title, clean(p.file_url || p.url, 1200), fileType, visibility, meta(p.metadata), timestamp, timestamp).run();
  return json({ ok: true, file: { id, workspace_id: workspace.workspace_id, title, file_type: fileType, visibility, status: "active" } }, 201);
}
