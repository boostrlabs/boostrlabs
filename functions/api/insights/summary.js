import { defaultWorkspaceId, json, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { getWorkspaceIntelligence } from "../../_lib/intelligence.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id") || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;
  const intelligence = await getWorkspaceIntelligence(env, workspaceId);
  return json({ ok: true, intelligence });
}
