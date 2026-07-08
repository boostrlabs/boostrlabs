import {
  authCanSeeAll,
  clean,
  defaultWorkspaceId,
  jsonError,
  now,
  requireWorkspaceAccess
} from "./api.js";

export const contactTypes = new Set([
  "artist_email",
  "business_email",
  "personal_phone",
  "business_phone",
  "whatsapp",
  "instagram",
  "website",
  "smart_link"
]);

export const contactVisibility = new Set(["private", "workspace", "public_profile"]);
export const appLanguages = new Set(["en", "es"]);
export const cardDensities = new Set(["compact", "comfortable", "expanded"]);
export const notificationStatuses = new Set(["unread", "read", "archived"]);

export const boolToInt = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback ? 1 : 0;
  if (value === true || value === 1 || value === "1" || value === "true") return 1;
  if (value === false || value === 0 || value === "0" || value === "false") return 0;
  return fallback ? 1 : 0;
};

export const safeJsonParse = (value, fallback = {}) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const resolveRequiredWorkspace = (auth, requestedWorkspaceId) => {
  const workspaceId = clean(requestedWorkspaceId, 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
};

export const canManageWorkspaceObject = (auth, workspaceId, ownerUserId) => {
  if (authCanSeeAll(auth)) return true;
  if (ownerUserId && ownerUserId === auth.user.id) return true;
  return Boolean(auth.memberships?.some((member) => member.workspace_id === workspaceId && member.status === "active" && ["admin", "manager"].includes(member.role)));
};

export const maskIp = (value) => {
  const ip = clean(value, 120);
  if (!ip) return null;
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + ":***";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  return null;
};

export const summarizeUserAgent = (value) => {
  const ua = clean(value, 500);
  if (!ua) return null;
  const browser = ua.includes("Edg/") ? "Edge" : ua.includes("Chrome/") ? "Chrome" : ua.includes("Firefox/") ? "Firefox" : ua.includes("Safari/") ? "Safari" : "Browser";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac OS") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : "Device";
  return `${browser} on ${os}`;
};

export const profileShape = (row) => ({
  id: row.id,
  display_name: row.name || "",
  email: row.email,
  avatar_url: row.avatar_url || null,
  default_workspace_id: row.default_workspace_id || row.workspace_id || null,
  default_persona_id: row.default_persona_id || null,
  language: row.language || "en",
  timezone: row.timezone || null,
  theme: row.theme || "platinum_dark",
  created_at: row.created_at,
  updated_at: row.updated_at
});

export async function getProfile(env, userId) {
  return env.DB.prepare(
    `SELECT id, email, name, workspace_id, avatar_url, default_workspace_id,
            default_persona_id, language, timezone, theme, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`
  )
    .bind(userId)
    .first();
}

export async function recordActivity(env, event) {
  if (!env.DB || !event.workspace_id) return null;
  const id = event.id || crypto.randomUUID();
  const createdAt = event.created_at || now();
  await env.DB.prepare(
    `INSERT INTO activity_events (
      id, workspace_id, user_id, persona_id, card_id, event_type,
      title, body, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      event.workspace_id,
      event.user_id || null,
      event.persona_id || null,
      event.card_id || null,
      clean(event.event_type || "activity", 80),
      clean(event.title || "Activity", 240),
      clean(event.body, 1200) || null,
      JSON.stringify(event.metadata || {}),
      createdAt
    )
    .run();
  return { id, created_at: createdAt };
}

export function contactShape(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    workspace_id: row.workspace_id || null,
    contact_type: row.contact_type,
    label: row.label || null,
    value: row.value,
    is_primary: Boolean(row.is_primary),
    visibility: row.visibility,
    verified_at: row.verified_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function preferenceShape(row, workspaceId) {
  return {
    workspace_id: workspaceId,
    default_mode: row?.default_mode || "manage",
    default_persona_id: row?.default_persona_id || null,
    default_language: row?.default_language || "en",
    card_density: row?.card_density || "comfortable",
    show_demo_labels: row ? Boolean(row.show_demo_labels) : true,
    reduce_motion: row ? Boolean(row.reduce_motion) : false,
    notification_preferences: safeJsonParse(row?.notification_preferences_json, {}),
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null
  };
}

export function tokenMetadataShape(row) {
  return {
    id: row.id,
    label: row.label,
    prefix: row.prefix,
    status: row.status,
    scopes: safeJsonParse(row.scopes_json, []),
    created_at: row.created_at,
    last_used_at: row.last_used_at || null
  };
}

export function validateLanguage(value, fallback = "en") {
  const lang = clean(value || fallback, 10).toLowerCase();
  return appLanguages.has(lang) ? lang : fallback;
}

export function requireAllowed(value, allowed, error, message) {
  const cleanValue = clean(value, 80);
  if (!allowed.has(cleanValue)) return { ok: false, response: jsonError(error, message, 400) };
  return { ok: true, value: cleanValue };
}
