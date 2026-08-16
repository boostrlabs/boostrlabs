const catalog = [
  ["s1_catalog_caption", "CAPTION · Apple Music", "https://music.apple.com/us/album/caption/6796476801?i=6796476802", 300],
  ["s1_catalog_punto_g", "PUNTO G · Apple Music", "https://music.apple.com/us/album/punto-g/6800841312?i=6800841313", 301],
  ["s1_catalog_sin_forzar", "SIN FORZAR FREESTYLE · Apple Music", "https://music.apple.com/us/album/sin-forzar-freestyle/6799868311?i=6799868312", 302],
  ["s1_catalog_late_night", "LATE NIGHT · Apple Music", "https://music.apple.com/us/album/late-night/6782543842?i=6782543843", 303],
  ["s1_catalog_es_mala", "ES MALA PERO ASÍ ME GUSTA · Apple Music", "https://music.apple.com/us/album/es-mala-pero-as%C3%AD-me-gusta/6790942184?i=6790942190", 304],
  ["s1_catalog_westdetro_intro", "WESTDETRO INTRO · Apple Music", "https://music.apple.com/us/album/westdetro-intro/1873201966?i=1873201967", 305],
  ["s1_catalog_nonono", "NONONO · Catalog Discovery", "https://music.apple.com/us/album/nonono/1842045191?i=1842045192", 306],
  ["s1_catalog_chacha", "CHACHA · Catalog Discovery", "https://music.apple.com/us/album/chacha/1893525675?i=1893525677", 307],
  ["s1_catalog_nota_breve", "NOTA BREVE · Catalog Discovery", "https://music.apple.com/us/album/nota-breve/6780676033?i=6780676034", 308],
  ["s1_catalog_mientras", "MIENTRAS SALE OTRO TEMA · Catalog Discovery", "https://music.apple.com/us/album/mientras-sale-otro-tema/6799672171?i=6799672172", 309],
  ["s1_catalog_menor_20", "UN MENOR DE 20 · Catalog Discovery", "https://music.apple.com/us/album/un-menor-de-20/6793890885?i=6793890887", 310]
];

const tiktoks = [
  ["s1_tiktok_01", "TikTok Push · Janko #1", "https://www.tiktok.com/t/ZT9k5ohdWXe5A-ygyWm/", 330],
  ["s1_tiktok_02", "TikTok Push · Janko #2", "https://www.tiktok.com/t/ZT9k5oacWmLpH-PYAYr/", 331],
  ["s1_tiktok_03", "TikTok Push · Janko #3", "https://www.tiktok.com/t/ZT9k5oann9wFQ-WN7QT/", 332],
  ["s1_tiktok_04", "TikTok Push · Janko #4", "https://www.tiktok.com/t/ZT9k5ouajRPpG-oJaCD/", 333],
  ["s1_tiktok_05", "TikTok Push · Janko #5", "https://www.tiktok.com/t/ZT9k5o97Eb7GK-gbNmP/", 334],
  ["s1_tiktok_06", "TikTok Push · Janko #6", "https://www.tiktok.com/t/ZT9k5oxmy81Po-gy5PH/", 335]
];

const spotifyProfile = "https://open.spotify.com/artist/4Ft2k88AyQucZ1IXYtLHpu";

function upsertQuest(env, id, platform, title, description, credits, sort) {
  return env.DB.prepare(`INSERT INTO nne_quests (id,type,platform,title,description,icon,reward_credits,reward_xp,status,cadence,verification_method,minimum_listen_seconds,pass_percentage,minimum_level,starts_at,ends_at,sort_order,created_at,updated_at)
    VALUES (?,'social-proof',?,?,?,'◆',?,?,'published','once','manual',0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',?,datetime('now'),datetime('now'))
    ON CONFLICT(id) DO UPDATE SET platform=excluded.platform,title=excluded.title,description=excluded.description,reward_credits=excluded.reward_credits,reward_xp=excluded.reward_xp,status='published',starts_at=excluded.starts_at,ends_at=excluded.ends_at,sort_order=excluded.sort_order,updated_at=datetime('now')`)
    .bind(id, platform, title, description, credits, credits, sort);
}

export async function ensureNneSeason001Catalog(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_runtime_flags (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  const ready = await env.DB.prepare(`SELECT value FROM nne_runtime_flags WHERE key='season_001_catalog_v1' LIMIT 1`).first();
  if (ready?.value === 'ready') return;
  const statements = [];

  statements.push(upsertQuest(env, "s1_spotify_profile", "Spotify", "Janko Diorr · Artist Profile", `Abre el perfil oficial de Janko Diorr y familiarízate con el catálogo de Season 001. Esta quest es una visita de discovery, no paga por repetir streams. Sube screenshot del perfil abierto.\n\nAbrir perfil: ${spotifyProfile}`, 100, 290));

  for (const [id,title,url,sort] of catalog) {
    statements.push(upsertQuest(env, id, "Apple Music", title, `Catalog Discovery: abre la ficha oficial, reconoce el release y sube screenshot. En la nota puedes decir qué tema quieres ver dentro de NNE. No se exige repetir reproducciones.\n\nAbrir release: ${url}`, 100, sort));
  }

  for (const [id,title,url,sort] of tiktoks) {
    statements.push(upsertQuest(env, id, "TikTok", title, `Support Bundle: like + comentario + share/repost en el mismo TikTok. Las tres acciones juntas califican; una acción aislada no genera Credits.\n\nAbrir TikTok: ${url}`, 100, sort));
  }

  statements.push(env.DB.prepare(`INSERT INTO nne_runtime_flags (key,value,updated_at) VALUES ('season_001_catalog_v1','ready',datetime('now')) ON CONFLICT(key) DO UPDATE SET value='ready',updated_at=datetime('now')`));
  await env.DB.batch(statements);
}
