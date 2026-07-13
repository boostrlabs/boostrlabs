import { json, jsonError, now, requireDb, requireRole } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { ensureOmniPlan, OMNI_PLANS } from "../../_lib/omni-parking.js";
import { ensureParkingSchema } from "../../_lib/smart-parking.js";

async function ensureManagerSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)").run();
  await ensureParkingSchema(env);
}

async function ensureMembership(env, workspaceId, auth) {
  const userId = auth.user?.id;
  if (!userId || userId === "dev-manager") return;
  const timestamp = now();
  const current = await env.DB.prepare("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1")
    .bind(workspaceId, userId)
    .first();

  if (current?.id) {
    await env.DB.prepare("UPDATE workspace_members SET role = 'manager', status = 'active', updated_at = ? WHERE id = ?")
      .bind(timestamp, current.id)
      .run();
    return;
  }

  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, 'manager', 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, timestamp, timestamp).run();
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  try {
    await ensureManagerSchema(env);

    const provisioned = {};
    let workspace = null;
    for (const key of Object.keys(OMNI_PLANS)) {
      const result = await ensureOmniPlan(env, key);
      workspace ||= result.workspace;
      provisioned[key] = result;
    }

    if (!workspace?.id) return jsonError("smart_parking_workspace_failed", "No se pudo crear el workspace de OMNI JR.", 500);
    await ensureMembership(env, workspace.id, auth);

    return json({
      ok: true,
      build: "omni-self-heal-v1",
      module: "BOOSTR Smart Parking",
      operator: "OMNI JR Parking",
      workspace,
      payment_links: {
        standard: {
          id: provisioned.standard.link.id,
          public_url: `/omni-jr/checkout/?id=${encodeURIComponent(provisioned.standard.link.id)}&plan=standard`,
          stable_url: "/parking/omni-jr/standard",
          amount_cents: OMNI_PLANS.standard.amount
        },
        large: {
          id: provisioned.large.link.id,
          public_url: `/omni-jr/checkout/?id=${encodeURIComponent(provisioned.large.link.id)}&plan=large`,
          stable_url: "/parking/omni-jr/large",
          amount_cents: OMNI_PLANS.large.amount
        },
        monthly: {
          id: provisioned.monthly.link.id,
          public_url: `/omni-jr/checkout/?id=${encodeURIComponent(provisioned.monthly.link.id)}&plan=monthly`,
          stable_url: "/parking/omni-jr/monthly",
          amount_cents: OMNI_PLANS.monthly.amount
        }
      },
      selector_url: "/parking/omni-jr/",
      manager_url: "/app/parking/omni-jr/manager/"
    }, 201);
  } catch (error) {
    console.error("OMNI JR manager provisioning failed", error);
    return jsonError("smart_parking_provision_failed", "No se pudo preparar OMNI JR Smart Parking.", 503, {
      reason: String(error?.message || error)
    });
  }
}
