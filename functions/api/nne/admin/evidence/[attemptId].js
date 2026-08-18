import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import { completeNneQuest } from "../../../../_lib/nne-community.js";

export const onRequestOptions = onOptions;

const QUALITY_BONUS = Object.freeze({ completed: 0, good: 250, standout: 1500, exceptional: 5000 });
const PERFORMANCE_BONUS = Object.freeze({ normal: 0, strong: 1000, breakout: 7500, viral: 25000 });

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const action = clean(parsed.payload?.action, 20).toLowerCase();
  if (!["approve", "reject"].includes(action)) {
    return jsonError("nne_review_action_invalid", "Selecciona aprobar o rechazar.", 400);
  }

  const attempt = await env.DB.prepare(
    `SELECT a.*, q.title, q.reward_credits, q.reward_xp
     FROM nne_quest_attempts a
     JOIN nne_quests q ON q.id = a.quest_id
     WHERE a.id = ? AND a.status = 'pending'
     LIMIT 1`
  )
    .bind(clean(params.attemptId, 120))
    .first();
  if (!attempt?.id) {
    return jsonError("nne_evidence_not_pending", "Esta evidencia ya fue revisada o no existe.", 409);
  }

  const timestamp = now();
  let bonusCredits = 0;
  let quality = "completed";
  let performance = "normal";

  if (action === "approve") {
    quality = clean(parsed.payload?.quality || "completed", 20).toLowerCase();
    performance = clean(parsed.payload?.performance || "normal", 20).toLowerCase();
    if (!(quality in QUALITY_BONUS)) quality = "completed";
    if (!(performance in PERFORMANCE_BONUS)) performance = "normal";
    bonusCredits = QUALITY_BONUS[quality] + PERFORMANCE_BONUS[performance];

    await completeNneQuest(env, {
      attemptId: attempt.id,
      userId: attempt.user_id,
      quest: attempt,
      actorUserId: auth.user.id,
      completionStatus: "approved"
    });

    if (bonusCredits > 0) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO nne_credit_transactions (
          id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
        ) VALUES (?, ?, ?, 'admin_adjustment', 'season_bonus', ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), attempt.user_id, bonusCredits, `${attempt.id}:bonus`,
        `Season 001 bonus · Creativity ${quality} · Performance ${performance}`,
        auth.user.id, timestamp
      ).run();
    }
  } else {
    const reason = clean(parsed.payload?.reason, 500);
    if (!reason) {
      return jsonError("nne_rejection_reason_required", "Explica brevemente por qué se rechazó.", 400, { fields: ["reason"] });
    }
    await env.DB.prepare(
      `UPDATE nne_quest_attempts
       SET status = 'rejected', rejection_reason = ?, reviewed_at = ?,
           reviewed_by = ?, updated_at = ?
       WHERE id = ? AND status = 'pending'`
    )
      .bind(reason, timestamp, auth.user.id, timestamp, attempt.id)
      .run();
  }

  await writeNneAudit(
    env,
    request,
    auth.user.id,
    action === "approve" ? "evidence.approved" : "evidence.rejected",
    "nne_quest_attempt",
    attempt.id,
    { quest_id: attempt.quest_id, user_id: attempt.user_id, quality, performance, bonus_credits: bonusCredits }
  );

  return jsonOk({
    attempt: {
      id: attempt.id,
      status: action === "approve" ? "approved" : "rejected",
      reviewed_at: timestamp,
      base_credits: action === "approve" ? Number(attempt.reward_credits) : 0,
      bonus_credits: action === "approve" ? bonusCredits : 0,
      total_credits: action === "approve" ? Number(attempt.reward_credits) + bonusCredits : 0,
      quality,
      performance
    }
  });
}
