const FOUNDER_WORLDS = {
  "janko@boostrlabs.com": {
    workspace: {
      id: "ws_janko_westdetro_artist",
      slug: "janko-westdetro",
      name: "JANKO / WESTDETRO Artist OS",
      type: "artist"
    },
    membershipRole: "artist",
    personas: [
      ["artist", "Janko Diorr Artist"],
      ["producer", "Janko Diorr Producer / Beatmaker"],
      ["creator", "Janko Creative Director"]
    ]
  },
  "johanka@boostrlabs.com": {
    workspace: {
      id: "ws_82ngel_artist",
      slug: "82ngel-artist",
      name: "82NGEL Artist OS",
      type: "artist"
    },
    membershipRole: "artist",
    personas: [
      ["artist", "82NGEL Artist"],
      ["creator", "Johanka Creative Director"]
    ]
  }
};

async function ensureTables(env) {
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

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      persona_type TEXT NOT NULL,
      display_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_modules (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      activated_at TEXT,
      activated_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_modules_workspace_module ON workspace_modules(workspace_id, module_id)").run();
}

async function ensureWorkspace(env, world, email, timestamp) {
  const existing = await env.DB.prepare(
    "SELECT id, name, slug, type, owner_email, status FROM workspaces WHERE slug = ? LIMIT 1"
  ).bind(world.workspace.slug).first();
  const workspaceId = existing?.id || world.workspace.id;
  let changed = false;

  if (!existing?.id) {
    await env.DB.prepare(`
      INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      workspaceId,
      world.workspace.type,
      world.workspace.name,
      world.workspace.slug,
      email,
      timestamp,
      timestamp
    ).run();
    changed = true;
  } else {
    const needsUpdate = existing.name !== world.workspace.name
      || existing.type !== world.workspace.type
      || !existing.owner_email
      || existing.status !== "active";
    if (needsUpdate) {
      await env.DB.prepare(
        "UPDATE workspaces SET name = ?, type = ?, owner_email = COALESCE(owner_email, ?), status = 'active', updated_at = ? WHERE id = ?"
      ).bind(world.workspace.name, world.workspace.type, email, timestamp, workspaceId).run();
      changed = true;
    }
  }

  return { workspaceId, changed };
}

async function ensureMembership(env, workspaceId, userId, role, timestamp) {
  const existing = await env.DB.prepare(
    "SELECT id, role, status FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1"
  ).bind(workspaceId, userId).first();

  if (existing?.id) {
    if (existing.role === role && existing.status === "active") return false;
    await env.DB.prepare("UPDATE workspace_members SET role = ?, status = 'active', updated_at = ? WHERE id = ?")
      .bind(role, timestamp, existing.id).run();
    return true;
  }

  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, role, timestamp, timestamp).run();
  return true;
}

async function ensurePersonas(env, workspaceId, userId, personas, timestamp) {
  let changed = false;
  for (const [type, label] of personas) {
    const existing = await env.DB.prepare(
      "SELECT id, status, metadata_json FROM personas WHERE workspace_id = ? AND user_id = ? AND persona_type = ? AND display_name = ? LIMIT 1"
    ).bind(workspaceId, userId, type, label).first();
    const metadata = JSON.stringify({ source: "founder_identity_sync", world: "artist_os" });
    if (existing?.id) {
      if (existing.status !== "active" || existing.metadata_json !== metadata) {
        await env.DB.prepare("UPDATE personas SET status = 'active', metadata_json = ?, updated_at = ? WHERE id = ?")
          .bind(metadata, timestamp, existing.id).run();
        changed = true;
      }
    } else {
      await env.DB.prepare(`
        INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).bind(crypto.randomUUID(), userId, workspaceId, type, label, metadata, timestamp, timestamp).run();
      changed = true;
    }
  }
  return changed;
}

async function ensureModules(env, workspaceId, userId, timestamp) {
  const moduleIds = ["mod_artist_os", "mod_smart_links"];
  let changed = false;
  for (const moduleId of moduleIds) {
    const module = await env.DB.prepare("SELECT id FROM modules WHERE id = ? LIMIT 1").bind(moduleId).first().catch(() => null);
    if (!module?.id) continue;
    const existing = await env.DB.prepare(
      "SELECT id, status, activated_at, activated_by FROM workspace_modules WHERE workspace_id = ? AND module_id = ? LIMIT 1"
    ).bind(workspaceId, moduleId).first();
    if (existing?.id) {
      if (existing.status !== "active" || !existing.activated_at || !existing.activated_by) {
        await env.DB.prepare(
          "UPDATE workspace_modules SET status = 'active', activated_at = COALESCE(activated_at, ?), activated_by = COALESCE(activated_by, ?), updated_at = ? WHERE id = ?"
        ).bind(timestamp, userId, timestamp, existing.id).run();
        changed = true;
      }
    } else {
      await env.DB.prepare(`
        INSERT INTO workspace_modules (id, workspace_id, module_id, status, activated_at, activated_by, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), workspaceId, moduleId, timestamp, userId, timestamp, timestamp).run();
      changed = true;
    }
  }
  return changed;
}

export async function ensureFounderIdentity(env, user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const world = FOUNDER_WORLDS[email];
  if (!world || !env?.DB || !user?.id) return { changed: false };

  const timestamp = new Date().toISOString();
  await ensureTables(env);
  const workspace = await ensureWorkspace(env, world, email, timestamp);
  const membershipChanged = await ensureMembership(env, workspace.workspaceId, user.id, world.membershipRole, timestamp);
  const personasChanged = await ensurePersonas(env, workspace.workspaceId, user.id, world.personas, timestamp);
  const modulesChanged = await ensureModules(env, workspace.workspaceId, user.id, timestamp);

  return {
    changed: workspace.changed || membershipChanged || personasChanged || modulesChanged,
    workspace_id: workspace.workspaceId,
    slug: world.workspace.slug
  };
}
