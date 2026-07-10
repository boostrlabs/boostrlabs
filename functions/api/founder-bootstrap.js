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
    defaultPersonaKey: 'founder_manager',
    personas: [
      { key: 'founder_manager', type: 'manager', label: 'Janko Founder / BOOSTR Manager' },
      { key: 'artist', type: 'artist', label: 'Janko Diorr Artist' },
      { key: 'producer', type: 'producer', label: 'Janko Diorr Producer / Beatmaker' },
      { key: 'creative_director', type: 'creator', label: 'Janko Creative Director' }
    ],
    redirect: '/hummusfl/manager-missions/?v=0.6.8'
  },
  'johanka@boostrlabs.com': {
    profileKey: 'johanka',
    displayName: 'Johanka',
    username: 'johanka',
    role: 'creator',
    membershipRole: 'manager',
    defaultPersonaKey: 'creative_leader',
    personas: [
      { key: 'manager', type: 'manager', label: 'Johanka BOOSTR Manager' },
      { key: 'creative_leader', type: 'creator', label: 'Johanka Creative Leader / Director' },
      { key: 'artist', type: 'artist', label: '82NGEL Artist' }
    ],
    redirect: '/hummusfl/creative-missions/?v=0.6.8'
  }
};

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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  const userColumns = await env.DB.prepare('PRAGMA table_info(users)').all();
  const existing = new Set((userColumns.results || []).map((column) => column.name));
  const additions = [
    ['username', 'TEXT'],
    ['password_hash', 'TEXT'],
    ['password_set_at', 'TEXT'],
    ['default_workspace_id', 'TEXT'],
    ['default_persona_id', 'TEXT'],
    ['language', "TEXT NOT NULL DEFAULT 'es'"],
    ['theme', "TEXT NOT NULL DEFAULT 'platinum_dark'"],
    ['signup_source', 'TEXT'],
    ['onboarding_status', "TEXT NOT NULL DEFAULT 'first_run'"]
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
    }
  }

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','manager','partner','client','artist','creator','producer','seller')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)').run();

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
      u.username,
      u.status,
      u.password_hash,
      u.default_persona_id,
      u.onboarding_status,
      SUM(CASE WHEN w.slug = 'boostr-internal' AND wm.status = 'active' THEN 1 ELSE 0 END) AS boostr_access,
      SUM(CASE WHEN w.slug = 'hummus-fl' AND wm.status = 'active' THEN 1 ELSE 0 END) AS hummus_access
    FROM users u
    LEFT JOIN workspace_members wm ON wm.user_id = u.id
    LEFT JOIN workspaces w ON w.id = wm.workspace_id
    WHERE lower(u.email) IN (?, ?)
    GROUP BY u.id, u.email, u.username, u.status, u.password_hash, u.default_persona_id, u.onboarding_status
  `).bind(...founderEmails).all();

  const rows = result.results || [];
  const completed = new Set(
    rows
      .filter((row) =>
        row.status === 'active' &&
        Boolean(row.password_hash) &&
        Boolean(row.default_persona_id) &&
        Number(row.boostr_access || 0) > 0 &&
        Number(row.hummus_access || 0) > 0 &&
        row.onboarding_status === 'founder_ready'
      )
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
      `UPDATE workspace_members SET role = ?, status = 'active', updated_at = ? WHERE id = ?`
    ).bind(role, timestamp, current.id).run();
    return;
  }

  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, role, timestamp, timestamp).run();
}

async function ensurePersona(env, workspaceId, userId, persona, timestamp, isDefault) {
  const metadata = JSON.stringify({
    source: 'founder_bootstrap',
    persona_key: persona.key,
    label: persona.label,
    default: Boolean(isDefault)
  });

  let row = await env.DB.prepare(
    `SELECT id FROM personas
     WHERE workspace_id = ? AND user_id = ? AND persona_type = ?
       AND json_extract(metadata_json, '$.persona_key') = ?
     LIMIT 1`
  ).bind(workspaceId, userId, persona.type, persona.key).first();

  if (!row?.id) {
    row = { id: crypto.randomUUID() };
    await env.DB.prepare(`
      INSERT INTO personas (id, workspace_id, user_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).bind(row.id, workspaceId, userId, persona.type, persona.label, metadata, timestamp, timestamp).run();
  } else {
    await env.DB.prepare(`
      UPDATE personas SET display_name = ?, status = 'active', metadata_json = ?, updated_at = ? WHERE id = ?
    `).bind(persona.label, metadata, timestamp, row.id).run();
  }
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
    if (before.completed.has(email)) {
      return jsonError(
        'founder_account_exists',
        'This founder account already exists. Use BOOSTR Login.',
        409,
        { account_exists: true }
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

    stage = 'user_upsert';
    if (emailUser?.id || usernameUser?.id) {
      await env.DB.prepare(`
        UPDATE users SET email = ?, name = ?, username = ?, role = ?, workspace_id = ?,
          default_workspace_id = ?, status = 'active', password_hash = ?, password_set_at = ?,
          language = 'es', theme = 'platinum_dark', signup_source = 'founder_bootstrap',
          onboarding_status = 'founder_bootstrap_pending', updated_at = ? WHERE id = ?
      `).bind(
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
      await env.DB.prepare(`
        INSERT INTO users (
          id, email, name, username, role, workspace_id, default_workspace_id, status,
          password_hash, password_set_at, language, theme, signup_source, onboarding_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'es', 'platinum_dark', 'founder_bootstrap', 'founder_bootstrap_pending', ?, ?)
      `).bind(
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

    stage = 'memberships';
    await ensureMembership(env, boostrWorkspace.id, userId, founder.membershipRole, timestamp);
    await ensureMembership(env, hummusWorkspace.id, userId, founder.membershipRole, timestamp);

    stage = 'personas';
    let defaultPersonaId = null;
    for (const persona of founder.personas) {
      const personaId = await ensurePersona(
        env,
        hummusWorkspace.id,
        userId,
        persona,
        timestamp,
        persona.key === founder.defaultPersonaKey
      );
      if (persona.key === founder.defaultPersonaKey) defaultPersonaId = personaId;
    }

    stage = 'finalize_user';
    await env.DB.prepare(`
      UPDATE users SET default_persona_id = ?, onboarding_status = 'founder_ready', updated_at = ? WHERE id = ?
    `).bind(defaultPersonaId, timestamp, userId).run();

    stage = 'activity';
    try {
      await env.DB.prepare(`
        INSERT INTO activity_events (id, workspace_id, user_id, persona_id, event_type, title, body, metadata_json, created_at)
        VALUES (?, ?, ?, ?, 'founder.bootstrap', 'Founder account activated', ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        hummusWorkspace.id,
        userId,
        defaultPersonaId,
        `${founder.username} founder profile activated.`,
        JSON.stringify({ profile: founder.profileKey, workspaces: [boostrWorkspace.slug, hummusWorkspace.slug] }),
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
        username: founder.username,
        role: founder.role
      },
      active_workspace: hummusWorkspace,
      workspaces: [boostrWorkspace, hummusWorkspace],
      bootstrap_closed: after.closed,
      redirect: founder.redirect
    }, 201, { 'Set-Cookie': sessionCookie(session.token, request) });
  } catch (error) {
    console.error('founder-bootstrap failed', { stage, message: error?.message });
    return jsonError(
      'founder_bootstrap_failed',
      `No se pudo activar la cuenta durante: ${stage}.`,
      500,
      { stage }
    );
  }
}
