import {
  clean,
  createNneSession,
  enforceNneRateLimit,
  getIp,
  hashNnePassword,
  isValidEmail,
  isValidUsername,
  jsonError,
  jsonOk,
  nneSessionCookie,
  normalizeEmail,
  normalizeUsername,
  now,
  onOptions,
  readJson,
  requireNneDb,
  writeNneAudit
} from "../../../_lib/nne-api.js";

const reservedUsernames = new Set([
  "admin",
  "api",
  "boostr",
  "boostrlabs",
  "nne",
  "nnecommunity",
  "nosotrosnoellos",
  "root",
  "support"
]);

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const allowed = await enforceNneRateLimit(env, `signup:${getIp(request) || "unknown"}`, 8, 60 * 60);
  if (!allowed) {
    return jsonError("nne_signup_rate_limited", "Demasiados intentos. Intenta nuevamente más tarde.", 429);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  // Honeypot for basic automated signup spam. Real clients leave it empty.
  if (clean(payload.company_website, 300)) {
    return jsonOk({ message: "Cuenta creada." }, 201);
  }

  const name = clean(payload.name || payload.display_name, 100);
  const email = normalizeEmail(payload.email);
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");
  const referralCode = clean(payload.referral_code, 80).toLowerCase();

  if (name.length < 2) {
    return jsonError("nne_name_required", "Escribe tu nombre o nombre artístico.", 400, { fields: ["name"] });
  }
  if (!isValidEmail(email)) {
    return jsonError("nne_invalid_email", "Escribe un email válido.", 400, { fields: ["email"] });
  }
  if (!isValidUsername(username) || reservedUsernames.has(username)) {
    return jsonError(
      "nne_invalid_username",
      "Usa entre 3 y 32 letras minúsculas, números, guion o guion bajo.",
      400,
      { fields: ["username"] }
    );
  }
  if (password.length < 10 || password.length > 200) {
    return jsonError("nne_weak_password", "La contraseña debe tener al menos 10 caracteres.", 400, {
      fields: ["password"]
    });
  }

  const existing = await env.DB.prepare(
    "SELECT id, email, username FROM nne_users WHERE lower(email) = ? OR username = ? LIMIT 1"
  )
    .bind(email, username)
    .first();
  if (existing?.id) {
    if (String(existing.email).toLowerCase() === email) {
      return jsonError("nne_email_taken", "Ese email ya está registrado.", 409, { fields: ["email"] });
    }
    return jsonError("nne_username_taken", "Ese username no está disponible.", 409, { fields: ["username"] });
  }

  let referredBy = null;
  if (referralCode) {
    referredBy = await env.DB.prepare(
      `SELECT c.referral_code, c.referrer_user_id, u.username, u.display_name
       FROM nne_referral_codes c
       JOIN nne_users u ON u.id = c.referrer_user_id
       WHERE c.referral_code = ?
         AND c.status = 'active'
         AND u.status = 'active'
       LIMIT 1`
    )
      .bind(referralCode)
      .first();
    if (!referredBy?.referrer_user_id) {
      return jsonError("nne_invalid_referral", "Ese enlace de invitación ya no está disponible.", 400, {
        fields: ["referral_code"]
      });
    }
  }

  const timestamp = now();
  const userId = crypto.randomUUID();
  const referralEventId = referredBy ? crypto.randomUUID() : null;
  const ownReferralCode = `NNE-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const passwordHash = await hashNnePassword(password);
  const referralReward = referredBy
    ? await env.DB.prepare(
        `SELECT reward_credits, reward_xp
         FROM nne_quests
         WHERE id = 'quest_referral_artist' AND status = 'published'
         LIMIT 1`
      ).first()
    : null;
  const referralCredits = referredBy ? Number(referralReward?.reward_credits || 500) : 0;
  const referralXp = referredBy ? Number(referralReward?.reward_xp || 500) : 0;
  const startingLevel = 1 + Math.floor(referralXp / 1000);

  let role = "member";
  const suppliedBootstrapSecret = clean(payload.admin_bootstrap_secret, 300);
  const configuredBootstrapSecret = clean(env.NNE_BOOTSTRAP_SECRET, 300);
  if (configuredBootstrapSecret && suppliedBootstrapSecret === configuredBootstrapSecret) {
    const currentAdmin = await env.DB.prepare(
      "SELECT id FROM nne_users WHERE role = 'admin' AND status = 'active' LIMIT 1"
    ).first();
    if (!currentAdmin?.id) role = "admin";
  }

  const statements = [
    env.DB.prepare(
      `INSERT INTO nne_users (
        id, email, username, display_name, password_hash, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).bind(userId, email, username, name, passwordHash, role, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_profiles (
        user_id, level, xp, streak_days, nne_score, title, completed_quest_count, created_at, updated_at
      ) VALUES (?, ?, ?, 0, 0, 'New Wave', 0, ?, ?)`
    ).bind(userId, startingLevel, referralXp, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_referral_codes (
        referral_code, referrer_user_id, status, created_at, updated_at
      ) VALUES (?, ?, 'active', ?, ?)`
    ).bind(ownReferralCode, userId, timestamp, timestamp)
  ];

  if (referredBy?.referrer_user_id && referralEventId) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO nne_referral_events (
          id, referrer_user_id, referred_user_id, referral_code, status,
          reward_credits_each, reward_xp_each, created_at, rewarded_at
        ) VALUES (?, ?, ?, ?, 'rewarded', ?, ?, ?, ?)`
      ).bind(
        referralEventId,
        referredBy.referrer_user_id,
        userId,
        referredBy.referral_code,
        referralCredits,
        referralXp,
        timestamp,
        timestamp
      ),
      env.DB.prepare(
        `INSERT INTO nne_credit_transactions (
          id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
        ) VALUES (?, ?, ?, 'referral_reward', 'referral_inviter', ?, ?, NULL, ?)`
      ).bind(
        crypto.randomUUID(),
        referredBy.referrer_user_id,
        referralCredits,
        referralEventId,
        `Invitación completada por @${username}`,
        timestamp
      ),
      env.DB.prepare(
        `INSERT INTO nne_credit_transactions (
          id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
        ) VALUES (?, ?, ?, 'referral_reward', 'referral_welcome', ?, ?, NULL, ?)`
      ).bind(
        crypto.randomUUID(),
        userId,
        referralCredits,
        referralEventId,
        `Bonus de bienvenida por invitación de @${referredBy.username}`,
        timestamp
      ),
      env.DB.prepare(
        `UPDATE nne_profiles
         SET xp = xp + ?,
             level = 1 + CAST((xp + ?) / 1000 AS INTEGER),
             completed_quest_count = completed_quest_count + 1,
             nne_score = MIN(100, nne_score + 1),
             updated_at = ?
         WHERE user_id = ?`
      ).bind(referralXp, referralXp, timestamp, referredBy.referrer_user_id),
      env.DB.prepare(
        `INSERT INTO nne_feed_events (
          id, user_id, event_type, message, visibility, source_type, source_id, created_at
        ) VALUES (?, ?, 'referral_completed', ?, 'public', 'referral_event', ?, ?)`
      ).bind(
        crypto.randomUUID(),
        referredBy.referrer_user_id,
        `@${referredBy.username} y @${username} ganaron ${referralCredits} NNE Credits por moverse juntos.`,
        referralEventId,
        timestamp
      )
    );
  }

  await env.DB.batch(statements);
  const session = await createNneSession(env, request, userId);
  await env.DB.prepare("UPDATE nne_users SET last_login_at = ? WHERE id = ?")
    .bind(timestamp, userId)
    .run();
  await writeNneAudit(env, request, userId, "auth.signup", "nne_user", userId, {
    role,
    referred: Boolean(referredBy?.referrer_user_id),
    referrer_user_id: referredBy?.referrer_user_id || null,
    referral_credits_each: referralCredits,
    referral_xp_each: referralXp
  });

  return jsonOk(
    {
      user: {
        id: userId,
        email,
        username,
        handle: `@${username}`,
        name,
        role,
        level: startingLevel,
        xp: referralXp,
        streak_days: 0,
        nne_score: 0,
        title: "New Wave",
        completed_quest_count: 0,
        credits: referralCredits
      },
      referral_code: ownReferralCode,
      referral_bonus: referredBy
        ? {
            referrer_handle: `@${referredBy.username}`,
            credits: referralCredits,
            xp: referralXp
          }
        : null,
      redirect: role === "admin" ? "/nne-community/admin" : "/nne-community/"
    },
    201,
    { "Set-Cookie": nneSessionCookie(session.token, request) }
  );
}
