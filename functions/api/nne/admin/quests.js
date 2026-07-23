import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../_lib/nne-api.js";

const questTypes = new Set(["social-proof", "listening-trivia", "referral", "community"]);
const statuses = new Set(["draft", "published", "paused", "archived"]);
const cadences = new Set(["once", "daily", "weekly"]);
const verificationMethods = new Set(["manual", "trivia", "referral", "automatic"]);

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const result = await env.DB.prepare(
    `SELECT q.*, s.title AS song_title,
            (SELECT COUNT(*) FROM nne_quest_attempts a WHERE a.quest_id = q.id) AS attempts,
            (SELECT COUNT(*) FROM nne_quest_attempts a WHERE a.quest_id = q.id AND a.status IN ('approved', 'completed')) AS completions
     FROM nne_quests q
     LEFT JOIN nne_songs s ON s.id = q.song_id
     ORDER BY q.sort_order, q.created_at DESC`
  ).all();
  return jsonOk({ quests: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const title = clean(payload.title, 160);
  const description = clean(payload.description, 1000);
  const type = clean(payload.type, 40);
  const status = clean(payload.status || "draft", 20);
  const cadence = clean(payload.cadence || "once", 20);
  const verification = clean(payload.verification_method || "manual", 30);
  const rewardCredits = Math.max(0, Math.floor(Number(payload.reward_credits || 0)));
  const rewardXp = Math.max(0, Math.floor(Number(payload.reward_xp ?? rewardCredits)));

  if (!title || !description) return jsonError("nne_quest_fields_required", "Título y descripción son requeridos.", 400);
  if (!questTypes.has(type) || !statuses.has(status) || !cadences.has(cadence) || !verificationMethods.has(verification)) {
    return jsonError("nne_quest_configuration_invalid", "La configuración de la quest no es válida.", 400);
  }

  const id = `quest_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_quests (
      id, type, platform, title, description, icon, reward_credits, reward_xp,
      status, cadence, verification_method, song_id, minimum_listen_seconds,
      pass_percentage, minimum_level, starts_at, ends_at, sort_order,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      type,
      clean(payload.platform, 80) || "Community",
      title,
      description,
      clean(payload.icon, 8) || "◆",
      rewardCredits,
      rewardXp,
      status,
      cadence,
      verification,
      clean(payload.song_id, 120) || null,
      Math.max(0, Math.floor(Number(payload.minimum_listen_seconds || 0))),
      Math.min(100, Math.max(0, Math.floor(Number(payload.pass_percentage ?? 75)))),
      Math.max(1, Math.floor(Number(payload.minimum_level || 1))),
      clean(payload.starts_at, 40) || null,
      clean(payload.ends_at, 40) || null,
      Math.floor(Number(payload.sort_order || 0)),
      auth.user.id,
      timestamp,
      timestamp
    )
    .run();
  await writeNneAudit(env, request, auth.user.id, "quest.created", "nne_quest", id, { title, status });
  return jsonOk({ quest: { id, title, status } }, 201);
}
