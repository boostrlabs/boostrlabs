import { json, jsonError, requireDb } from "../../_lib/api.js";
import { ensureOmniPlan, OMNI_PLANS } from "../../_lib/omni-parking.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const plans = {};
  try {
    for (const key of Object.keys(OMNI_PLANS)) {
      const provisioned = await ensureOmniPlan(env, key);
      const row = await env.DB.prepare(`
        SELECT payment_links.id, payment_links.status, payment_links.amount_cents,
               payment_links.checkout_mode, payment_links.metadata_json,
               products.id AS product_id, products.status AS product_status,
               workspaces.slug AS workspace_slug
        FROM payment_links
        LEFT JOIN products ON products.id = payment_links.product_id
        LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
        WHERE payment_links.id = ? LIMIT 1
      `).bind(provisioned.link.id).first();

      const healthy = Boolean(
        row?.id
        && row.status === "active"
        && row.product_id
        && row.product_status === "active"
        && row.workspace_slug === "omni-jr-parking"
        && Number(row.amount_cents) === Number(provisioned.plan.amount)
      );

      plans[key] = {
        ok: healthy,
        payment_link_id: row?.id || null,
        amount_cents: Number(row?.amount_cents || 0),
        checkout_mode: row?.checkout_mode || null,
        stable_url: `/parking/omni-jr/${key}`,
        checkout_url: row?.id ? `/pay/omni/?id=${encodeURIComponent(row.id)}&plan=${encodeURIComponent(key)}` : null
      };
    }

    const ok = Object.values(plans).every((plan) => plan.ok);
    if (!ok) return jsonError("omni_health_failed", "One or more OMNI JR plans are unhealthy.", 503, { build: "omni-self-heal-v1", plans });

    return json({
      ok: true,
      build: "omni-self-heal-v1",
      db_binding: "DB",
      operator: "omni-jr-parking",
      plans
    });
  } catch (error) {
    console.error("OMNI JR health repair failed", error);
    return jsonError("omni_health_exception", "OMNI JR health check failed.", 503, {
      build: "omni-self-heal-v1",
      reason: String(error?.message || error),
      plans
    });
  }
}
