import { clean, json, jsonError } from "../../_lib/api.js";
import { verifyToyotaPass } from "../../_lib/toyota-qr.js";

export async function onRequestGet({ request, env }) {
  const token = clean(new URL(request.url).searchParams.get("token"), 3000);
  const result = await verifyToyotaPass(env, token);
  if (!result.ok) return jsonError("invalid_pass", "This pass is not valid.", 400);

  return json({
    ok: true,
    valid: !result.expired,
    status: result.expired ? "expired" : "active",
    pass: result.payload
  });
}
