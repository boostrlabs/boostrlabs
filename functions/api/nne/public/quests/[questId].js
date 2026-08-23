import { jsonError, jsonOk } from "../../../../_lib/nne-api.js";
import { ensureNneSeason001 } from "../../../../_lib/nne-season-001.js";
import { ensureNneSeason001Catalog } from "../../../../_lib/nne-season-001-catalog.js";

function normalizedDescription(description = "") {
  return String(description).replace(/\\n/g, "\n");
}

function sourceUrl(description = "") {
  const match = normalizedDescription(description).match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function publicDescription(description = "") {
  return normalizedDescription(description)
    .replace(/\s*\n*Abrir (?:contenido|perfil|release|TikTok|Reel):\s*https?:\/\/[^\s]+\s*$/i, "")
    .trim();
}

async function ensureAccessTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_quest_access (
    quest_id TEXT PRIMARY KEY,
    visibility TEXT NOT NULL DEFAULT 'preview' CHECK (visibility IN ('public','preview','private')),
    updated_at TEXT NOT NULL
  )`).run();
}

export async function onRequestGet({ env, params }) {
  await ensureNneSeason001(env);
  await ensureNneSeason001Catalog(env);
  await ensureAccessTable(env);

  const questId = String(params.questId || "").trim();
  const row = await env.DB.prepare(`SELECT
      q.id, q.type, q.platform, q.title, q.description, q.icon,
      q.reward_credits, q.reward_xp, q.verification_method, q.minimum_level,
      q.starts_at, q.ends_at, q.status,
      COALESCE(a.visibility, 'preview') AS visibility,
      s.title AS song_title, s.artist_name, s.artwork_url
    FROM nne_quests q
    LEFT JOIN nne_quest_access a ON a.quest_id = q.id
    LEFT JOIN nne_songs s ON s.id = q.song_id
    WHERE q.id = ? AND q.status = 'published'
      AND (q.starts_at IS NULL OR q.starts_at <= ?)
      AND (q.ends_at IS NULL OR q.ends_at > ?)
    LIMIT 1`)
    .bind(questId, new Date().toISOString(), new Date().toISOString())
    .first();

  if (!row?.id) return jsonError("nne_public_quest_not_found", "Esta chamba no está disponible.", 404);

  const visibility = row.visibility || "preview";
  const fullyPublic = visibility === "public";
  const privateOnly = visibility === "private";

  return jsonOk({
    quest: {
      id: row.id,
      type: row.type,
      platform: row.platform,
      title: row.title,
      description: privateOnly ? "Chamba exclusiva para miembros NNE. Inicia sesión para ver los detalles." : publicDescription(row.description),
      icon: row.icon,
      reward_credits: Number(row.reward_credits || 0),
      reward_xp: Number(row.reward_xp || 0),
      verification_method: fullyPublic ? row.verification_method : null,
      minimum_level: Number(row.minimum_level || 1),
      starts_at: row.starts_at || null,
      ends_at: row.ends_at || null,
      visibility,
      source_url: fullyPublic ? sourceUrl(row.description) : null,
      song: row.song_title ? {
        title: row.song_title,
        artist_name: row.artist_name,
        artwork_url: row.artwork_url || null
      } : null
    }
  });
}
