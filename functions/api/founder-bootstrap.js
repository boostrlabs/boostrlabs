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
    displayName: 'Janko',
    publicUsername: 'janko',
    role: 'manager',
    membershipRole: 'manager',
    defaultPersonaLabel: 'Janko Founder / BOOSTR Manager',
    personas: [
      { type: 'manager', label: 'Janko Founder / BOOSTR Manager' },
      { type: 'artist', label: 'Janko Diorr Artist' },
      { type: 'producer', label: 'Janko Diorr Producer / Beatmaker' },
      { type: 'creator', label: 'Janko Creative Director' }
    ],
    redirect: '/hummusfl/manager-missions/?v=0.6.9'
  },
  'johanka@boostrlabs.com': {
    displayName: 'Johanka',
    publicUsername: 'johanka',
    role: 'creator',
    membershipRole: 'manager',
    defaultPersonaLabel: 'Johanka Creative Leader / Director',
    personas: [
      { type: 'manager', label: 'Johanka BOOSTR Manager' },
      { type: 'creator', label: 'Johanka Creative Leader / Director' },
      { type: 'artist', label: '82NGEL Artist' }
    ],
    redirect: '/hummusfl/creative-missions/?v=0.6.9'
  }
};

async function ensureUserColumns(env) {
  const result = await env.DB.prepare('PRAGMA table_info(users)').all();
  const existing = new Set((result.results || []).map((column) => column.name));
  const additions = [
    ['password_hash', 'TEXT'],
    ['password_set_at', 'TEXT'],
    ['last_login_at', 'TEXT'],
    ['username', 'TEXT'],
    ['phone', 'TEXT'],
    ['normalized_phone', 'TEXT'],
    ['default_workspace_id', 'TEXT'],
    ['default_persona_id', 'TEXT'],
    ['language', "TEXT NOT NULL DEFAULT 'es'"],
    ['timezone', 'TEXT'],
    ['theme', "TEXT NOT NULL DEFAULT 'platinum_dark'"],
    ['signup_source', 'TEXT'],
    ['invite_code_id', 'TEXT'],
    ['onboarding_status', "TEXT NOT NULL DEFAULT 'first_run'"]
  ];

  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
    }
  }
}

async function ensureBootstrapSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      owner_email TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'client',
      workspace_id TEXT,
      status TEXT NOT NULL DEFAULT 'invited',
      password_hash TEXT,
      password_set_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await ensureUserColumns(env);

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','manager','partner','client','artist')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)'
  ).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      persona_type TEXT NOT NULL CHECK (persona_type IN ('admin','manager','partner','client','artist','creator','producer','seller','agent_later')),
      display_name TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','paused','disabled','archived')),
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      active_workspace_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT,
      revoked_at TEXT,
      ip TEXT,
      user_agent TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT,
      persona_id TEXT,
      card_id TEXT,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function founderState(env) {
  const result = await env.DB.prepare(`
    SELECT
      lower(u.email) AS email,
      u.id,
      u.status,
      u.password_hash,
      SUM(CASE WHEN w.slug = 'boostr-internal' AND wm.status = 'active' THEN 1 ELSE 0 END) AS boostr_access,
      SUM(CASE WHEN w.slug = 'hummus-fl' AND wm.status = 'active' THEN 1 ELSE 0 END) AS hummus_access
    FROM users u
    LEFT JOIN workspace_members wm ON wm.user_id = u.id
    LEFT JOIN workspaces w ON w.id = wm.workspace_id
    WHERE lower(u.email) IN (?, ?)
    GROUP BY u.id, u.email, u.status, u.password_hash
  `).bind(...founderEmails).all();

  const completed = new Set(
    (result.results || [])
      .filter((row) =>
        row.status === 'active' &&
        Boolean(row.password_hash) &&
        Number(row.boostr_access || 0) > 0 &&
        Number(row.hummus_access || 0) > 0
      )
      .map((row) => row.email)
  );

  return {
    completed,
    closed: founderEmails.every((email) => completed.has(email))
  };
}

async function ensureWorkspace(env, config, ownerEmail, timestamp) {
  const existing = await env.DB.prepare(
    'SELECT id, slug, name FROM workspaces WHERE slug = ? LIMIT 1'
  ).bind(config.slug).first();
  if (existing?.id) return existing;

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).bind(id, config.type, config.name, config.slug, ownerEmail, timestamp, timestamp).run();
  return { id, slug: config.slug, name: config.name };
}

async function ensureMembership(env, workspaceId, userId, role, timestamp) {
  const current = await env.DB.prepare(
    'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1'
  ).bind(workspaceId, userId).first();

  if (current?.id) {
    await env.DB.prepare(
      "UPDATE workspace_members SET role = ?, status = 'active', updated_at = ? WHERE id = ?"
    ).bind(role, timestamp, current.id).run();
    return;
  }

  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, role, timestamp, timestamp).run();
}

async function ensurePersona(env, workspaceId, userId, persona, timestamp) {
  let row = await env.DB.prepare(`
    SELECT id FROM personas
    WHERE workspace_id = ? AND user_id = ? AND persona_type = ? AND display_name = ?
    LIMIT 1
  `).bind(workspaceId, userId, persona.type, persona.label).first();

  const metadata = JSON.stringify({ source: 'founder_bootstrap', label: persona.label });
  if (row?.id) {
    await env.DB.prepare(`
      UPDATE personas
      SET status = 'active', metadata_json = ?, updated_at = ?
      WHERE id = ?
    `).bind(metadata, timestamp, row.id).run();
    return row.id;
  }

  row = { id: crypto.randomUUID() };
  await env.DB.prepare(`
    INSERT INTO personas (
      id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).bind(
    row.id,
    userId,
    workspaceId,
    persona.type,
    persona.label,
    metadata,
    timestamp,
    timestamp
  ).run();
  return row.id;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  let stage = 'request';
  try {
    stage = 'schema';
    await ensureBootstrapSchema(env);

    stage = 'payload';
    const parsed = await readJson(request);
    if (!parsed.ok) return parsed.response;

    const email = clean(parsed.payload?.email, 180).toLowerCase();
    const password = clean(parsed.payload?.password, 500);
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

    stage = 'founder_state_before';
    const before = await founderState(env);
    if (before.closed) {
      return jsonError(
        'founder_bootstrap_closed',
        'BOOSTR founder initialization is complete. Use BOOSTR Login.',
        410,
        { bootstrap_closed: true }
      );
    }

    const timestamp = now();

    stage = 'workspaces';
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

    stage = 'user_lookup';
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE lower(email) = ? LIMIT 1'
    ).bind(email).first();

    const userId = existingUser?.id || crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    stage = 'user_upsert';
    if (existingUser?.id) {
      await env.DB.prepare(`
        UPDATE users
        SET name = ?, role = ?, workspace_id = ?, status = 'active',
            password_hash = ?, password_set_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        founder.displayName,
        founder.role,
        hummusWorkspace.id,
        passwordHash,
        timestamp,
        timestamp,
        userId
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO users (
          id, email, name, role, workspace_id, status,
          password_hash, password_set_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(
        userId,
        email,
        founder.displayName,
        founder.role,
        hummusWorkspace.id,
        passwordHash,
        timestamp,
        timestamp,
        timestamp
      ).run();
    }

    stage = 'memberships';
    await ensureMembership(env, boostrWorkspace.id, userId, founder.membershipRole, timestamp);
    await ensureMembership(env, hummusWorkspace.id, userId, founder.membershipRole, timestamp);

    stage = 'personas';
    let defaultPersonaId = null;
    for (const persona of founder.personas) {
      const personaId = await ensurePersona(env, hummusWorkspace.id, userId, persona, timestamp);
      if (persona.label === founder.defaultPersonaLabel) defaultPersonaId = personaId;
    }

    stage = 'finalize_user';
    await env.DB.prepare(`
      UPDATE users
      SET default_workspace_id = ?, default_persona_id = ?, language = 'es',
          theme = 'platinum_dark', signup_source = 'founder_bootstrap',
          onboarding_status = 'founder_ready', updated_at = ?
      WHERE id = ?
    `).bind(hummusWorkspace.id, defaultPersonaId, timestamp, userId).run();

    stage = 'activity';
    try {
      await env.DB.prepare(`
        INSERT INTO activity_events (
          id, workspace_id, user_id, persona_id, event_type, title, body, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, 'founder.bootstrap', 'Founder account activated', ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        hummusWorkspace.id,
        userId,
        defaultPersonaId,
        `${founder.publicUsername} founder profile activated.`,
        JSON.stringify({ email, workspaces: [boostrWorkspace.slug, hummusWorkspace.slug] }),
        timestamp
      ).run();
    } catch {}

    stage = 'founder_state_after';
    const after = await founderState(env);

    stage = 'session';
    const session = await createSession(env, request, userId, hummusWorkspace.id);

    return jsonOk({
      token: session.token,
      expires_at: session.expires_at,
      user: {
        id: userId,
        email,
        name: founder.displayName,
        username: founder.publicUsername,
        role: founder.role
      },
      active_workspace: hummusWorkspace,
      workspaces: [boostrWorkspace, hummusWorkspace],
      bootstrap_closed: after.closed,
      redirect: founder.redirect
    }, 201, { 'Set-Cookie': sessionCookie(session.token, request) });
  } catch (error) {
    return jsonError(
      'founder_bootstrap_failed',
      `No se pudo activar la cuenta durante: ${stage}.`,
      500,
      {
        stage,
        detail: clean(error?.message || error, 500)
      }
    );
  }
}
