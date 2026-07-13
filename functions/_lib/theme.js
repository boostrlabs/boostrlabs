import { clean, now } from "./api.js";

export const BOOSTR_THEME_DEFAULT = Object.freeze({
  theme_id: "night_blue",
  accent_id: "blue",
  updated_at: null
});

export const BOOSTR_THEME_IDS = new Set([
  "night_blue",
  "smart_light",
  "mother_platinum"
]);

export const BOOSTR_ACCENT_IDS = new Set([
  "blue",
  "violet",
  "rose",
  "emerald"
]);

export function normalizeThemeConfig(value = {}) {
  const themeId = clean(value.theme_id, 80);
  const accentId = clean(value.accent_id, 80);
  return {
    theme_id: BOOSTR_THEME_IDS.has(themeId) ? themeId : BOOSTR_THEME_DEFAULT.theme_id,
    accent_id: BOOSTR_ACCENT_IDS.has(accentId) ? accentId : BOOSTR_THEME_DEFAULT.accent_id,
    updated_at: value.updated_at || null
  };
}

export async function ensureThemeSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS boostr_ui_settings (
      id TEXT PRIMARY KEY,
      theme_id TEXT NOT NULL,
      accent_id TEXT NOT NULL,
      updated_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
}

export async function readSystemTheme(env) {
  await ensureThemeSchema(env);
  const row = await env.DB.prepare(`
    SELECT theme_id, accent_id, updated_at
    FROM boostr_ui_settings
    WHERE id = 'global'
    LIMIT 1
  `).first();

  return normalizeThemeConfig(row || BOOSTR_THEME_DEFAULT);
}

export async function writeSystemTheme(env, input, userId) {
  const config = normalizeThemeConfig(input);
  const timestamp = now();

  await ensureThemeSchema(env);
  await env.DB.prepare(`
    INSERT INTO boostr_ui_settings
      (id, theme_id, accent_id, updated_by, created_at, updated_at)
    VALUES ('global', ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      theme_id = excluded.theme_id,
      accent_id = excluded.accent_id,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).bind(config.theme_id, config.accent_id, userId, timestamp, timestamp).run();

  return { ...config, updated_at: timestamp };
}
