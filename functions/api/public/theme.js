import { json, jsonError, requireDb } from "../../_lib/api.js";
import { BOOSTR_THEME_DEFAULT, readSystemTheme } from "../../_lib/theme.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  const db = requireDb(env);
  if (!db.ok) {
    return json({
      ok: true,
      theme: BOOSTR_THEME_DEFAULT,
      source: "fallback"
    });
  }

  try {
    const theme = await readSystemTheme(env);
    return json({ ok: true, theme, source: "system" });
  } catch (error) {
    return jsonError(
      "theme_read_failed",
      "No se pudo cargar el theme global.",
      500,
      { detail: String(error?.message || error) }
    );
  }
}
