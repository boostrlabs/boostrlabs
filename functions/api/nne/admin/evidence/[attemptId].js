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
import { awardNneCreditsWithDailyCap, completeNneQuest } from "../../../../_lib/nne-community.js";

export const onRequestOptions = onOptions;

const QUALITY_BONUS = Object.freeze({ completed: 0, good: 0.25, standout: 0.5, exceptional: 1 });
const PERFORMANCE_BONUS = Object.freeze({ normal: 0, strong: 0.25, breakout: 0.5, viral: 1 });
const SISISI_FLASH_QUEST_ID = "nne_sisisi_10_comments_flash";
const SISISI_FLASH_LIMIT = 8;

async function ensureLimitedQuestClaims(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_limited_quest_claims (
    id TEXT PRIMARY KEY,
    quest_id TEXT NOT NULL REFERENCES nne_quests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
    attempt_id TEXT NOT NULL UNIQUE REFERENCES nne_quest_attempts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position > 0),
    reward_credits REAL NOT NULL CHECK (reward_credits > 0),
    created_at TEXT NOT NULL,
    UNIQUE(quest_id,user_id),
    UNIQUE(quest_id,position)
  )`).run();
}

async function reserveFlashSlot(env, attempt, timestamp) {
  await ensureLimitedQuestClaims(env);
  const existing = await env.DB.prepare(
    `SELECT position FROM nne_limited_quest_claims WHERE quest_id=? AND user_id=? LIMIT 1`
  ).bind(SISISI_FLASH_QUEST_ID, attempt.user_id).first();
  if (existing?.position) return Number(existing.position);

  try {
    await env.DB.prepare(`INSERT INTO nne_limited_quest_claims (
      id,quest_id,user_id,attempt_id,position,reward_credits,created_at
    )
    SELECT ?,?,?,?,COALESCE(MAX(position),0)+1,3,?
    FROM nne_limited_quest_claims
    WHERE quest_id=?
    HAVING COUNT(*) < ?`)
      .bind(
        crypto.randomUUID(),
        SISISI_FLASH_QUEST_ID,
        attempt.user_id,
        attempt.id,
        timestamp,
        SISISI_FLASH_QUEST_ID,
        SISISI_FLASH_LIMIT
      )
      .run();
  } catch {}

  const claim = await env.DB.prepare(
    `SELECT position FROM nne_limited_quest_claims WHERE quest_id=? AND user_id=? LIMIT 1`
  ).bind(SISISI_FLASH_QUEST_ID, attempt.user_id).first();
  return claim?.position ? Number(claim.position) : null;
}

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
  let baseCredits = 0;
  let quality = "completed";
  let performance = "normal";
  let limitedPosition = null;

  if (action === "approve") {
    const isSisisiFlash = attempt.quest_id === SISISI_FLASH_QUEST_ID;
    if (isSisisiFlash) {
      limitedPosition = await reserveFlashSlot(env, attempt, timestamp);
      if (!limitedPosition) {
        return jsonError(
          "nne_flash_chamba_full",
          "Los 8 cupos premiados de esta chamba ya fueron acreditados.",
          409,
          { limit: SISISI_FLASH_LIMIT }
        );
      }
    }

    quality = clean(parsed.payload?.quality || "completed", 20).toLowerCase();
    performance = clean(parsed.payload?.performance || "normal", 20).toLowerCase();
    if (!(quality in QUALITY_BONUS)) quality = "completed";
    if (!(performance in PERFORMANCE_BONUS)) performance = "normal";
    bonusCredits = isSisisiFlash ? 0 : QUALITY_BONUS[quality] + PERFORMANCE_BONUS[performance];

    try {
      const base = await completeNneQuest(env, {
        attemptId: attempt.id,
        userId: attempt.user_id,
        quest: attempt,
        actorUserId: auth.user.id,
        completionStatus: "approved",
        bypassDailyCap: isSisisiFlash
      });
      baseCredits = base.credited;
    } catch (error) {
      if (isSisisiFlash) {
        await env.DB.prepare(
          `DELETE FROM nne_limited_quest_claims WHERE quest_id=? AND attempt_id=?`
        ).bind(SISISI_FLASH_QUEST_ID, attempt.id).run().catch(() => undefined);
      }
      throw error;
    }

    if (bonusCredits > 0) {
      bonusCredits = await awardNneCreditsWithDailyCap(env, {
        userId: attempt.user_id,
        amount: bonusCredits,
        kind: "admin_adjustment",
        sourceType: "season_bonus",
        sourceId: `${attempt.id}:bonus`,
        description: `Season 001 bonus · Creativity ${quality} · Performance ${performance}`,
        actorUserId: auth.user.id,
        timestamp
      });
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
    {
      quest_id: attempt.quest_id,
      user_id: attempt.user_id,
      quality,
      performance,
      bonus_credits: bonusCredits,
      limited_position: limitedPosition
    }
  );

  return jsonOk({
    attempt: {
      id: attempt.id,
      status: action === "approve" ? "approved" : "rejected",
      reviewed_at: timestamp,
      base_credits: action === "approve" ? baseCredits : 0,
      bonus_credits: action === "approve" ? bonusCredits : 0,
      total_credits: action === "approve" ? baseCredits + bonusCredits : 0,
      quality,
      performance,
      limited_position: limitedPosition,
      limited_total: limitedPosition ? SISISI_FLASH_LIMIT : null
    }
  });
}
