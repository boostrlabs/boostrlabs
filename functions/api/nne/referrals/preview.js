import {
  clean,
  enforceNneRateLimit,
  getIp,
  jsonError,
  jsonOk,
  onOptions,
  requireNneDb
} from "../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const allowed = await enforceNneRateLimit(
    env,
    `referral-preview:${getIp(request) || "unknown"}`,
    120,
    60 * 60
  );
  if (!allowed) {
    return jsonError("nne_referral_preview_rate_limited", "Intenta nuevamente en unos minutos.", 429);
  }

  const code = clean(new URL(request.url).searchParams.get("code"), 80);
  if (!code) {
    return jsonError("nne_referral_required", "El enlace de invitación está incompleto.", 400);
  }

  const [referral, reward] = await Promise.all([
    env.DB.prepare(
      `SELECT c.referral_code, u.username, u.display_name
       FROM nne_referral_codes c
       JOIN nne_users u ON u.id = c.referrer_user_id
       WHERE c.referral_code = ?
         AND c.status = 'active'
         AND u.status = 'active'
       LIMIT 1`
    ).bind(code).first(),
    env.DB.prepare(
      `SELECT reward_credits, reward_xp
       FROM nne_quests
       WHERE id = 'quest_referral_artist' AND status = 'published'
       LIMIT 1`
    ).first()
  ]);

  if (!referral?.username) {
    return jsonError("nne_invalid_referral", "Esta invitación ya no está disponible.", 404);
  }

  return jsonOk({
    referral: {
      code: referral.referral_code,
      referrer: {
        username: referral.username,
        handle: `@${referral.username}`,
        name: referral.display_name
      },
      reward: {
        credits: Math.min(1, Number(reward?.reward_credits || 1)),
        xp: Math.min(100, Number(reward?.reward_xp || 100))
      }
    }
  });
}
