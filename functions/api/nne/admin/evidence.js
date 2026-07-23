import { jsonOk, requireNneAdmin } from "../../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";
  const allowed = new Set(["pending", "approved", "rejected", "all"]);
  const selected = allowed.has(status) ? status : "pending";
  const query = selected === "all"
    ? env.DB.prepare(
        `SELECT a.*, q.title AS quest_title, q.reward_credits,
                u.username, u.display_name
         FROM nne_quest_attempts a
         JOIN nne_quests q ON q.id = a.quest_id
         JOIN nne_users u ON u.id = a.user_id
         WHERE a.evidence_r2_key IS NOT NULL
         ORDER BY COALESCE(a.submitted_at, a.created_at) DESC
         LIMIT 100`
      )
    : env.DB.prepare(
        `SELECT a.*, q.title AS quest_title, q.reward_credits,
                u.username, u.display_name
         FROM nne_quest_attempts a
         JOIN nne_quests q ON q.id = a.quest_id
         JOIN nne_users u ON u.id = a.user_id
         WHERE a.evidence_r2_key IS NOT NULL AND a.status = ?
         ORDER BY COALESCE(a.submitted_at, a.created_at) DESC
         LIMIT 100`
      ).bind(selected);
  const result = await query.all();

  return jsonOk({
    items: (result.results || []).map((row) => ({
      id: row.id,
      quest_id: row.quest_id,
      quest_title: row.quest_title,
      reward_credits: Number(row.reward_credits),
      status: row.status,
      note: row.evidence_note || null,
      content_type: row.evidence_content_type,
      original_name: row.evidence_original_name,
      submitted_at: row.submitted_at,
      reviewed_at: row.reviewed_at,
      rejection_reason: row.rejection_reason || null,
      user: {
        id: row.user_id,
        username: row.username,
        handle: `@${row.username}`,
        name: row.display_name
      },
      evidence_url: `/api/nne/admin/evidence/${row.id}/file`
    }))
  });
}
