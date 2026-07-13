import { clean, json, jsonError, requireDb, requireSession } from "../../_lib/api.js";
import {
  BOOSTR_ACCENT_IDS,
  BOOSTR_THEME_IDS,
  readSystemTheme,
  writeSystemTheme
} from "../../_lib/theme.js";

const JANKO_EMAILS = new Set([
  "janko@boostrlabs.com",
  "juan@boostrlabs.com"
]);

async function authorizeJankoAdmin(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth;

  const email = clean(auth.user?.email, 180).toLowerCase();
  const rawRole = clean(auth.user?.role, 80).toLowerCase();
  const roles = new Set([rawRole, ...(auth.roles || []).map((role) => clean(role, 80).toLowerCase())]);
  const isJanko = JANKO_EMAILS.has(email);
  const isAdminCeo = roles.has("admin")
    || roles.has("ceo")
    || roles.has("founder")
    || roles.has("owner")
    || roles.has("manager"); // Janko is currently bootstrapped as manager; email remains the hard founder boundary.

  if (!isJanko || !isAdminCeo) {
    return {
      ok: false,
      response: jsonError(
        "janko_ceo_only",
        "Solo Janko con acceso Admin/CEO puede cambiar Theme / Color.",
        403
      )
    };
  }

  return auth;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await authorizeJankoAdmin(request, env);
  if (!auth.ok) return auth.response;

  const theme = await readSystemTheme(env);
  return json({
    ok: true,
    theme,
    permissions: {
      can_manage_system_theme: true,
      scope: "shared_boostr_ui"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await authorizeJankoAdmin(request, env);
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  const themeId = clean(payload?.theme_id, 80);
  const accentId = clean(payload?.accent_id, 80);

  if (!BOOSTR_THEME_IDS.has(themeId)) {
    return jsonError("invalid_theme", "Theme no válido.", 400, {
      allowed: [...BOOSTR_THEME_IDS]
    });
  }

  if (!BOOSTR_ACCENT_IDS.has(accentId)) {
    return jsonError("invalid_accent", "Color no válido.", 400, {
      allowed: [...BOOSTR_ACCENT_IDS]
    });
  }

  const theme = await writeSystemTheme(env, { theme_id: themeId, accent_id: accentId }, auth.user.id);
  return json({
    ok: true,
    theme,
    scope: "shared_boostr_ui"
  });
}
