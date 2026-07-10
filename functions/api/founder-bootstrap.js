import {
  clean,
  createSession,
  hashPassword,
  jsonError,
  jsonOk,
  now,
  readJson,
  requireDb,
  sessionCookie
} from '../_lib/api.js';

const founderEmails = ['janko@boostrlabs.com', 'johanka@boostrlabs.com'];

const founders = {
  'janko@boostrlabs.com': {
    profileKey: 'janko',
    displayName: 'Janko',
    username: 'janko',
    role: 'manager',
    membershipRole: 'manager',
    defaultPersona: 'manager',
    personas: ['manager', 'founder', 'artist', 'producer', 'creative_director'],
    redirect: '/hummusfl/manager-missions/?v=0.6.7'
  },
  'johanka@boostrlabs.com': {
    profileKey: 'johanka',
    displayName: 'Johanka',
    username: 'johanka',
    role: 'creator',
    membershipRole: 'creator',
    defaultPersona: 'creative_leader',
    personas: ['creative_leader', 'artist'],
    redirect: '/hummusfl/creative-missions/?v=0.6.7'
  }
};

async function founderState(env) {
  const result = await env.DB.prepare(
    `SELECT lower(email) AS email, id, username, status, password_hash
     FROM users
     WHERE lower(email) IN (?, ?)`
  ).bind(...founderEmails).all();

  const rows = result.results || [];
  const completed = new Set(
    rows
      .filter((row) => row.status === 'active' && Boolean(row.password_hash))
      .map((row) => row.email)
  );

  return {
    rows,
    completed,
    closed: founderEmails.every((email) => completed.has(email))
  };
}

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
  const email = clean(payload.email, 180).toLowerCase();
  const password = clean(payload.password, 500);
  const founder = founders[email];

  if (!founder) {
    return jsonError(
      'founder_email_not_allowed',
      'This bootstrap only accepts the two approved BOOSTR founder emails.',
      403
    );
  }
  if (password.length < 8) {
    return jsonError('weak_password', 'Password must be at least 8 characters.', 400);
  }

  // Required submit-time check: the route closes permanently after both accounts exist.
  const before = await founderState(env);
  if (before.closed) {
    return jsonError(
      'founder_bootstrap_closed',
      'BOOSTR founder initialization is complete. Use BOOSTR Login.',
      410,
      { bootstrap_closed: true }
    );
  }
  if (before.completed.has(email)) {
    return jsonError(
      'founder_account_exists',
      'This founder account already exists. Use BOOSTR Login.',
      409,
      { account_exists: true }
    );
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

  const emailUser = await env.DB.prepare(
    'SELECT id, username FROM users WHERE lower(email) = ? LIMIT 1'
  ).bind(email).first();
  const usernameUser = await env.DB.prepare(
    'SELECT id, email FROM users WHERE username = ? LIMIT 1'
  ).bind(founder.username).first();

  if (usernameUser?.id && usernameUser.id !== emailUser?.id) {
    return jsonError('founder_username_taken', 'This founder identity is already attached to another account.', 409);
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
      founder.displayName,
      founder.username,
      founder.role,
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
      founder.displayName,
      founder.username,
      founder.role,
      hummusWorkspace.id,
      hummusWorkspace.id,
      passwordHash,
      timestamp,
      timestamp,
      timestamp
    ).run();
  }

  await ensureMembership(env, boostrWorkspace.id, userId, founder.membershipRole, timestamp);
  await ensureMembership(env, hummusWorkspace.id, userId, founder.membershipRole, timestamp);

  let defaultPersonaId = null;
  for (const personaType of founder.personas) {
    const personaId = await ensurePersona(
      env,
      hummusWorkspace.id,
      userId,
      personaType,
      founder.displayName,
      timestamp,
      personaType === founder.defaultPersona
    );
    if (personaType === founder.defaultPersona) defaultPersonaId = personaId;
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
      `${founder.username} founder profile activated.`,
      JSON.stringify({ profile: founder.profileKey, workspaces: [boostrWorkspace.slug, hummusWorkspace.slug] }),
      timestamp
    ).run();
  } catch {}

  // Re-query after creation. The second successful account permanently closes the bootstrap endpoint.
  const after = await founderState(env);
  const session = await createSession(env, request, userId, hummusWorkspace.id);

  return jsonOk({
    token: session.token,
    expires_at: session.expires_at,
    user: {
      id: userId,
      email,
      name: founder.displayName,
      username: founder.username,
      role: founder.role
    },
    active_workspace: hummusWorkspace,
    workspaces: [boostrWorkspace, hummusWorkspace],
    bootstrap_closed: after.closed,
    redirect: founder.redirect
  }, 201, { 'Set-Cookie': sessionCookie(session.token, request) });
}