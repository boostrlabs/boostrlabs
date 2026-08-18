import { jsonOk } from "../../../_lib/nne-api.js";
import { requireNneReviewer, reviewerCanAccess } from "../../../_lib/nne-reviewer.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneReviewer(request, env);
  if (!auth.ok) return auth.response;

  const rows = await env.DB.prepare(
    `SELECT a.id, a.quest_id, a.status, a.evidence_note, a.evidence_content_type,
            a.evidence_original_name, a.submitted_at, q.title AS quest_title,
            q.reward_credits, u.username, u.display_name
     FROM nne_quest_attempts a
     JOIN nne_quests q ON q.id = a.quest_id
     JOIN nne_users u ON u.id = a.user_id
     WHERE a.status = 'pending' AND a.evidence_r2_key IS NOT NULL
     ORDER BY a.submitted_at ASC
     LIMIT 100`
  ).all();

  const items = (rows.results || [])
    .filter((row) => reviewerCanAccess(auth.scopes, row.quest_id))
    .map((row) => ({
      id: row.id,
      quest_id: row.quest_id,
      quest_title: row.quest_title,
      reward_credits: Number(row.reward_credits),
      note: row.evidence_note || null,
      submitted_at: row.submitted_at,
      user: { username: row.username, handle: `@${row.username}`, name: row.display_name },
      evidence_url: `/api/nne/review/evidence/${row.id}/file`
    }));

  return jsonOk({ scopes: auth.scopes, items });
}
