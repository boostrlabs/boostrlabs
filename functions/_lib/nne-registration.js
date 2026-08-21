import { clean, now } from "./nne-api.js";

export const NNE_PROFESSIONS = new Set([
  "nne_fam", "artist", "producer", "composer", "beatmaker", "engineer", "songwriter", "dj",
  "a_and_r", "manager", "label", "publisher", "videographer", "video_editor", "director",
  "photographer", "designer", "3d_artist", "content_creator", "social_media", "marketing", "pr",
  "playlist_curator", "promoter", "event_producer", "dancer", "stylist", "makeup", "musician",
  "music_business", "lawyer", "other"
]);

export async function ensureNneRegistrationTables(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_application_demographics (
      application_id TEXT PRIMARY KEY REFERENCES nne_access_applications(id) ON DELETE CASCADE,
      residence_country TEXT NOT NULL,
      origin_country TEXT,
      city TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_application_professions (
      application_id TEXT NOT NULL REFERENCES nne_access_applications(id) ON DELETE CASCADE,
      profession TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (application_id, profession)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_user_professions (
      user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
      profession TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, profession)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_user_demographics (
      user_id TEXT PRIMARY KEY REFERENCES nne_users(id) ON DELETE CASCADE,
      residence_country TEXT NOT NULL,
      origin_country TEXT,
      city TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_identity_verifications (
      id TEXT PRIMARY KEY,
      application_id TEXT REFERENCES nne_access_applications(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES nne_users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('instagram', 'telegram', 'whatsapp')),
      external_identifier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'challenge_sent', 'verified', 'failed', 'revoked')),
      challenge_hash TEXT,
      challenge_expires_at TEXT,
      sent_at TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (application_id IS NOT NULL OR user_id IS NOT NULL)
    )`),
    env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_identity_verifications_application_channel
      ON nne_identity_verifications(application_id, channel) WHERE application_id IS NOT NULL`),
    env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_identity_verifications_user_channel
      ON nne_identity_verifications(user_id, channel) WHERE user_id IS NOT NULL`)
  ]);
}

export function normalizeProfessions(input) {
  const list = Array.isArray(input) ? input : [];
  return [...new Set(list.map((value) => clean(value, 40)).filter((value) => NNE_PROFESSIONS.has(value)))];
}

export async function saveApplicationRegistrationProfile(env, {
  applicationId,
  professions,
  residenceCountry,
  originCountry,
  city,
  instagramHandle,
  whatsappContact,
  telegramHandle,
  timestamp = now()
}) {
  await ensureNneRegistrationTables(env);
  const statements = [
    env.DB.prepare(`INSERT OR REPLACE INTO nne_application_demographics
      (application_id, residence_country, origin_country, city, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(applicationId, clean(residenceCountry, 80), clean(originCountry, 80) || null, clean(city, 80) || null, timestamp, timestamp)
  ];

  for (const profession of professions) {
    statements.push(
      env.DB.prepare(`INSERT OR IGNORE INTO nne_application_professions (application_id, profession, created_at)
        VALUES (?, ?, ?)`)
        .bind(applicationId, profession, timestamp)
    );
  }

  const identities = [
    ["instagram", clean(instagramHandle, 100).replace(/^@/, "")],
    ["whatsapp", clean(whatsappContact, 60)],
    ["telegram", clean(telegramHandle, 100).replace(/^@/, "")]
  ].filter(([, value]) => Boolean(value));

  for (const [channel, externalIdentifier] of identities) {
    statements.push(
      env.DB.prepare(`INSERT OR IGNORE INTO nne_identity_verifications
        (id, application_id, user_id, channel, external_identifier, status, created_at, updated_at)
        VALUES (?, ?, NULL, ?, ?, 'pending', ?, ?)`)
        .bind(crypto.randomUUID(), applicationId, channel, externalIdentifier, timestamp, timestamp)
    );
  }

  await env.DB.batch(statements);
}

export async function promoteApplicationRegistrationProfile(env, applicationId, userId, timestamp = now()) {
  await ensureNneRegistrationTables(env);
  const demographics = await env.DB.prepare(`SELECT residence_country, origin_country, city
    FROM nne_application_demographics WHERE application_id = ? LIMIT 1`).bind(applicationId).first();
  const professions = await env.DB.prepare(`SELECT profession FROM nne_application_professions
    WHERE application_id = ? ORDER BY profession`).bind(applicationId).all();
  const identities = await env.DB.prepare(`SELECT channel, external_identifier, status, challenge_hash,
    challenge_expires_at, sent_at, verified_at FROM nne_identity_verifications
    WHERE application_id = ?`).bind(applicationId).all();

  const statements = [];
  if (demographics?.residence_country) {
    statements.push(
      env.DB.prepare(`INSERT OR REPLACE INTO nne_user_demographics
        (user_id, residence_country, origin_country, city, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(userId, demographics.residence_country, demographics.origin_country || null, demographics.city || null, timestamp, timestamp)
    );
  }
  for (const row of professions.results || []) {
    statements.push(
      env.DB.prepare(`INSERT OR IGNORE INTO nne_user_professions (user_id, profession, created_at) VALUES (?, ?, ?)`)
        .bind(userId, row.profession, timestamp)
    );
  }
  for (const row of identities.results || []) {
    statements.push(
      env.DB.prepare(`INSERT OR IGNORE INTO nne_identity_verifications
        (id, application_id, user_id, channel, external_identifier, status, challenge_hash, challenge_expires_at, sent_at, verified_at, created_at, updated_at)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), userId, row.channel, row.external_identifier, row.status, row.challenge_hash || null,
          row.challenge_expires_at || null, row.sent_at || null, row.verified_at || null, timestamp, timestamp)
    );
  }
  if (statements.length) await env.DB.batch(statements);
}
