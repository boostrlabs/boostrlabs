import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, money, safeCategory } from "../../../_lib/nne-marketplace.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const title = clean(body.title, 140);
  const description = clean(body.description, 1200);
  const category = safeCategory(body.category, "creative");
  const compensationType = ["usd","nne","mixed"].includes(String(body.compensation_type)) ? String(body.compensation_type) : "usd";
  const budgetCents = money(body.budget_usd);
  const budgetNne = Math.max(0, Number(body.budget_nne || 0));
  if (!title || !description) return jsonError("nne_job_invalid", "Agrega título y descripción.", 400);
  if ((compensationType === "usd" && budgetCents <= 0) || (compensationType === "nne" && budgetNne <= 0) || (compensationType === "mixed" && budgetCents <= 0 && budgetNne <= 0)) {
    return jsonError("nne_job_budget_invalid", "Agrega un presupuesto válido.", 400);
  }
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_jobs (id,creator_user_id,title,description,category,compensation_type,budget_cents,budget_nne,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?, 'open',?,?)`).bind(id,auth.user.id,title,description,category,compensationType,budgetCents || null,budgetNne || null,timestamp,timestamp).run();
  return jsonOk({ id, status: "open" });
}
