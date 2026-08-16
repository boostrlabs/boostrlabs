import { jsonError, requireNneSession } from "./nne-api.js";

export async function ensureNneReviewerTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_artist_reviewers (
    user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
    artist_slug TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(user_id, artist_slug)
  )`).run();
}

export function artistSlugForQuest(questId = "") {
  const id = String(questId);
  if (id.startsWith("s1_")) return "janko";
  if (id.startsWith("gemese_")) return "gemese";
  if (id.startsWith("xiam_")) return "xiam";
  return null;
}

export async function requireNneReviewer(request, env) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth;
  await ensureNneReviewerTables(env);
  if (auth.user.role === "admin") return { ...auth, scopes: ["*"] };
  const rows = await env.DB.prepare(`SELECT artist_slug FROM nne_artist_reviewers WHERE user_id = ? AND active = 1 ORDER BY artist_slug`).bind(auth.user.id).all();
  const scopes = (rows.results || []).map((row) => String(row.artist_slug));
  if (!scopes.length) {
    return { ok: false, response: jsonError("nne_reviewer_required", "Tu cuenta no tiene permisos de revisión de artista.", 403) };
  }
  return { ...auth, scopes };
}

export function reviewerCanAccess(scopes, questId) {
  if (scopes.includes("*")) return true;
  const slug = artistSlugForQuest(questId);
  return Boolean(slug && scopes.includes(slug));
}

export const QUALITY_BONUS = Object.freeze({ completed: 0, good: 250, standout: 1500, exceptional: 5000 });
export const PERFORMANCE_BONUS = Object.freeze({ normal: 0, strong: 1000, breakout: 7500, viral: 25000 });
