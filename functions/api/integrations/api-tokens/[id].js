import { json, requireDb, requireSession } from "../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  return json({
    ok: false,
    error: "api_token_delete_not_implemented",
    message: "API token deletion is not implemented until secure token creation exists."
  }, 501);
}
