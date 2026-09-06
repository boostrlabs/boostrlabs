import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../_lib/nne-distribution.js";

const currencyPattern = /^[A-Z]{3}$/;
const payoutStatuses = new Set(["approved", "processing", "paid", "failed", "cancelled"]);

export const onRequestOptions = onOptions;

const accessClause = (isAdmin) => isAdmin
  ? { sql: "1=1", values: [] }
  : {
      sql: `EXISTS (
        SELECT 1 FROM nne_distribution_access access
        WHERE access.artist_id=artist.id AND access.user_id=? AND access.status='active'
      )`,
      values: null
    };

export async function onRequestGet({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const isAdmin = auth.user.role === "admin";
  const scope = accessClause(isAdmin);
  const values = isAdmin ? [] : [auth.user.id];

  const [earningRows, payoutRows, statementRows, recentPayoutRows] = await env.DB.batch([
    env.DB.prepare(
      `SELECT lines.currency, SUM(lines.net_micros) AS earned_micros
       FROM nne_distribution_royalty_lines lines
       JOIN nne_distribution_artists artist ON artist.id=lines.artist_id
       WHERE ${scope.sql}
       GROUP BY lines.currency`
    ).bind(...values),
    env.DB.prepare(
      `SELECT payouts.currency,
              SUM(CASE WHEN payouts.status='paid' THEN payouts.amount_micros ELSE 0 END) AS paid_micros,
              SUM(CASE WHEN payouts.status IN ('requested','approved','processing') THEN payouts.amount_micros ELSE 0 END) AS reserved_micros
       FROM nne_distribution_payouts payouts
       JOIN nne_distribution_artists artist ON artist.id=payouts.artist_id
       WHERE ${scope.sql}
       GROUP BY payouts.currency`
    ).bind(...values),
    env.DB.prepare(
      `SELECT DISTINCT statements.id,statements.provider_key,statements.external_statement_id,
              statements.period_start,statements.period_end,statements.currency,
              statements.gross_micros,statements.fee_micros,statements.net_micros,
              statements.line_count,statements.status,statements.imported_at
       FROM nne_distribution_statements statements
       JOIN nne_distribution_royalty_lines lines ON lines.statement_id=statements.id
       JOIN nne_distribution_artists artist ON artist.id=lines.artist_id
       WHERE ${scope.sql}
       ORDER BY statements.period_end DESC LIMIT 24`
    ).bind(...values),
    env.DB.prepare(
      `SELECT payouts.*,artist.name AS artist_name
       FROM nne_distribution_payouts payouts
       JOIN nne_distribution_artists artist ON artist.id=payouts.artist_id
       WHERE ${scope.sql}
       ORDER BY payouts.requested_at DESC LIMIT 30`
    ).bind(...values)
  ]);

  const byCurrency = new Map();
  for (const row of earningRows.results || []) {
    byCurrency.set(row.currency, {
      currency: row.currency,
      earned_micros: Number(row.earned_micros || 0),
      paid_micros: 0,
      reserved_micros: 0,
      available_micros: Number(row.earned_micros || 0)
    });
  }
  for (const row of payoutRows.results || []) {
    const item = byCurrency.get(row.currency) || { currency: row.currency, earned_micros: 0 };
    item.paid_micros = Number(row.paid_micros || 0);
    item.reserved_micros = Number(row.reserved_micros || 0);
    item.available_micros = item.earned_micros - item.paid_micros - item.reserved_micros;
    byCurrency.set(row.currency, item);
  }
  return jsonOk({
    balances: [...byCurrency.values()],
    statements: statementRows.results || [],
    payouts: recentPayoutRows.results || [],
    accounting_unit: "micros",
    credits_separated: true
  });
}

export async function onRequestPost({ request, env }) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action, 40);
  if (action === "import_statement") return importStatement(request, env, parsed.payload);
  if (action === "request_payout") return requestPayout(request, env, parsed.payload);
  if (action === "update_payout") return updatePayout(request, env, parsed.payload);
  return jsonError("nne_distribution_finance_action", "Acción financiera no válida.", 400);
}

async function importStatement(request, env, payload) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const providerKey = clean(payload.provider_key, 80);
  const externalId = clean(payload.external_statement_id, 180);
  const periodStart = clean(payload.period_start, 30);
  const periodEnd = clean(payload.period_end, 30);
  const currency = clean(payload.currency, 3).toUpperCase();
  const lines = Array.isArray(payload.lines) ? payload.lines.slice(0, 200) : [];
  if (!providerKey || !externalId || !periodStart || !periodEnd || !currencyPattern.test(currency) || !lines.length) {
    return jsonError("nne_distribution_statement_invalid", "Proveedor, período, moneda y líneas son requeridos.", 400);
  }
  const duplicate = await env.DB.prepare(
    "SELECT id FROM nne_distribution_statements WHERE provider_key=? AND external_statement_id=? LIMIT 1"
  ).bind(providerKey, externalId).first();
  if (duplicate?.id) return jsonError("nne_distribution_statement_duplicate", "Ese statement ya fue importado.", 409);

  const timestamp = now();
  const statementId = `dist_stmt_${crypto.randomUUID().replaceAll("-", "")}`;
  const normalized = [];
  for (const line of lines) {
    const artistId = clean(line.artist_id, 120);
    const dsp = clean(line.dsp, 80);
    const lineCurrency = clean(line.currency || currency, 3).toUpperCase();
    const netMicros = Math.trunc(Number(line.net_micros));
    if (!artistId || !dsp || !currencyPattern.test(lineCurrency) || !Number.isSafeInteger(netMicros)) {
      return jsonError("nne_distribution_statement_line_invalid", "Una línea del statement no es válida.", 400);
    }
    normalized.push({
      id: `dist_roy_${crypto.randomUUID().replaceAll("-", "")}`,
      artistId,
      releaseId: clean(line.release_id, 120) || null,
      trackId: clean(line.track_id, 120) || null,
      payeeUserId: clean(line.payee_user_id, 120) || null,
      dsp,
      territory: clean(line.territory, 8) || null,
      usageType: clean(line.usage_type, 80) || null,
      quantity: Math.max(0, Math.trunc(Number(line.quantity || 0))),
      grossMicros: Math.trunc(Number(line.gross_micros || netMicros)),
      feeMicros: Math.trunc(Number(line.fee_micros || 0)),
      netMicros,
      currency: lineCurrency,
      occurredAt: clean(line.occurred_at, 30) || null
    });
  }
  const artistIds = [...new Set(normalized.map((line) => line.artistId))];
  const placeholders = artistIds.map(() => "?").join(",");
  const known = await env.DB.prepare(`SELECT id FROM nne_distribution_artists WHERE id IN (${placeholders})`)
    .bind(...artistIds).all();
  if ((known.results || []).length !== artistIds.length) {
    return jsonError("nne_distribution_statement_artist_unknown", "El statement contiene un artista no registrado.", 400);
  }
  const gross = normalized.reduce((sum, line) => sum + line.grossMicros, 0);
  const fees = normalized.reduce((sum, line) => sum + line.feeMicros, 0);
  const net = normalized.reduce((sum, line) => sum + line.netMicros, 0);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO nne_distribution_statements (
        id,provider_key,external_statement_id,period_start,period_end,currency,
        gross_micros,fee_micros,net_micros,line_count,status,imported_by,imported_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,'imported',?,?)`
    ).bind(statementId, providerKey, externalId, periodStart, periodEnd, currency, gross, fees, net, normalized.length, auth.user.id, timestamp),
    ...normalized.map((line) => env.DB.prepare(
      `INSERT INTO nne_distribution_royalty_lines (
        id,statement_id,artist_id,release_id,track_id,payee_user_id,dsp,territory,usage_type,
        quantity,gross_micros,fee_micros,net_micros,currency,occurred_at,created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(line.id, statementId, line.artistId, line.releaseId, line.trackId, line.payeeUserId, line.dsp,
      line.territory, line.usageType, line.quantity, line.grossMicros, line.feeMicros,
      line.netMicros, line.currency, line.occurredAt, timestamp))
  ]);
  await writeNneAudit(env, request, auth.user.id, "distribution.statement_imported", "nne_distribution_statement", statementId, { provider_key: providerKey, external_statement_id: externalId, line_count: normalized.length });
  return jsonOk({ statement_id: statementId, line_count: normalized.length, net_micros: net }, 201);
}

async function requestPayout(request, env, payload) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const artistId = clean(payload.artist_id, 120);
  const currency = clean(payload.currency, 3).toUpperCase();
  const amount = Math.trunc(Number(payload.amount_micros));
  const method = clean(payload.method, 60);
  const destinationHint = clean(payload.destination_hint, 120);
  if (!artistId || !currencyPattern.test(currency) || !Number.isSafeInteger(amount) || amount <= 0 || !method) {
    return jsonError("nne_distribution_payout_invalid", "Artista, monto, moneda y método son requeridos.", 400);
  }
  if (auth.user.role !== "admin") {
    const access = await env.DB.prepare(
      "SELECT id FROM nne_distribution_access WHERE user_id=? AND artist_id=? AND status='active' LIMIT 1"
    ).bind(auth.user.id, artistId).first();
    if (!access?.id) return jsonError("nne_distribution_artist_forbidden", "No tienes acceso a ese balance.", 403);
  }
  const totals = await env.DB.prepare(
    `SELECT
      COALESCE((SELECT SUM(net_micros) FROM nne_distribution_royalty_lines WHERE artist_id=? AND currency=?),0) AS earned,
      COALESCE((SELECT SUM(amount_micros) FROM nne_distribution_payouts WHERE artist_id=? AND currency=? AND status IN ('requested','approved','processing','paid')),0) AS withdrawn`
  ).bind(artistId, currency, artistId, currency).first();
  const available = Number(totals?.earned || 0) - Number(totals?.withdrawn || 0);
  if (amount > available) return jsonError("nne_distribution_payout_balance", "El monto supera el balance disponible.", 409, { available_micros: available });
  const id = `dist_pay_${crypto.randomUUID().replaceAll("-", "")}`;
  await env.DB.prepare(
    `INSERT INTO nne_distribution_payouts (
      id,artist_id,payee_user_id,currency,amount_micros,method,destination_hint,status,requested_at
    ) VALUES (?,?,?,?,?,?,?,'requested',?)`
  ).bind(id, artistId, auth.user.id, currency, amount, method, destinationHint || null, now()).run();
  await writeNneAudit(env, request, auth.user.id, "distribution.payout_requested", "nne_distribution_payout", id, { artist_id: artistId, currency, amount_micros: amount });
  return jsonOk({ payout_id: id, status: "requested" }, 201);
}

async function updatePayout(request, env, payload) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const payoutId = clean(payload.payout_id, 120);
  const status = clean(payload.status, 30);
  if (!payoutId || !payoutStatuses.has(status)) return jsonError("nne_distribution_payout_status", "Estado de pago no válido.", 400);
  const timestamp = now();
  const result = await env.DB.prepare(
    `UPDATE nne_distribution_payouts SET status=?,reviewed_by=?,reviewed_at=?,paid_at=? WHERE id=?`
  ).bind(status, auth.user.id, timestamp, status === "paid" ? timestamp : null, payoutId).run();
  if (!result.meta?.changes) return jsonError("nne_distribution_payout_not_found", "Pago no encontrado.", 404);
  await writeNneAudit(env, request, auth.user.id, "distribution.payout_updated", "nne_distribution_payout", payoutId, { status });
  return jsonOk({ payout_id: payoutId, status });
}
