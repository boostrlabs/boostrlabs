import { ensureNneSeason001 } from "../_lib/nne-season-001.js";
import { ensureNneSeason001Catalog } from "../_lib/nne-season-001-catalog.js";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizedDescription(description = "") {
  return String(description).replace(/\\n/g, "\n");
}

function sourceUrl(description = "") {
  const match = normalizedDescription(description).match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function publicDescription(description = "") {
  return normalizedDescription(description)
    .replace(/\s*\n*Abrir (?:contenido|perfil|release|TikTok|Reel):\s*https?:\/\/[^\s]+\s*$/i, "")
    .trim();
}

async function ensureAccessTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_quest_access (
    quest_id TEXT PRIMARY KEY,
    visibility TEXT NOT NULL DEFAULT 'preview' CHECK (visibility IN ('public','preview','private')),
    updated_at TEXT NOT NULL
  )`).run();
}

function page({ quest, origin }) {
  const visibility = quest.visibility || "preview";
  const isPublic = visibility === "public";
  const isPrivate = visibility === "private";
  const description = isPrivate
    ? "Chamba exclusiva para miembros NNE. Inicia sesión para ver los detalles."
    : publicDescription(quest.description);
  const source = isPublic ? sourceUrl(quest.description) : null;
  const smartPath = `/chamba/${encodeURIComponent(quest.id)}`;
  const loginUrl = `/login?from=${encodeURIComponent(smartPath)}`;
  const signupUrl = `/signup?from=${encodeURIComponent(smartPath)}`;
  const action = source
    ? `<a class="cta" href="${esc(source)}" target="_blank" rel="noreferrer">Abrir chamba</a>`
    : `<a class="cta" href="${esc(loginUrl)}">Entrar a NNE para hacerla</a>`;
  const accessLabel = isPublic ? "PÚBLICA" : isPrivate ? "PRIVADA" : "VISTA PÚBLICA";
  const protectedNote = isPublic ? "" : `<p class="note">Los links operativos, evidencia y detalles protegidos se desbloquean después de identificarte.</p>`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050505">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/assets/brand/nne-logo-white.png">
<title>${esc(quest.title)} · NNE × WESTDETRO</title>
<meta name="description" content="${esc(description.slice(0, 150))}">
<style>
:root{color-scheme:dark;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#050505;color:#f5f5f5}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 10% 0%,rgba(111,15,24,.25),transparent 34%),#050505}.wrap{width:min(760px,100%);margin:auto;padding:32px 18px 60px}.brand{display:flex;gap:10px;align-items:center;color:#d8b66a;font-size:.75rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:38px}.mark{width:42px;height:42px;border:1px solid rgba(216,182,106,.35);border-radius:14px;display:grid;place-items:center;color:#f1d18a;font-weight:900}.card{border:1px solid rgba(255,255,255,.09);border-radius:26px;padding:24px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));box-shadow:0 24px 80px rgba(0,0,0,.55)}.eyebrow{color:#d8b66a;font-size:.72rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase}.pill{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;border:1px solid rgba(216,182,106,.25);color:#f1d18a;font-size:.72rem;font-weight:800}h1{font-size:clamp(2.1rem,10vw,4.5rem);line-height:.93;letter-spacing:-.06em;margin:12px 0 18px}p{color:#9b9ba3;line-height:1.55}.reward{font-size:1.6rem;font-weight:900;color:#f1d18a;margin:24px 0}.cta,.secondary{display:flex;min-height:54px;align-items:center;justify-content:center;border-radius:14px;text-decoration:none;font-weight:900}.cta{background:linear-gradient(180deg,#f1d18a,#d8b66a);color:#111}.secondary{margin-top:10px;border:1px solid rgba(255,255,255,.1);color:#f5f5f5}.note{font-size:.86rem;margin-top:18px}.share{margin-top:18px;background:transparent;border:0;color:#d8b66a;font-weight:800;padding:8px 0}.install{margin-top:28px;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.025)}.install strong{display:block;margin-bottom:7px}.install small{color:#8b8b93;line-height:1.45}@media(max-width:520px){.wrap{padding-top:22px}.card{padding:20px;border-radius:22px}}
</style>
</head>
<body>
<main class="wrap">
  <div class="brand"><span class="mark">NNE</span><span>NNE × WESTDETRO · SMART CHAMBA</span></div>
  <article class="card">
    <div class="eyebrow">${esc(quest.platform)} · ${accessLabel}</div>
    <span class="pill">SMART LINK</span>
    <h1>${esc(quest.title)}</h1>
    <p>${esc(description)}</p>
    <div class="reward">+${Number(quest.reward_credits || 0)} NNE</div>
    ${action}
    ${source ? "" : `<a class="secondary" href="${esc(signupUrl)}">Crear cuenta NNE</a>`}
    ${protectedNote}
    <button class="share" id="copy">Copiar smart link</button>
  </article>
  <aside class="install"><strong>Úsalo como app en tu celular</strong><small>iPhone: abre NNE en Safari → Compartir → Agregar a pantalla de inicio. Android/Chrome puede mostrar la opción Instalar app.</small></aside>
</main>
<script>
document.getElementById('copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('${esc(origin)}${smartPath}');document.getElementById('copy').textContent='Link copiado'}catch(e){}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}
</script>
</body>
</html>`;
}

export async function onRequestGet({ request, env, params }) {
  await ensureNneSeason001(env);
  await ensureNneSeason001Catalog(env);
  await ensureAccessTable(env);

  const questId = String(params.questId || "").trim();
  const now = new Date().toISOString();
  const quest = await env.DB.prepare(`SELECT
      q.id, q.platform, q.title, q.description, q.reward_credits, q.reward_xp,
      q.minimum_level, q.starts_at, q.ends_at, q.status,
      COALESCE(a.visibility, 'preview') AS visibility
    FROM nne_quests q
    LEFT JOIN nne_quest_access a ON a.quest_id = q.id
    WHERE q.id = ? AND q.status = 'published'
      AND (q.starts_at IS NULL OR q.starts_at <= ?)
      AND (q.ends_at IS NULL OR q.ends_at > ?)
    LIMIT 1`)
    .bind(questId, now, now)
    .first();

  if (!quest?.id) {
    return new Response("Chamba no disponible", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const origin = new URL(request.url).origin;
  return new Response(page({ quest, origin }), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "x-nne-smart-link": "edge-v1"
    }
  });
}
