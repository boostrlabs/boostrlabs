import { json, jsonError, requireDb } from "../../../../_lib/api.js";
import { ensureOmniPlan, getOmniPlan } from "../../../../_lib/omni-parking.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const key = String(params?.plan || "").trim().toLowerCase();
  const plan = getOmniPlan(key);
  if (!plan) return jsonError("parking_plan_not_found", "Parking plan not found.", 404);

  try {
    const provisioned = await ensureOmniPlan(env, key);
    return json({
      ok: true,
      build: "omni-self-heal-v3",
      operator: "OMNI JR Parking",
      plan: {
        key: plan.key,
        title: plan.title,
        amount_cents: plan.amount,
        currency: "USD",
        plan_type: plan.planType,
        vehicle_class: plan.vehicleClass,
        max_hours: plan.planType === "single" ? 8 : null
      },
      payment_link: {
        id: provisioned.link.id,
        product_id: provisioned.link.product_id,
        public_url: `/omni-jr/checkout-v3/?id=${encodeURIComponent(provisioned.link.id)}&plan=${encodeURIComponent(plan.key)}`,
        stable_url: `/parking/omni-jr/${encodeURIComponent(plan.key)}`
      }
    });
  } catch (error) {
    console.error("OMNI JR public plan repair failed", { plan: key, error: String(error?.message || error) });
    return jsonError("omni_plan_repair_failed", "No se pudo preparar el checkout de OMNI JR.", 503);
  }
}
