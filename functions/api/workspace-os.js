import {
  clean,
  json,
  jsonError,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../_lib/api.js";
import { ensureFounderIdentity } from "../_lib/founder-identity.js";

const safeAll = async (statement) => {
  try {
    const result = await statement.all();
    return result.results || [];
  } catch (error) {
    console.error("Workspace OS query failed:", error);
    return [];
  }
};

const safeFirst = async (statement, fallback = null) => {
  try {
    return (await statement.first()) || fallback;
  } catch (error) {
    console.error("Workspace OS query failed:", error);
    return fallback;
  }
};

function routeSet(workspace, userEmail) {
  const slug = String(workspace?.slug || "").toLowerCase();
  const type = String(workspace?.type || "").toLowerCase();
  const common = [
    { id: "files", title: "Archivos", copy: "Assets y entregables del workspace.", href: "/app/files/" },
    { id: "products", title: "Productos y servicios", copy: "Ofertas creadas dentro de este workspace.", href: "/app/products/" },
    { id: "pay", title: "Smart Payment Link", copy: "Prepara una ruta de cobro cuando Stripe esté conectado.", href: "/smart-payment-link/" },
    { id: "modules", title: "Module Deck", copy: "Capacidades disponibles para este workspace.", href: "/modules/" }
  ];

  if (slug === "boostr-internal") {
    return [
      { id: "founder", title: "Janko Custom OS", copy: "Tu centro personal de founder, manager, artista y productor.", href: "/app/janko/" },
      { id: "manager", title: "BOOSTR Manager", copy: "Leads, workspaces, módulos y operación global.", href: "/manager/" },
      { id: "admin", title: "Admin OS", copy: "Usuarios, permisos y salud del sistema.", href: "/admin/" },
      { id: "audit", title: "Audit Inbox", copy: "Capturas reales recibidas desde BOOSTR Audit.", href: "/manager/leads/" },
      ...common
    ];
  }

  if (slug === "hummus-fl") {
    return [
      { id: "janko_missions", title: "Manager Missions", copy: "Datos, sistemas, APIs, decisiones y growth de Hummus.", href: "/hummusfl/manager-missions/" },
      { id: "johanka_missions", title: "Creative Missions", copy: "Workflow creativo, assets y entregas de Hummus.", href: "/hummusfl/creative-missions/" },
      { id: "cloud", title: "Johanka Cloud", copy: "Piscina privada de imágenes para el workflow creativo.", href: "/app/johanka/cloud/" },
      { id: "audit", title: "Audit Hummus", copy: "Captura y actualización de información operativa no sensible.", href: "/audit/" },
      ...common
    ];
  }

  if (slug === "janko-westdetro" || (type === "artist" && /janko|westdetro/i.test(workspace?.name || ""))) {
    return [
      { id: "custom_os", title: "Volver a Janko Custom OS", copy: "Founder, BOOST Money, Manager y todos tus roles.", href: "/app/janko/" },
      { id: "public", title: "JANKO / WESTDETRO Link OS", copy: "Front door público de música, servicios y mundo artístico.", href: "/jankodiorr/" },
      { id: "missions", title: "Artist Missions", copy: "Roadmap artístico y productivo. Sin tareas inventadas.", href: "/app/janko/" },
      ...common
    ];
  }

  if (slug === "82ngel-artist" || (type === "artist" && /82ngel/i.test(workspace?.name || ""))) {
    return [
      { id: "custom_os", title: "Volver a Johanka Custom OS", copy: "Creative Leader, Hummus y 82NGEL.", href: "/app/johanka/" },
      { id: "public", title: "82NGEL Smart Link", copy: "Front door público de la artista.", href: "/82ngel/" },
      { id: "cloud", title: "Johanka Cloud", copy: "Assets privados para 82NGEL y proyectos creativos.", href: "/app/johanka/cloud/" },
      ...common
    ];
  }

  const founderHome = String(userEmail || "").toLowerCase() === "johanka@boostrlabs.com" ? "/app/johanka/" : "/app/janko/";
  return [
    { id: "custom_os", title: "Volver a mi Custom OS", copy: "Regresa a tu panel personal.", href: founderHome },
    ...common
  ];
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  let auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  try {
    const synced = await ensureFounderIdentity(env, auth.user);
    if (synced.changed) {
      const refreshed = await requireSession(request, env);
      if (refreshed.ok) auth = refreshed;
    }
  } catch (error) {
    console.error("Workspace OS founder sync failed:", error);
  }

  const url = new URL(request.url);
  const requested = clean(url.searchParams.get("workspace"), 120);
  const membershipIds = (auth.memberships || []).map((item) => clean(item.workspace_id, 120)).filter(Boolean);
  const candidateIds = [
    clean(requested, 120),
    clean(auth.active_workspace_id, 120),
    ...membershipIds
  ].filter(Boolean);

  let workspace = null;
  for (const candidate of [...new Set(candidateIds)]) {
    workspace = await safeFirst(
      env.DB.prepare(
        "SELECT id, name, slug, type, owner_email, status, created_at, updated_at FROM workspaces WHERE id = ? OR lower(slug) = lower(?) LIMIT 1"
      ).bind(candidate, candidate)
    );
    if (workspace?.id) break;
  }

  const availableWorkspaces = (auth.memberships || [])
    .filter((item) => item.workspace_id)
    .map((item) => ({
      id: item.workspace_id,
      slug: item.workspace_slug,
      name: item.workspace_name,
      type: item.workspace_type,
      role: item.role
    }));

  if (!workspace?.id) {
    return json({
      ok: true,
      workspace: null,
      user: auth.user,
      cards: [],
      activity: [],
      modules: [],
      counts: { cards: 0, activity: 0, files: 0, products: 0 },
      routes: [],
      available_workspaces: availableWorkspaces,
      warning: "workspace_not_found"
    });
  }

  const access = requireWorkspaceAccess(auth, workspace.id);
  if (!access.ok) return access.response;

  const membership = auth.memberships?.find((item) => item.workspace_id === workspace.id) || null;
  const [cards, activity, modules, fileCount, productCount] = await Promise.all([
    safeAll(env.DB.prepare(
      `SELECT id, card_type, title, summary, priority, status, action_label, action_url, created_at, updated_at
       FROM cards
       WHERE workspace_id = ? AND status != 'archived'
       ORDER BY updated_at DESC LIMIT 40`
    ).bind(workspace.id)),
    safeAll(env.DB.prepare(
      `SELECT id, event_type, title, body, created_at
       FROM activity_events
       WHERE workspace_id = ?
       ORDER BY created_at DESC LIMIT 20`
    ).bind(workspace.id)),
    safeAll(env.DB.prepare(
      `SELECT modules.id, modules.slug, modules.name, modules.category,
              COALESCE(workspace_modules.status, 'locked') AS status
       FROM modules
       LEFT JOIN workspace_modules
         ON workspace_modules.module_id = modules.id
        AND workspace_modules.workspace_id = ?
       ORDER BY modules.category, modules.name`
    ).bind(workspace.id)),
    safeFirst(env.DB.prepare(
      "SELECT COUNT(*) AS total FROM workspace_files WHERE workspace_id = ? AND status = 'active'"
    ).bind(workspace.id), { total: 0 }),
    safeFirst(env.DB.prepare(
      "SELECT COUNT(*) AS total FROM products WHERE workspace_id = ? AND status != 'archived'"
    ).bind(workspace.id), { total: 0 })
  ]);

  return json({
    ok: true,
    workspace: {
      ...workspace,
      role: membership?.role || auth.user?.role || null
    },
    user: auth.user,
    cards,
    activity,
    modules,
    counts: {
      cards: cards.length,
      activity: activity.length,
      files: Number(fileCount?.total || 0),
      products: Number(productCount?.total || 0)
    },
    routes: routeSet(workspace, auth.user?.email),
    available_workspaces: availableWorkspaces
  });
}