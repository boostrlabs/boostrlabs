import { clean, json, jsonOk, requireDb } from "../../_lib/api.js";

const reservedUsernames = new Set([
  "admin",
  "root",
  "boostr",
  "boostrlabs",
  "api",
  "support",
  "login",
  "signup",
  "audit",
  "manager",
  "app",
  "dashboard",
  "jankodiorr",
  "82ngel"
]);

const normalizeUsername = (value) => clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
const validUsername = (value) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value) && !reservedUsernames.has(value);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const normalized = normalizeUsername(url.searchParams.get("username"));

  if (!validUsername(normalized)) {
    return jsonOk({ available: false, normalized, reason: "invalid_or_reserved" });
  }

  const db = requireDb(env);
  if (!db.ok) return db.response;

  try {
    const row = await env.DB.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").bind(normalized).first();
    return jsonOk({ available: !row?.id, normalized });
  } catch {
    return jsonOk({ available: false, normalized, reason: "username_index_unavailable" });
  }
}
