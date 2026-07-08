import { defaultWorkspaceId, json, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles, insertCard } from "../../_lib/custom-os.js";
import { getWorkspaceIntelligence } from "../../_lib/intelligence.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id") || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;
  const intelligence = await getWorkspaceIntelligence(env, workspaceId);
  let created = 0;
  for (const rec of intelligence.recommendations.slice(0, 8)) {
    await insertCard(env, {
      workspace_id: workspaceId,
      user_id: auth.user?.id || null,
      source_type: "intelligence",
      source_id: rec.reason,
      card_type: rec.type,
      title: rec.title,
      summary: `${rec.summary} Reason: ${rec.reason}.`,
      priority: rec.priority,
      status: "unread",
      owner_user_id: auth.user?.id || null,
      owner_role: auth.roles?.[0] || auth.user?.role || "client",
      action_label: rec.action_label,
      action_url: rec.action_url,
      metadata: { recommendation_id: rec.id, reason: rec.reason, totals: intelligence.totals }
    });
    created += 1;
  }
  return json({ ok: true, cards_created: created, intelligence });
}
