import { createNneCappedCreditStatement } from "./nne-community.js";
import { now } from "./nne-api.js";
import { promoteApplicationRegistrationProfile } from "./nne-registration.js";

export async function activateNneApplication(env, application, {
  role = "member",
  reviewerId = null,
  reviewNote = null,
  timestamp = now()
} = {}) {
  const duplicate = await env.DB.prepare(
    `SELECT id FROM nne_users WHERE lower(email) = lower(?) OR username = ? LIMIT 1`
  ).bind(application.email, application.username).first();
  if (duplicate?.id) {
    const error = new Error("El email o username ya pertenece a una cuenta.");
    error.code = "nne_application_identity_taken";
    throw error;
  }

  const safeRole = role === "admin" ? "admin" : "member";
  const userId = crypto.randomUUID();
  const ownReferralCode = `NNE-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
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
  const referralCredits = referral ? Math.min(3, Number(referralReward?.reward_credits || 3)) : 0;
  const referralXp = referral ? Math.min(100, Number(referralReward?.reward_xp || 100)) : 0;

  const statements = [
    env.DB.prepare(
      `INSERT INTO nne_users (
         id,email,username,display_name,password_hash,role,status,email_verified_at,created_at,updated_at
       ) VALUES (?,?,?,?,?,?, 'active',?,?,?)`
    ).bind(
      userId,
      application.email,
      application.username,
      application.display_name,
      application.password_hash,
      safeRole,
      application.email_verified_at || timestamp,
      timestamp,
      timestamp
    ),
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
    ).bind(reviewNote || null, reviewerId, timestamp, userId, timestamp, application.id)
  ];

  if (referral?.referrer_user_id) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO nne_referral_events (id,referrer_user_id,referred_user_id,referral_code,status,reward_credits_each,reward_xp_each,created_at,rewarded_at)
         VALUES (?,?,?,?,'rewarded',?,?,?,?)`
      ).bind(referralEventId, referral.referrer_user_id, userId, referral.referral_code, referralCredits, referralXp, timestamp, timestamp),
      createNneCappedCreditStatement(env, {
        userId: referral.referrer_user_id,
        amount: referralCredits,
        kind: "referral_reward",
        sourceType: "referral_inviter",
        sourceId: referralEventId,
        description: `Invitación aprobada de @${application.username}`,
        actorUserId: reviewerId,
        timestamp
      }),
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
      ).bind(crypto.randomUUID(), reviewerId, promoClaimId)
    );
  }

  if (application.admin_invite_id && safeRole === "admin") {
    statements.push(
      env.DB.prepare(
        `UPDATE nne_admin_invites
         SET status='used', used_by=?, used_at=?
         WHERE id=? AND status='active'`
      ).bind(userId, timestamp, application.admin_invite_id)
    );
  }

  await env.DB.batch(statements);
  await promoteApplicationRegistrationProfile(env, application.id, userId, timestamp);

  return {
    userId,
    role: safeRole,
    referralApplied: Boolean(referral?.referrer_user_id),
    promoCode: application.promo_code || null
  };
}
