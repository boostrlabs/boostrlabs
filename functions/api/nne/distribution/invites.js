import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  randomHex,
  readJson,
  requireNneAdmin,
  requireNneSession,
  sha256,
  writeNneAudit
} from "../../../_lib/nne-api.js";

const roles = new Set(["artist", "manager"]);
const inviteWindowMs = 14 * 24 * 60 * 60 * 1000;

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = clean(url.searchParams.get("token"), 200);
  if (token) {
    const invite = await env.DB.prepare(
      `SELECT i.id,i.intended_email,i.intended_username,i.role,i.expires_at,a.name AS artist_name
       FROM nne_distribution_invites i
       JOIN nne_distribution_artists a ON a.id=i.artist_id
       WHERE i.token_hash=? AND i.status='active' AND i.expires_at>? LIMIT 1`
    ).bind(await sha256(token), now()).first();
    if (!invite?.id) return jsonError("nne_distribution_invite_invalid", "Esta invitación no es válida o ya venció.", 404);
    return jsonOk({ invite });
  }
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const rows = await env.DB.prepare(
    `SELECT i.id,i.intended_email,i.intended_username,i.role,i.status,i.expires_at,i.accepted_at,
            a.id AS artist_id,a.name AS artist_name,u.username AS accepted_username
     FROM nne_distribution_invites i
     JOIN nne_distribution_artists a ON a.id=i.artist_id
     LEFT JOIN nne_users u ON u.id=i.accepted_by
     ORDER BY i.created_at DESC LIMIT 50`
  ).all();
  return jsonOk({ invites: rows.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const artistId = clean(parsed.payload?.artist_id, 120);
  const intendedEmail = clean(parsed.payload?.email, 254).toLowerCase();
  const intendedUsername = clean(parsed.payload?.username, 32).toLowerCase().replace(/^@/, "");
  const role = clean(parsed.payload?.role || "artist", 20);
  if (!artistId || (!intendedEmail && !intendedUsername) || !roles.has(role)) {
    return jsonError("nne_distribution_invite_fields", "Elige artista, rol y correo o username.", 400);
  }
  const artist = await env.DB.prepare("SELECT id,name FROM nne_distribution_artists WHERE id=? AND status='active' LIMIT 1")
    .bind(artistId).first();
  if (!artist?.id) return jsonError("nne_distribution_artist_not_found", "Artista no encontrado.", 404);
  const token = randomHex(32);
  const id = `dist_inv_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  const expiresAt = new Date(Date.now() + inviteWindowMs).toISOString();
  await env.DB.prepare(
    `INSERT INTO nne_distribution_invites (
      id,artist_id,intended_email,intended_username,role,token_hash,status,expires_at,created_by,created_at
    ) VALUES (?,?,?,?,?,?,'active',?,?,?)`
  ).bind(id, artistId, intendedEmail || null, intendedUsername || null, role, await sha256(token), expiresAt, auth.user.id, timestamp).run();
  const origin = clean(env.NNE_APP_ORIGIN || "https://nne.westdetro.com", 300).replace(/\/$/, "");
  const params = new URLSearchParams({ distribution_invite: token });
  if (intendedUsername) params.set("username", intendedUsername);
  if (intendedEmail) params.set("email", intendedEmail);
  const inviteUrl = `${origin}/signup?${params}`;
  await writeNneAudit(env, request, auth.user.id, "distribution.invite_created", "nne_distribution_invite", id, { artist_id: artistId, role, intended_username: intendedUsername || null });
  return jsonOk({ invite: { id, artist_id: artistId, artist_name: artist.name, role, expires_at: expiresAt, invite_url: inviteUrl } }, 201);
}

// Existing approved users can accept the same single-use invite without registering again.
export async function onRequestPatch({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 200);
  if (!token) return jsonError("nne_distribution_invite_token", "Falta el token de invitación.", 400);
  const invite = await env.DB.prepare(
    `SELECT * FROM nne_distribution_invites
     WHERE token_hash=? AND status='active' AND expires_at>? LIMIT 1`
  ).bind(await sha256(token), now()).first();
  if (!invite?.id) return jsonError("nne_distribution_invite_invalid", "Esta invitación no es válida o ya venció.", 404);
  if (invite.intended_email && String(invite.intended_email).toLowerCase() !== String(auth.user.email).toLowerCase()) {
    return jsonError("nne_distribution_invite_identity", "Esta invitación pertenece a otro correo.", 403);
  }
  if (invite.intended_username && String(invite.intended_username).toLowerCase() !== String(auth.user.username).toLowerCase()) {
    return jsonError("nne_distribution_invite_identity", "Esta invitación pertenece a otro username.", 403);
  }
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO nne_distribution_access (
        id,user_id,artist_id,role,status,created_by,created_at,updated_at
      ) VALUES (?,?,?,?, 'active',?,?,?)`
    ).bind(crypto.randomUUID(), auth.user.id, invite.artist_id, invite.role, invite.created_by, timestamp, timestamp),
    env.DB.prepare(
      `UPDATE nne_distribution_invites SET status='accepted',accepted_by=?,accepted_at=?
       WHERE id=? AND status='active'`
    ).bind(auth.user.id, timestamp, invite.id)
  ]);
  await writeNneAudit(env, request, auth.user.id, "distribution.invite_accepted", "nne_distribution_invite", invite.id, { artist_id: invite.artist_id, role: invite.role });
  return jsonOk({ accepted: true, artist_id: invite.artist_id, role: invite.role });
}
