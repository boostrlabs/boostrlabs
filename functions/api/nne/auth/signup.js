import {
  clean,
  enforceNneRateLimit,
  getIp,
  hashNnePassword,
  isValidEmail,
  isValidUsername,
  jsonError,
  jsonOk,
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
  const artistRole = clean(payload.artist_role, 40);
  const country = clean(payload.country, 80);
  const city = clean(payload.city, 80);
  const instagramHandle = clean(payload.instagram_handle, 100).replace(/^@/, "");
  const whatsappContact = clean(payload.whatsapp_contact, 60);
  const telegramHandle = clean(payload.telegram_handle, 100).replace(/^@/, "");
  const primaryContact = clean(payload.primary_contact, 20);
  const bio = clean(payload.bio, 800);
  const promoCode = clean(payload.promo_code, 80).toUpperCase();

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
  if (!["artist", "producer", "engineer", "designer", "manager", "fan", "other"].includes(artistRole)) {
    return jsonError("nne_artist_role_required", "Cuéntanos qué haces dentro de la música o la comunidad.", 400, { fields: ["artist_role"] });
  }
  if (!country || bio.length < 20) {
    return jsonError("nne_application_details_required", "Escribe tu país y una presentación de al menos 20 caracteres.", 400, { fields: ["country", "bio"] });
  }
  const contactValues = { instagram: instagramHandle, whatsapp: whatsappContact, telegram: telegramHandle };
  if (!Object.hasOwn(contactValues, primaryContact) || !contactValues[primaryContact]) {
    return jsonError("nne_contact_required", "Agrega al menos una vía de contacto y elige esa misma como principal.", 400, { fields: ["primary_contact"] });
  }

  const existing = await env.DB.prepare(
    `SELECT email, username FROM nne_users WHERE lower(email) = ? OR username = ?
     UNION ALL
     SELECT email, username FROM nne_access_applications WHERE lower(email) = ? OR username = ?
     LIMIT 1`
  )
    .bind(email, username, email, username)
    .first();
  if (existing?.email || existing?.username) {
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

  if (promoCode) {
    const campaign = await env.DB.prepare(
      `SELECT code FROM nne_promo_campaigns
       WHERE code = ? AND status = 'active'
         AND (starts_at IS NULL OR starts_at <= ?)
         AND (ends_at IS NULL OR ends_at > ?)
       LIMIT 1`
    ).bind(promoCode, now(), now()).first();
    if (!campaign?.code) {
      return jsonError("nne_invalid_promo", "Ese código promocional no está activo.", 400, { fields: ["promo_code"] });
    }
  }

  const timestamp = now();
  const applicationId = crypto.randomUUID();
  const passwordHash = await hashNnePassword(password);
  await env.DB.prepare(
    `INSERT INTO nne_access_applications (
      id, email, username, display_name, password_hash, artist_role, country, city,
      instagram_handle, whatsapp_contact, telegram_handle, primary_contact, bio,
      referral_code, promo_code, status, ip, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).bind(
    applicationId, email, username, name, passwordHash, artistRole, country, city || null,
    instagramHandle || null, whatsappContact || null, telegramHandle || null, primaryContact, bio,
    referredBy?.referral_code || null, promoCode || null, getIp(request), timestamp, timestamp
  ).run();
  await writeNneAudit(env, request, null, "access.application_created", "nne_access_application", applicationId, {
    username,
    referred: Boolean(referredBy?.referrer_user_id),
    promo_code: promoCode || null
  });

  return jsonOk(
    {
      application: { id: applicationId, status: "pending", username, email },
      message: "Solicitud recibida. Revisaremos tus datos y te avisaremos por tu contacto principal cuando tu acceso esté aprobado."
    },
    202
  );
}
