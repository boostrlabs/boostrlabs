import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, money } from "../../../_lib/nne-marketplace.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const [balance, requests] = await Promise.all([
    env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) balance_cents FROM nne_seller_ledger WHERE user_id=?`).bind(auth.user.id).first(),
    env.DB.prepare(`SELECT id,amount_cents,payout_method,status,external_reference,created_at,updated_at FROM nne_seller_payout_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 20`).bind(auth.user.id).all()
  ]);
  return jsonOk({ balance_cents: Number(balance?.balance_cents || 0), requests: requests.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const amountCents = money(body.amount_usd);
  const method = ["gift_card","manual"].includes(String(body.payout_method)) ? String(body.payout_method) : "gift_card";
  if (amountCents <= 0) return jsonError("nne_cashout_invalid", "Agrega un monto válido.", 400);
  const balance = await env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) balance_cents FROM nne_seller_ledger WHERE user_id=?`).bind(auth.user.id).first();
  const pending = await env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) pending_cents FROM nne_seller_payout_requests WHERE user_id=? AND status IN ('requested','approved')`).bind(auth.user.id).first();
  const available = Number(balance?.balance_cents || 0) - Number(pending?.pending_cents || 0);
  if (amountCents > available) return jsonError("nne_cashout_insufficient", "El monto supera tu balance disponible de ventas.", 400);
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_seller_payout_requests (id,user_id,amount_cents,payout_method,status,created_at,updated_at) VALUES (?,?,?,?,'requested',?,?)`).bind(id,auth.user.id,amountCents,method,timestamp,timestamp).run();
  return jsonOk({ id, status: "requested", amount_cents: amountCents, payout_method: method, available_after_cents: available - amountCents });
}
