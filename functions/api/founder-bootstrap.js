import {
  clean,
  createSession,
  hashPassword,
  isValidEmail,
  jsonError,
  jsonOk,
  now,
  readJson,
  requireDb,
  sessionCookie
} from '../_lib/api.js';

const encoder = new TextEncoder();
const toHex = (buffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');
const normalizeCode = (value) => clean(value, 160).replace(/\s+/g, '').toLowerCase();

async function hashCode(code, salt = '') {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${normalizeCode(code)}`)));
}

async function validateFounderCode(env, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const configured = clean(env.BOOSTR_FOUNDER_CODE || env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE || '', 160);
  if (configured) {
    const [suppliedHash, configuredHash] = await Promise.all([
      hashCode(code, 'env'),
      hashCode(configured, 'env')
    ]);
    if (suppliedHash === configuredHash) return { id: null, source: 'env' };
  }

  try {
    const result = await env.DB.prepare(
      `SELECT id, code_hash, code_salt
       FROM invite_codes
       WHERE status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
         AND used_count < max_uses
       LIMIT 200`
    ).bind(new Date().toISOString()).all();

    for (const row of result.results || []) {
      if (await hashCode(code, row.code_salt || '') === row.code_hash) {
        return { id: row.id, source: 'db' };
      }
    }
  } catch {
    return null;
  }
  return null;
}

const profiles = {
  janko: {
    username: 'janko',
    role: 'manager',
    membershipRole: 'manager',
    defaultPersona: 'manager',
    personas: ['manager', 'founder', 'artist', 'producer', 'creative_director'],
    redirect: '/hummusfl/manager-missions/?v=0.6.6'
  },
  johanka: {
    username: 'johanka',
    role: 'creator',
    membershipRole: 'creator',
    defaultPersona: 'creative_leader',
    personas: ['creative_leader', 'artist'],
    redirect: '/hummusfl/creative-missions/?v=0.6.6'
  }
};

async function ensureWorkspace(env, config, ownerEmail, timestamp) {
  let workspace = await env.DB.prepare('SELECT id, slug, name FROM workspaces WHERE slug = ? LIMIT 1')
    .bind(config.slug).first();
  if (workspace?.id) return workspace;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(id, config.type, config.name, config.slug, ownerEmail, timestamp, timestamp).run();
  return { id, slug: config.slug, name: config.name };
}

async function ensureMembership(env, workspaceId, userId, role, timestamp) {
  const current = await env.DB.prepare(
    'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1'
  ).bind(workspaceId, userId).first();

  if (current?.id) {
    await env.DB.prepare(
      `UPDATE workspace_members SET role = ?, status = 'active', updated_at = ? WHERE id = ?`
    ).bind(role, timestamp, current.id).run();
    return;
  }

  await env.DB.prepare(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
  ).bind(crypto.randomUUID(), workspaceId, userId, role, timestamp, timestamp).run();
}

async function ensurePersona(env, workspaceId, userId, personaType, displayName, timestamp, isDefault) {
  let persona = await env.DB.prepare(
    'SELECT id FROM personas WHERE workspace_id = ? AND user_id = ? AND persona_type = ? LIMIT 1'
  ).bind(workspaceId, userId, personaType).first();

  if (!persona?.id) {
    persona = { id: crypto.randomUUID() };
    await env.DB.prepare(
      `INSERT INTO personas (id, workspace_id, user_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    ).bind(
      persona.id,
      workspaceId,
      userId,
      personaType,
      displayName,
      JSON.stringify({ source: 'founder_bootstrap', default: Boolean(isDefault) }),
      timestamp,
      timestamp
    ).run();
  } else {
    await env.DB.prepare(
      `UPDATE personas SET display_name = ?, status = 'active', metadata_json = ?, updated_at = ? WHERE id = ?`
    ).bind(
      displayName,
      JSON.stringify({ source: 'founder_bootstrap', default: Boolean(isDefault) }),
      timestamp,
      persona.id
    ).run();
  }
  return persona.id;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const profileKey = clean(payload.profile, 20).toLowerCase();
  const profile = profiles[profileKey];
  const displayName = clean(payload.display_name || payload.name, 120);
  const email = clean(payload.email, 180).toLowerCase();
  const password = clean(payload.password, 500);

  if (!profile) return jsonError('invalid_founder_profile', 'Choose Janko or Johanka.', 400);
  if (!displayName) return jsonError('display_name_required', 'Display name is required.', 400);
  if (!isValidEmail(email)) return jsonError('invalid_email', 'Use a valid email address.', 400);
  if (password.length < 8) return jsonError('weak_password', 'Password must be at least 8 characters.', 400);

  const access = await validateFounderCode(env, payload.secret_boostr_code || payload.code);
  if (!access) return jsonError('invalid_private_access', 'Private founder access code is invalid.', 401);

  const bootstrapped = await env.DB.prepare(
    `SELECT username FROM users
     WHERE username IN ('janko', 'johanka')
       AND status = 'active'
       AND password_hash IS NOT NULL`
  ).all();
  const completed = new Set((bootstrapped.results || []).map((row) => row.username));
  if (completed.has('janko') && completed.has('johanka')) {
    return jsonError('founder_bootstrap_closed', 'Founder bootstrap is already complete. Use BOOSTR Login.', 403);
  }
  if (completed.has(profile.username)) {
    return jsonError('profile_already_bootstrapped', `${displayName || profile.username} already has an active account. Use BOOSTR Login.`, 409);
  }

  const timestamp = now();
  const boostrWorkspace = await ensureWorkspace(env, {
    slug: 'boostr-internal',
    type: 'internal',
    name: 'BOOSTR Labs'
  }, email, timestamp);
  const hummusWorkspace = await ensureWorkspace(env, {
    slug: 'hummus-fl',
    type: 'partner',
    name: 'Hummus Mediterranean Food'
  }, email, timestamp);

  const emailUser = await env.DB.prepare('SELECT id, username, password_hash FROM users WHERE lower(email) = ? LIMIT 1')
    .bind(email).first();
  const usernameUser = await env.DB.prepare('SELECT id, email FROM users WHERE username = ? LIMIT 1')
    .bind(profile.username).first();

  if (usernameUser?.id && usernameUser.id !== emailUser?.id) {
    return jsonError('founder_username_taken', 'This founder profile is already attached to another account.', 409);
  }

  const userId = emailUser?.id || usernameUser?.id || crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  if (emailUser?.id || usernameUser?.id) {
    await env.DB.prepare(
      `UPDATE users SET email = ?, name = ?, username = ?, role = ?, workspace_id = ?,
        default_workspace_id = ?, status = 'active', password_hash = ?, password_set_at = ?,
        language = 'es', theme = 'platinum_dark', signup_source = 'founder_bootstrap',
        onboarding_status = 'founder_ready', updated_at = ? WHERE id = ?`
    ).bind(
      email,
      displayName,
      profile.username,
      profile.role,
      hummusWorkspace.id,
      hummusWorkspace.id,
      passwordHash,
      timestamp,
      timestamp,
      userId
    ).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, name, username, role, workspace_id, default_workspace_id, status,
        password_hash, password_set_at, language, theme, signup_source, onboarding_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'es', 'platinum_dark', 'founder_bootstrap', 'founder_ready', ?, ?)`
    ).bind(
      userId,
      email,
      displayName,
      profile.username,
      profile.role,
      hummusWorkspace.id,
      hummusWorkspace.id,
      passwordHash,
      timestamp,
      timestamp,
      timestamp
    ).run();
  }

  await ensureMembership(env, boostrWorkspace.id, userId, profile.membershipRole, timestamp);
  await ensureMembership(env, hummusWorkspace.id, userId, profile.membershipRole, timestamp);

  let defaultPersonaId = null;
  for (const personaType of profile.personas) {
    const personaId = await ensurePersona(
      env,
      hummusWorkspace.id,
      userId,
      personaType,
      displayName,
      timestamp,
      personaType === profile.defaultPersona
    );
    if (personaType === profile.defaultPersona) defaultPersonaId = personaId;
  }

  await env.DB.prepare(
    'UPDATE users SET default_persona_id = ?, updated_at = ? WHERE id = ?'
  ).bind(defaultPersonaId, timestamp, userId).run();

  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, persona_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, 'founder.bootstrap', 'Founder account activated', ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      hummusWorkspace.id,
      userId,
      defaultPersonaId,
      `${profile.username} founder profile activated.`,
      JSON.stringify({ profile: profileKey, workspaces: [boostrWorkspace.slug, hummusWorkspace.slug] }),
      timestamp
    ).run();
  } catch {}

  if (access.source === 'db' && access.id) {
    try {
      await env.DB.prepare(
        `UPDATE invite_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?`
      ).bind(timestamp, access.id).run();
    } catch {}
  }

  const session = await createSession(env, request, userId, hummusWorkspace.id);
  return jsonOk({
    token: session.token,
    expires_at: session.expires_at,
    user: { id: userId, email, name: displayName, username: profile.username, role: profile.role },
    active_workspace: hummusWorkspace,
    workspaces: [boostrWorkspace, hummusWorkspace],
    redirect: profile.redirect
  }, 201, { 'Set-Cookie': sessionCookie(session.token, request) });
}
