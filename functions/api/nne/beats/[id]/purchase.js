import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneSession,
  writeNneAudit
} from "../../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const licenseType = clean(parsed.payload?.license_type, 20);
  if (!new Set(["lease", "exclusive"]).has(licenseType)) {
    return jsonError("nne_beat_license_invalid", "Selecciona una licencia válida.", 400);
  }

  const beat = await env.DB.prepare(
    `SELECT id, title, status, sale_mode, lease_price_credits, exclusive_price_credits,
            master_object_key
     FROM nne_secure_beats WHERE id = ? AND status IN ('published', 'sold') LIMIT 1`
  ).bind(params.id).first();
  if (!beat?.id) return jsonError("nne_beat_not_found", "Este beat no está disponible.", 404);
  if (beat.status === "sold") return jsonError("nne_beat_sold", "Este beat ya fue vendido en exclusiva.", 409);
  if (beat.sale_mode !== "both" && beat.sale_mode !== licenseType) {
    return jsonError("nne_beat_license_unavailable", "Ese tipo de licencia no está disponible.", 409);
  }

  const price = Number(licenseType === "exclusive" ? beat.exclusive_price_credits : beat.lease_price_credits);
  if (!Number.isInteger(price) || price < 1) {
    return jsonError("nne_beat_price_missing", "El precio de esta licencia no está configurado.", 409);
  }
  const existing = await env.DB.prepare(
    `SELECT id, license_number, license_type FROM nne_beat_licenses
     WHERE beat_id = ? AND user_id = ? AND status = 'active' LIMIT 1`
  ).bind(beat.id, auth.user.id).first();
  if (existing?.id) return jsonOk({ license: existing, already_owned: true });
  if (auth.user.credits < price) {
    return jsonError("nne_credits_insufficient", `Necesitas ${price} NNE para esta licencia.`, 409, {
      required_credits: price,
      available_credits: auth.user.credits
    });
  }

  const id = crypto.randomUUID();
  const licenseNumber = `NNE-${new Date().getUTCFullYear()}-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const timestamp = now();
  const statements = [
    env.DB.prepare(
      `INSERT INTO nne_beat_licenses (
        id, beat_id, user_id, license_type, price_credits, status,
        license_number, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    ).bind(id, beat.id, auth.user.id, licenseType, price, licenseNumber, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO nne_credit_transactions (
        id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
      ) VALUES (?, ?, ?, 'reward_redemption', 'beat_license', ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      auth.user.id,
      -price,
      id,
      `${licenseType === "exclusive" ? "Licencia exclusiva" : "Licencia"}: ${beat.title}`,
      auth.user.id,
      timestamp
    )
  ];
  if (licenseType === "exclusive") {
    statements.push(
      env.DB.prepare("UPDATE nne_secure_beats SET status = 'sold', updated_at = ? WHERE id = ? AND status = 'published'")
        .bind(timestamp, beat.id)
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("insufficient_credits")) {
      return jsonError("nne_credits_insufficient", "Tu balance cambió y ya no alcanza para esta licencia.", 409);
    }
    if (message.includes("idx_nne_beat_exclusive_license") || message.includes("UNIQUE constraint")) {
      return jsonError("nne_beat_sold", "Este beat acaba de venderse en exclusiva.", 409);
    }
    throw error;
  }

  await writeNneAudit(env, request, auth.user.id, "beat.license.purchased", "nne_beat_license", id, {
    beat_id: beat.id,
    license_type: licenseType,
    price_credits: price,
    master_ready: Boolean(beat.master_object_key)
  });
  return jsonOk({
    license: {
      id,
      beat_id: beat.id,
      license_type: licenseType,
      license_number: licenseNumber,
      price_credits: price,
      master_ready: Boolean(beat.master_object_key)
    }
  }, 201);
}
