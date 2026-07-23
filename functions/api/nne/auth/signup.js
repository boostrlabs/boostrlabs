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
      `SELECT r.id, r.referrer_user_id
       FROM nne_referrals r
       JOIN nne_users u ON u.id = r.referrer_user_id
       WHERE r.referral_code = ?
         AND r.status = 'invited'
         AND r.referred_user_id IS NULL
         AND u.status = 'active'
       LIMIT 1`
    )
      .bind(referralCode)
      .first();
    if (!referredBy?.id) {
      return jsonError("nne_invalid_referral", "Ese enlace de invitación ya no está disponible.", 400, {
        fields: ["referral_code"]
      });
    }
  }

  const timestamp = now();
  const userId = crypto.randomUUID();
  const ownReferralId = crypto.randomUUID();
  const ownReferralCode = `${username}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
  const passwordHash = await hashNnePassword(password);

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
      ) VALUES (?, 1, 0, 0, 0, 'New Wave', 0, ?, ?)`
    ).bind(userId, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_referrals (
        id, referrer_user_id, referred_user_id, referral_code, status, created_at
      ) VALUES (?, ?, NULL, ?, 'invited', ?)`
    ).bind(ownReferralId, userId, ownReferralCode, timestamp)
  ];

  if (referredBy?.id) {
    const referralReward = await env.DB.prepare(
      "SELECT reward_credits FROM nne_quests WHERE id = 'quest_referral_artist' AND status = 'published'"
    ).first();
    const amount = Number(referralReward?.reward_credits || 500);
    statements.push(
      env.DB.prepare(
        `UPDATE nne_referrals
         SET referred_user_id = ?, status = 'rewarded', qualified_at = ?, rewarded_at = ?
         WHERE id = ? AND referred_user_id IS NULL AND status = 'invited'`
      ).bind(userId, timestamp, timestamp, referredBy.id),
      env.DB.prepare(
        `INSERT INTO nne_credit_transactions (
          id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
        ) VALUES (?, ?, ?, 'referral_reward', 'referral', ?, ?, NULL, ?)`
      ).bind(
        crypto.randomUUID(),
        referredBy.referrer_user_id,
        amount,
        referredBy.id,
        `Invitación completada por @${username}`,
        timestamp
      ),
      env.DB.prepare(
        `INSERT INTO nne_feed_events (
          id, user_id, event_type, message, visibility, source_type, source_id, created_at
        ) VALUES (?, ?, 'referral_completed', ?, 'public', 'referral', ?, ?)`
      ).bind(
        crypto.randomUUID(),
        referredBy.referrer_user_id,
        `@${username} se unió a NNE Community mediante una invitación.`,
        referredBy.id,
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
    referred: Boolean(referredBy?.id)
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
        level: 1,
        xp: 0,
        streak_days: 0,
        nne_score: 0,
        title: "New Wave",
        completed_quest_count: 0,
        credits: 0
      },
      referral_code: ownReferralCode,
      redirect: role === "admin" ? "/nne-community/admin" : "/nne-community/"
    },
    201,
    { "Set-Cookie": nneSessionCookie(session.token, request) }
  );
}
