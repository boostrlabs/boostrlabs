const TRACKS = {
  caption: {
    title: "CAPTION",
    artist: "Janko Diorr ft. Gemese",
    cover: "/assets/music/caption.webp",
    release: "OUT NOW",
    links: [
      ["Spotify", "https://open.spotify.com/album/5G7vBxI7xyS47KLVpijvG8"],
      ["Apple Music", "https://music.apple.com/us/album/caption/6796476801?i=6796476802"]
    ]
  },
  sisisi: {
    title: "SISISI",
    artist: "NNE × WESTDETRO",
    cover: "/assets/music/sisisi.webp",
    release: "26 AGO 2026",
    links: [
      ["Ver Reel", "https://www.instagram.com/reel/DcM_FXagmhD/?igsi=cWdxOGx3bXFkZ2Q0"]
    ],
    pending: "Spotify, Apple Music y YouTube se activan cuando el release esté disponible."
  },
  "de-descargue": {
    title: "DE DESCARGUE",
    artist: "NNE × WESTDETRO",
    cover: "/assets/music/de-descargue.webp",
    release: "NNE / WESTDETRO",
    links: [],
    pending: "Los links oficiales de Spotify, Apple Music y YouTube todavía no están registrados en NNE."
  }
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function onRequestGet({ params }) {
  const track = TRACKS[String(params.slug || "").toLowerCase()];
  if (!track) return new Response("Not found", { status: 404 });

  const buttons = track.links.length
    ? track.links.map(([label, url]) => `<a class="platform" href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(label)}</span><b>↗</b></a>`).join("")
    : `<div class="pending">Links oficiales pendientes.</div>`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050505">
<title>${escapeHtml(track.title)} · NNE × WESTDETRO</title>
<style>
:root{color-scheme:dark;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#050505;color:#f5f5f5}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 0,rgba(216,182,106,.13),transparent 34%),#050505}.shell{width:min(620px,100%);margin:auto;padding:28px 20px 56px}.brand{font-size:.72rem;font-weight:800;letter-spacing:.2em;color:#d8b66a;margin-bottom:22px}.cover{aspect-ratio:1;border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#111;box-shadow:0 30px 90px rgba(0,0,0,.6)}.cover img{width:100%;height:100%;object-fit:cover;display:block}.meta{padding:24px 4px 18px}.meta small{color:#d8b66a;letter-spacing:.15em;font-weight:800}.meta h1{font-size:clamp(2.6rem,12vw,5rem);line-height:.9;letter-spacing:-.06em;margin:10px 0}.meta p{margin:0;color:#92929b;font-size:1rem}.links{display:grid;gap:10px;margin-top:16px}.platform,.home{display:flex;align-items:center;justify-content:space-between;min-height:58px;padding:0 18px;border-radius:16px;text-decoration:none;font-weight:850}.platform{background:#f4d58b;color:#080808}.platform:nth-child(2){background:#f3f3f3}.platform:nth-child(3){background:#ff3030;color:white}.pending{padding:16px 18px;border:1px solid rgba(255,255,255,.1);border-radius:16px;color:#999;background:#0d0d0f}.note{color:#888;line-height:1.5;font-size:.86rem;margin:16px 2px}.home{margin-top:24px;border:1px solid rgba(255,255,255,.1);color:#eee;background:#0d0d0f}.powered{text-align:center;color:#5f5f65;font-size:.7rem;letter-spacing:.16em;margin-top:28px}</style>
</head>
<body><main class="shell">
<div class="brand">NNE × WESTDETRO / MUSIC</div>
<div class="cover"><img src="${escapeHtml(track.cover)}" alt="${escapeHtml(track.title)}"></div>
<section class="meta"><small>${escapeHtml(track.release)}</small><h1>${escapeHtml(track.title)}</h1><p>${escapeHtml(track.artist)}</p></section>
<section class="links">${buttons}</section>
${track.pending ? `<p class="note">${escapeHtml(track.pending)}</p>` : ""}
<a class="home" href="https://nne.westdetro.com"><span>Volver a NNE</span><b>→</b></a>
<div class="powered">POWERED BY BOOSTR LABS</div>
</main></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "public, max-age=300" } });
}
