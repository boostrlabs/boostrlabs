import { clean, jsonError } from '../../_lib/api.js';

const encoder = new TextEncoder();
const toHex = (buffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');
const normalizeCode = (value) => clean(value, 160).replace(/\s+/g, '').toLowerCase();

async function hashCode(code, salt = '') {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${normalizeCode(code)}`)));
}

async function isValidAccessCode(env, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return false;

  const configured = clean(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE || '', 160);
  if (configured) {
    const [suppliedHash, configuredHash] = await Promise.all([
      hashCode(code, 'env'),
      hashCode(configured, 'env')
    ]);
    if (suppliedHash === configuredHash) return true;
  }

  if (!env.DB) return false;
  try {
    const result = await env.DB.prepare(
      `SELECT code_hash, code_salt
       FROM invite_codes
       WHERE status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
         AND used_count < max_uses
       LIMIT 200`
    ).bind(new Date().toISOString()).all();

    for (const row of result.results || []) {
      if (await hashCode(code, row.code_salt || '') === row.code_hash) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.pathname !== '/api/signup') return context.next();

  let payload = null;
  try {
    payload = await request.clone().json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON body.', 400);
  }

  const valid = await isValidAccessCode(env, payload?.secret_boostr_code);
  if (!valid) {
    return jsonError(
      'invite_required',
      'BOOSTR account creation requires an approved Audit invite or a valid private access code.',
      403
    );
  }

  return context.next();
}
