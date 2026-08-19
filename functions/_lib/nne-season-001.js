const START = "2026-08-16T00:00:00.000Z";
const END = "2026-08-29T04:00:00.000Z";

const songs = [
  ["s1_song_punto_g", "PUNTO G", "Janko Diorr", "https://open.spotify.com/album/3t8TDwuqZc8n5fZElGK83w"],
  ["s1_song_caption", "CAPTION", "Janko Diorr ft. Gemese", "https://open.spotify.com/album/5G7vBxI7xyS47KLVpijvG8"],
  ["s1_song_late_night", "LATE NIGHT", "Janko Diorr", "https://open.spotify.com/album/2pyeIgVOnx28Qm0Oq2zAH4"],
  ["s1_song_sin_forzar", "SIN FORZAR FREESTYLE", "Janko Diorr", "https://music.apple.com/us/album/sin-forzar-freestyle/6799868311?i=6799868312"],
  ["s1_song_es_mala", "ES MALA PERO ASÍ ME GUSTA", "Janko Diorr", "https://open.spotify.com/album/4Rx63zryufm3xN2gUpi7WR"],
  ["s1_song_westdetro_intro", "WESTDETRO INTRO", "Janko Diorr", "https://open.spotify.com/album/4vqwSq9ZkntFcOPRe1k1iM"]
];

const content = {
  tracklist: "https://www.instagram.com/p/DcET7ppDg_B/",
  punto_g: "https://www.instagram.com/reel/DcEJX7MOkGK/",
  sin_forzar: "https://www.instagram.com/reel/DcCa3n-uPSy/",
  caption: "https://www.instagram.com/reel/DcAVHCtuGIu/",
  baby_mama: "https://www.instagram.com/reel/DbuNvAWuxDM/",
  late_night: "https://www.instagram.com/reel/DbtWjqhPvSk/",
  es_mala: "https://www.instagram.com/reel/Da6UgnyORXt/",
  tutorial: "https://www.instagram.com/reel/DZ-vLvGvjUC/",
  tutorial_result: "https://www.instagram.com/reel/Dafq8hUtOzQ/",
  late_night_2: "https://www.instagram.com/reel/DZyHYOqPiVj/"
};

const support = [
  ["s1_support_tracklist", "Instagram", "Support · Tracklist WESTDETRO", "Like + comentario + repost/share del tracklist oficial. Las tres acciones juntas completan la quest.", content.tracklist, 0.25, 10],
  ["s1_comments_tracklist", "Instagram", "Comment Run · Tracklist WESTDETRO", "Deja 10 comentarios reales en el post oficial y sube evidencia verificable.", content.tracklist, 0.5, 11],
  ["s1_support_punto_g", "Instagram", "Support · PUNTO G", "Like + comentario + repost/share del Reel oficial de PUNTO G.", content.punto_g, 0.25, 20],
  ["s1_comments_punto_g", "Instagram", "10 comentarios · PUNTO G", "Completa un run de 10 comentarios en este Reel. Sube evidencia donde se pueda verificar el esfuerzo.", content.punto_g, 0.5, 21],
  ["s1_support_caption", "Instagram", "Support · CAPTION", "Like + comentario + repost/share del Reel oficial de CAPTION.", content.caption, 0.25, 30],
  ["s1_comments_caption", "Instagram", "10 comentarios · CAPTION", "Completa un run de 10 comentarios en el Reel oficial de CAPTION.", content.caption, 0.5, 31],
  ["s1_support_sin_forzar", "Instagram", "Support · SIN FORZAR FREESTYLE", "Like + comentario + repost/share del Reel oficial.", content.sin_forzar, 0.25, 40],
  ["s1_comments_sin_forzar", "Instagram", "10 comentarios · SIN FORZAR", "Completa un run de 10 comentarios en el Reel oficial.", content.sin_forzar, 0.5, 41],
  ["s1_support_late_night", "Instagram", "Support · LATE NIGHT", "Like + comentario + repost/share del Reel oficial de LATE NIGHT.", content.late_night, 0.25, 50],
  ["s1_comments_late_night", "Instagram", "10 comentarios · LATE NIGHT", "Completa un run de 10 comentarios en el Reel oficial.", content.late_night, 0.5, 51],
  ["s1_support_es_mala", "Instagram", "Support · ES MALA PERO ASÍ ME GUSTA", "Like + comentario + repost/share del Reel oficial.", content.es_mala, 0.25, 60],
  ["s1_comments_es_mala", "Instagram", "10 comentarios · ES MALA...", "Completa un run de 10 comentarios en el Reel oficial.", content.es_mala, 0.5, 61],
  ["s1_support_baby_mama", "Instagram", "Support · BABY MAMA", "Like + comentario + repost/share del Reel oficial de BABY MAMA.", content.baby_mama, 0.25, 70],
  ["s1_support_tutorial", "Instagram", "Support · Cómo hacer un WESTDETRO", "Mira el tutorial y completa like + comentario + repost/share.", content.tutorial, 0.25, 80],
  ["s1_support_tutorial_result", "Instagram", "Support · Resultado WESTDETRO", "Apoya el resultado del tutorial con like + comentario + repost/share.", content.tutorial_result, 0.25, 81]
];

const creatorSongs = [
  ["punto_g", "PUNTO G", content.punto_g],
  ["caption", "CAPTION", content.caption],
  ["late_night", "LATE NIGHT", content.late_night],
  ["sin_forzar", "SIN FORZAR FREESTYLE", content.sin_forzar],
  ["es_mala", "ES MALA PERO ASÍ ME GUSTA", content.es_mala]
];

const rewards = [
  ["s1_reward_early", "WESTDETRO Early Access", "Acceso anticipado digital de Season 001.", "EARLY", 10, null, 10],
  ["s1_reward_creator_review", "NNE Creator Review", "Feedback privado sobre una pieza de contenido o estrategia creativa.", "REVIEW", 15, null, 20],
  ["s1_reward_shirt", "NNE / WESTDETRO T-shirt", "T-shirt físico del drop Season 001.", "TEE", 50, null, 30],
  ["s1_reward_af1_white", "AF1 White", "Air Force 1 blancas. Talla sujeta a disponibilidad del proveedor.", "AF1", 65, null, 40],
  ["s1_reward_af1_black", "AF1 Black", "Air Force 1 negras. Talla sujeta a disponibilidad del proveedor.", "AF1", 75, null, 50],
  ["s1_reward_westdetro_beat", "Beat WESTDETRO", "Beat original del universo WESTDETRO, sujeto a briefing y términos del reward.", "BEAT", 100, null, 60],
  ["s1_reward_nike_tech", "Nike Tech Set", "Conjunto Nike Tech completo. Talla/color sujetos a disponibilidad.", "TECH", 150, null, 70],
  ["s1_reward_production", "Full Production · Janko Diorr", "Producción completa con beat, producción, mix y master. Sujeta a agenda y términos del reward.", "PROD", 200, null, 80]
];

function questUpsert(env, { id, type = "social-proof", platform, title, description, icon = "◆", credits, xp = credits, cadence = "once", verification = "manual", songId = null, listen = 0, pass = 75, level = 1, sort = 0 }) {
  return env.DB.prepare(`INSERT INTO nne_quests (id,type,platform,title,description,icon,reward_credits,reward_xp,status,cadence,verification_method,song_id,minimum_listen_seconds,pass_percentage,minimum_level,starts_at,ends_at,sort_order,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?, 'published',?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    ON CONFLICT(id) DO UPDATE SET type=excluded.type,platform=excluded.platform,title=excluded.title,description=excluded.description,icon=excluded.icon,reward_credits=excluded.reward_credits,reward_xp=excluded.reward_xp,status='published',cadence=excluded.cadence,verification_method=excluded.verification_method,song_id=excluded.song_id,minimum_listen_seconds=excluded.minimum_listen_seconds,pass_percentage=excluded.pass_percentage,minimum_level=excluded.minimum_level,starts_at=excluded.starts_at,ends_at=excluded.ends_at,sort_order=excluded.sort_order,updated_at=datetime('now')`)
    .bind(id,type,platform,title,description,icon,credits,xp,cadence,verification,songId,listen,pass,level,START,END,sort);
}

export async function ensureNneSeason001(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_runtime_flags (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  const ready = await env.DB.prepare(`SELECT value FROM nne_runtime_flags WHERE key='season_001_economy_v3' LIMIT 1`).first();
  if (ready?.value === "ready") return;

  const statements = [
    env.DB.prepare(`UPDATE nne_rewards SET status='archived', updated_at=datetime('now') WHERE status='published' AND id NOT LIKE 's1_%'`),
    env.DB.prepare(`UPDATE nne_quests SET status='archived', updated_at=datetime('now') WHERE status='published' AND id NOT LIKE 's1_%' AND id != 'quest_referral_artist'`),
    env.DB.prepare(`UPDATE nne_quests SET reward_credits=1, reward_xp=100, status='published', updated_at=datetime('now') WHERE id='quest_referral_artist'`)
  ];

  for (const [id,title,artist,url] of songs) {
    statements.push(env.DB.prepare(`INSERT INTO nne_songs (id,title,artist_name,listen_url,status,created_at,updated_at) VALUES (?,?,?,?, 'published',datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title,artist_name=excluded.artist_name,listen_url=excluded.listen_url,status='published',updated_at=datetime('now')`).bind(id,title,artist,url));
  }

  for (const [id,platform,title,body,url,credits,sort] of support) {
    statements.push(questUpsert(env,{id,platform,title,description:`${body}\n\nAbrir contenido: ${url}`,credits,sort}));
  }

  const listening = [
    ["s1_listen_punto_g","PUNTO G · Know the record","s1_song_punto_g",0.5,90],
    ["s1_listen_caption","CAPTION · Know the record","s1_song_caption",0.5,91],
    ["s1_listen_late_night","LATE NIGHT · Know the record","s1_song_late_night",0.5,92],
    ["s1_listen_sin_forzar","SIN FORZAR · Know the record","s1_song_sin_forzar",0.5,93],
    ["s1_listen_es_mala","ES MALA... · Know the record","s1_song_es_mala",0.5,94]
  ];
  for (const [id,title,songId,credits,sort] of listening) statements.push(questUpsert(env,{id,type:"listening-trivia",platform:"Spotify / Apple Music",title,description:"Abre la canción oficial, escucha y supera una trivia corta. La trivia premia conocer el universo, no repetir streams.",credits,sort,verification:"trivia",songId,listen:30,pass:67}));

  let sort = 120;
  for (const [slug,title,url] of creatorSongs) {
    for (let slot=1; slot<=10; slot+=1) {
      const credits = 1;
      statements.push(questUpsert(env,{
        id:`s1_create_${slug}_${slot}`,
        platform:"TikTok / Reels",
        title:`CREATE · ${title} · #${slot}/10`,
        description:`Crea un TikTok o Reel ORIGINAL usando ${title}. Base: ${credits} NNE Credit. Staff puede sumar hasta 1 NNE adicional por calidad e impacto, siempre dentro del máximo diario. Sube screenshot y agrega el link del video en la nota.\n\nReferencia: ${url}`,
        credits, sort: sort++
      }));
    }
  }

  for (const [id,name,description,icon,cost,inventory,order] of rewards) {
    statements.push(env.DB.prepare(`INSERT INTO nne_rewards (id,name,description,icon,cost_credits,minimum_level,inventory,status,fulfillment_notes,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,1,?,'published','Season 001 · staff fulfillment',?,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,icon=excluded.icon,cost_credits=excluded.cost_credits,minimum_level=1,inventory=excluded.inventory,status='published',fulfillment_notes=excluded.fulfillment_notes,sort_order=excluded.sort_order,updated_at=datetime('now')`).bind(id,name,description,icon,cost,inventory,order));
  }

  const trivia = [
    ["s1_pg_q1","s1_song_punto_g","s1_listen_punto_g","¿Quién produjo PUNTO G?",[["a","Janko Diorr"],["b","Gemese"],["c","Xiam"]],"a"],
    ["s1_pg_q2","s1_song_punto_g","s1_listen_punto_g","¿A qué universo pertenece PUNTO G?",[["a","WESTDETRO"],["b","NNE Classical"],["c","Acoustic Sessions"]],"a"],
    ["s1_cap_q1","s1_song_caption","s1_listen_caption","¿Quién aparece como featuring en CAPTION?",[["a","Gemese"],["b","82NGEL"],["c","Xiam"]],"a"],
    ["s1_cap_q2","s1_song_caption","s1_listen_caption","¿Quién produjo CAPTION?",[["a","Janko Diorr"],["b","Gemese"],["c","Prieto"]],"a"],
    ["s1_ln_q1","s1_song_late_night","s1_listen_late_night","¿Quién produjo LATE NIGHT?",[["a","Janko Diorr"],["b","Krixn"],["c","Xiam"]],"a"],
    ["s1_ln_q2","s1_song_late_night","s1_listen_late_night","¿Cuál es el título correcto?",[["a","LATE NIGHT"],["b","LATE DRIVE"],["c","AFTER HOURS"]],"a"],
    ["s1_sf_q1","s1_song_sin_forzar","s1_listen_sin_forzar","¿Quién produjo SIN FORZAR FREESTYLE?",[["a","Janko Diorr"],["b","Gemese"],["c","82NGEL"]],"a"],
    ["s1_sf_q2","s1_song_sin_forzar","s1_listen_sin_forzar","¿Cuál palabra forma parte del título?",[["a","Freestyle"],["b","Remix"],["c","Interlude"]],"a"],
    ["s1_em_q1","s1_song_es_mala","s1_listen_es_mala","¿Quién produjo ES MALA PERO ASÍ ME GUSTA?",[["a","Janko Diorr"],["b","Prieto"],["c","Gemese"]],"a"],
    ["s1_em_q2","s1_song_es_mala","s1_listen_es_mala","¿Cuál es el título correcto?",[["a","ES MALA PERO ASÍ ME GUSTA"],["b","MALA MÍA"],["c","ASÍ ME GUSTA REMIX"]],"a"]
  ];
  for (const [id,songId,questId,prompt,opts,correct] of trivia) statements.push(env.DB.prepare(`INSERT INTO nne_trivia_questions (id,song_id,quest_id,prompt,options_json,correct_option_id,status,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,'active',10,datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET song_id=excluded.song_id,quest_id=excluded.quest_id,prompt=excluded.prompt,options_json=excluded.options_json,correct_option_id=excluded.correct_option_id,status='active',updated_at=datetime('now')`).bind(id,songId,questId,prompt,JSON.stringify(opts.map(([oid,text])=>({id:oid,text}))),correct));

  statements.push(env.DB.prepare(`INSERT INTO nne_feed_events (id,user_id,event_type,message,visibility,source_type,source_id,created_at) VALUES ('s1_launch_feed',NULL,'season_launch','NNE SEASON 001 · ROAD TO WESTDETRO · 08.28.26 ya está activo.','public','season','001',datetime('now')) ON CONFLICT(id) DO NOTHING`));
  statements.push(env.DB.prepare(`INSERT INTO nne_runtime_flags (key,value,updated_at) VALUES ('season_001_economy_v3','ready',datetime('now')) ON CONFLICT(key) DO UPDATE SET value='ready',updated_at=datetime('now')`));
  await env.DB.batch(statements);
}
