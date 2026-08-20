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
import { createNneCappedCreditStatement } from "../../../../_lib/nne-community.js";

export const onRequestOptions = onOptions;

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action, 20);
  const reviewNote = clean(parsed.payload?.review_note, 600);
  if (!['approve', 'reject'].includes(action)) {
    return jsonError('nne_application_action_invalid', 'Elige aprobar o rechazar la solicitud.', 400);
  }

  const application = await env.DB.prepare(
    `SELECT * FROM nne_access_applications WHERE id = ? LIMIT 1`
  ).bind(clean(params.id, 100)).first();
  if (!application?.id) return jsonError('nne_application_not_found', 'Solicitud no encontrada.', 404);
  if (application.status !== 'pending') {
    return jsonError('nne_application_already_reviewed', 'Esta solicitud ya fue revisada.', 409);
  }

  const timestamp = now();
  if (action === 'reject') {
    await env.DB.prepare(
      `UPDATE nne_access_applications
       SET status = 'rejected', review_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
       WHERE id = ? AND status = 'pending'`
    ).bind(reviewNote || null, auth.user.id, timestamp, timestamp, application.id).run();
    await writeNneAudit(env, request, auth.user.id, 'access.application_rejected', 'nne_access_application', application.id, { review_note: reviewNote || null });
    return jsonOk({ application: { id: application.id, status: 'rejected' } });
  }

  const duplicate = await env.DB.prepare(
    `SELECT id FROM nne_users WHERE lower(email) = lower(?) OR username = ? LIMIT 1`
  ).bind(application.email, application.username).first();
  if (duplicate?.id) return jsonError('nne_application_identity_taken', 'El email o username ya pertenece a una cuenta.', 409);

  const userId = crypto.randomUUID();
  const ownReferralCode = `NNE-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const referralEventId = crypto.randomUUID();
  const promoClaimId = crypto.randomUUID();
  const referral = application.referral_code
    ? await env.DB.prepare(
        `SELECT c.referral_code, c.referrer_user_id, u.username
         FROM nne_referral_codes c JOIN nne_users u ON u.id = c.referrer_user_id
         WHERE c.referral_code = ? AND c.status = 'active' AND u.status = 'active' LIMIT 1`
      ).bind(application.referral_code).first()
    : null;
  const referralReward = referral?.referrer_user_id
    ? await env.DB.prepare(
        `SELECT reward_credits, reward_xp FROM nne_quests
         WHERE id = 'quest_referral_artist' AND status = 'published' LIMIT 1`
      ).first()
    : null;
  const referralCredits = referral ? Math.min(1, Number(referralReward?.reward_credits || 1)) : 0;
  const referralXp = referral ? Math.min(100, Number(referralReward?.reward_xp || 100)) : 0;

  const statements = [
    env.DB.prepare(
      `INSERT INTO nne_users (id,email,username,display_name,password_hash,role,status,created_at,updated_at)
       VALUES (?,?,?,?,?,'member','active',?,?)`
    ).bind(userId, application.email, application.username, application.display_name, application.password_hash, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_profiles (user_id,level,xp,streak_days,nne_score,title,completed_quest_count,created_at,updated_at)
       VALUES (?,1,?,0,0,'New Wave',0,?,?)`
    ).bind(userId, referralXp, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_referral_codes (referral_code,referrer_user_id,status,created_at,updated_at)
       VALUES (?,?,'active',?,?)`
    ).bind(ownReferralCode, userId, timestamp, timestamp),
    env.DB.prepare(
      `UPDATE nne_access_applications
       SET status='approved', review_note=?, reviewed_by=?, reviewed_at=?, approved_user_id=?, updated_at=?
       WHERE id=? AND status='pending'`
    ).bind(reviewNote || null, auth.user.id, timestamp, userId, timestamp, application.id)
  ];

  if (referral?.referrer_user_id) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO nne_referral_events (id,referrer_user_id,referred_user_id,referral_code,status,reward_credits_each,reward_xp_each,created_at,rewarded_at)
         VALUES (?,?,?,?,'rewarded',?,?,?,?)`
      ).bind(referralEventId, referral.referrer_user_id, userId, referral.referral_code, referralCredits, referralXp, timestamp, timestamp),
      createNneCappedCreditStatement(env, { userId: referral.referrer_user_id, amount: referralCredits, kind: 'referral_reward', sourceType: 'referral_inviter', sourceId: referralEventId, description: `Invitación aprobada de @${application.username}`, actorUserId: auth.user.id, timestamp }),
      createNneCappedCreditStatement(env, { userId, amount: referralCredits, kind: 'referral_reward', sourceType: 'referral_welcome', sourceId: referralEventId, description: `Bienvenida por invitación de @${referral.username}`, actorUserId: auth.user.id, timestamp }),
      env.DB.prepare(
        `UPDATE nne_profiles SET xp=xp+?, level=1+CAST((xp+?)/1000 AS INTEGER), completed_quest_count=completed_quest_count+1, nne_score=MIN(100,nne_score+1), updated_at=? WHERE user_id=?`
      ).bind(referralXp, referralXp, timestamp, referral.referrer_user_id)
    );
  }

  if (application.promo_code) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO nne_promo_claims (id,campaign_code,user_id,application_id,reward_credits,created_at)
         SELECT ?,c.code,?,?,c.reward_credits,?
         FROM nne_promo_campaigns c
         WHERE c.code=? AND c.status='active'
           AND (c.starts_at IS NULL OR c.starts_at<=?) AND (c.ends_at IS NULL OR c.ends_at>?)
           AND (c.max_redemptions IS NULL OR (SELECT COUNT(*) FROM nne_promo_claims pc WHERE pc.campaign_code=c.code)<c.max_redemptions)`
      ).bind(promoClaimId, userId, application.id, timestamp, application.promo_code, timestamp, timestamp),
      env.DB.prepare(
        `INSERT INTO nne_credit_transactions (id,user_id,amount,kind,source_type,source_id,description,actor_user_id,created_at)
         SELECT ?,user_id,reward_credits,'launch_bonus','promo_campaign',id,'Bono de bienvenida · '||campaign_code,?,created_at
         FROM nne_promo_claims WHERE id=?`
      ).bind(crypto.randomUUID(), auth.user.id, promoClaimId)
    );
  }

  await env.DB.batch(statements);
  await writeNneAudit(env, request, auth.user.id, 'access.application_approved', 'nne_access_application', application.id, {
    approved_user_id: userId,
    referral_applied: Boolean(referral?.referrer_user_id),
    promo_code: application.promo_code || null
  });
  return jsonOk({ application: { id: application.id, status: 'approved', approved_user_id: userId } });
}
