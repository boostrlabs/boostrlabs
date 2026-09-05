const DROP_START = "2026-09-05T00:00:00.000Z";
const DROP_END = "2026-09-20T04:00:00.000Z";

const content = {
  jankoMastering: "https://www.instagram.com/jankodiorr/p/Dc4Rd6In7Em/",
  gemesePetroleras: "https://www.instagram.com/gemeseoficial/reel/Dc2kJPCgGwG/",
  xiamPreview: "https://www.instagram.com/xiamoficial/reel/DbjaB1WRHqQ/",
  sisisi: "https://www.instagram.com/gemeseoficial/p/DchWMPQnI3M/"
};

const quests = [
  {
    id: "d2_support_sisisi_release",
    platform: "Instagram",
    title: "SISISI ya salió · Apoya el estreno",
    description: "Dale like, deja un comentario real sobre la canción y comparte el post del estreno. No cuentan comentarios repetidos ni solo emojis. Sube una captura donde se vean las acciones.",
    url: content.sisisi,
    credits: 0.5,
    xp: 25,
    sort: 1
  },
  {
    id: "d2_support_janko_mastering",
    platform: "Instagram",
    title: "Janko · Desde la casa creativa",
    description: "Apoya la publicación nueva de Janko: like, un comentario con criterio sobre el proceso del álbum y compartir. Sube una captura donde se vean las acciones.",
    url: content.jankoMastering,
    credits: 0.25,
    xp: 15,
    sort: 2
  },
  {
    id: "d2_support_gemese_petroleras",
    platform: "Instagram",
    title: "Gemese · De Los Haticos",
    description: "Apoya el Reel nuevo de Gemese: like, un comentario real relacionado con el video y compartir. Sube una captura donde se vean las acciones.",
    url: content.gemesePetroleras,
    credits: 0.25,
    xp: 15,
    sort: 3
  },
  {
    id: "d2_support_xiam_preview",
    platform: "Instagram",
    title: "Xiam · ¿Salimos con esta?",
    description: "Mira el preview de Xiam, dale like, comenta honestamente qué te transmite y compártelo. Sube una captura donde se vean las acciones.",
    url: content.xiamPreview,
    credits: 0.25,
    xp: 15,
    sort: 4
  },
  {
    id: "d2_listen_sisisi",
    type: "listening-trivia",
    platform: "Instagram / Streaming",
    title: "SISISI · Conoce el estreno",
    description: "Abre el estreno oficial de SISISI, escucha la canción y supera una trivia corta sobre el release.",
    url: content.sisisi,
    credits: 0.5,
    xp: 25,
    verification: "trivia",
    songId: "d2_song_sisisi",
    listen: 30,
    pass: 67,
    sort: 20
  },
  {
    id: "d2_creator_sisisi",
    platform: "TikTok / Reels",
    title: "Crea algo duro con SISISI",
    description: "Haz un video ORIGINAL usando SISISI: actuación, outfit, transición, baile, humor o una idea propia. Debe sentirse tuyo y mencionar SISISI o NNE. Sube captura y pega el link público en la nota. El staff puede sumar un plus por creatividad e impacto.",
    url: content.sisisi,
    credits: 1.25,
    xp: 40,
    sort: 30
  },
  {
    id: "d2_creator_gemese_petroleras",
    platform: "TikTok / Reels",
    title: "Responde a Gemese · Petroleras",
    description: "Crea una respuesta ORIGINAL al Reel de Gemese: tu versión maracucha, un outfit, una reacción o una barra inspirada en el concepto. Sube captura y pega el link público en la nota.",
    url: content.gemesePetroleras,
    credits: 1,
    xp: 30,
    sort: 31
  },
  {
    id: "d2_creator_xiam_preview",
    platform: "TikTok / Reels",
    title: "Reacciona al preview de Xiam",
    description: "Crea un video ORIGINAL reaccionando al preview de Xiam o explicando por qué debería salir. No copies comentarios: queremos tu opinión y tu estilo. Sube captura y pega el link público en la nota.",
    url: content.xiamPreview,
    credits: 1,
    xp: 30,
    sort: 32
  },
  {
    id: "d2_creator_janko_process",
    platform: "TikTok / Reels",
    title: "Muestra tu proceso · Road to WESTDETRO",
    description: "Inspirado en el post nuevo de Janko, muestra 15 a 45 segundos de tu proceso real como artista: grabando, escribiendo, diseñando, editando o ensayando. Incluye NNE o WESTDETRO en el texto. Sube captura y pega el link público en la nota.",
    url: content.jankoMastering,
    credits: 1,
    xp: 30,
    sort: 33
  }
];

function questUpsert(env, quest) {
  return env.DB.prepare(`INSERT INTO nne_quests (
      id,type,platform,title,description,icon,reward_credits,reward_xp,status,cadence,
      verification_method,song_id,minimum_listen_seconds,pass_percentage,minimum_level,
      starts_at,ends_at,sort_order,created_at,updated_at
    ) VALUES (?,?,?,?,?,'◆',?,?,'published','once',?,?,?,?,1,?,?,?,datetime('now'),datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,platform=excluded.platform,title=excluded.title,
      description=excluded.description,reward_credits=excluded.reward_credits,
      reward_xp=excluded.reward_xp,status='published',cadence=excluded.cadence,
      verification_method=excluded.verification_method,song_id=excluded.song_id,
      minimum_listen_seconds=excluded.minimum_listen_seconds,
      pass_percentage=excluded.pass_percentage,minimum_level=excluded.minimum_level,
      starts_at=excluded.starts_at,ends_at=excluded.ends_at,
      sort_order=excluded.sort_order,updated_at=datetime('now')`)
    .bind(
      quest.id,
      quest.type || "social-proof",
      quest.platform,
      quest.title,
      `${quest.description}\n\nAbrir contenido: ${quest.url}`,
      quest.credits,
      quest.xp,
      quest.verification || "manual",
      quest.songId || null,
      quest.listen || 0,
      quest.pass || 75,
      DROP_START,
      DROP_END,
      quest.sort
    );
}

export async function ensureNneChambaDrop002(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_runtime_flags (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  const ready = await env.DB.prepare(`SELECT value FROM nne_runtime_flags WHERE key='chamba_drop_002_v1' LIMIT 1`).first();
  if (ready?.value === "ready") return;

  const statements = [
    env.DB.prepare(`UPDATE nne_quests
      SET status='archived', updated_at=datetime('now')
      WHERE status='published'
        AND id NOT IN ('quest_referral_artist','nne_join_whatsapp','nne_join_telegram','nne_join_instagram_mob')
        AND id NOT LIKE 'd2_%'`),
    env.DB.prepare(`INSERT INTO nne_songs (id,title,artist_name,listen_url,status,created_at,updated_at)
      VALUES ('d2_song_sisisi','SISISI','Gemese, Janko Diorr & Sourius',?,'published',datetime('now'),datetime('now'))
      ON CONFLICT(id) DO UPDATE SET title=excluded.title,artist_name=excluded.artist_name,
        listen_url=excluded.listen_url,status='published',updated_at=datetime('now')`).bind(content.sisisi)
  ];

  for (const quest of quests) statements.push(questUpsert(env, quest));

  const trivia = [
    ["d2_sisisi_q1", "¿Quiénes aparecen como artistas de SISISI?", [["a","Gemese, Janko Diorr y Sourius"],["b","Xiam y Gemese"],["c","Janko Diorr y 82NGEL"]], "a"],
    ["d2_sisisi_q2", "¿SISISI ya está disponible?", [["a","Sí, ya salió"],["b","No, es solo un preview"],["c","Sale con el álbum"]], "a"],
    ["d2_sisisi_q3", "¿A qué movimiento pertenece este estreno?", [["a","NNE × WESTDETRO"],["b","NNE Classical"],["c","Solo WESTDETRO MOB"]], "a"]
  ];
  for (const [id,prompt,options,correct] of trivia) {
    statements.push(env.DB.prepare(`INSERT INTO nne_trivia_questions (
        id,song_id,quest_id,prompt,options_json,correct_option_id,status,sort_order,created_at,updated_at
      ) VALUES (?,'d2_song_sisisi','d2_listen_sisisi',?,?,?,'active',10,datetime('now'),datetime('now'))
      ON CONFLICT(id) DO UPDATE SET prompt=excluded.prompt,options_json=excluded.options_json,
        correct_option_id=excluded.correct_option_id,status='active',updated_at=datetime('now')`)
      .bind(id,prompt,JSON.stringify(options.map(([optionId,text]) => ({ id: optionId, text }))),correct));
  }

  statements.push(env.DB.prepare(`INSERT INTO nne_feed_events (
      id,user_id,event_type,message,visibility,source_type,source_id,created_at
    ) VALUES ('chamba_drop_002_feed',NULL,'chamba_drop',
      'Nueva tanda de Bloques de Chamba: SISISI ya salió y hay misiones nuevas de Janko, Gemese y Xiam.',
      'public','chamba_drop','002',datetime('now')) ON CONFLICT(id) DO NOTHING`));
  statements.push(env.DB.prepare(`INSERT INTO nne_runtime_flags (key,value,updated_at)
    VALUES ('chamba_drop_002_v1','ready',datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value='ready',updated_at=datetime('now')`));

  await env.DB.batch(statements);
}
