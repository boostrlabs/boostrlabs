-- Fresh September chamba drop. Keeps evergreen join/referral quests and archives the completed launch batch.
UPDATE nne_quests
SET status='archived', updated_at=datetime('now')
WHERE status='published'
  AND id NOT IN ('quest_referral_artist','nne_join_whatsapp','nne_join_telegram','nne_join_instagram_mob')
  AND id NOT LIKE 'd2_%';

INSERT INTO nne_songs (id,title,artist_name,listen_url,status,created_at,updated_at)
VALUES (
  'd2_song_sisisi','SISISI','Gemese, Janko Diorr & Sourius',
  'https://www.instagram.com/gemeseoficial/p/DchWMPQnI3M/',
  'published',datetime('now'),datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  title=excluded.title,
  artist_name=excluded.artist_name,
  listen_url=excluded.listen_url,
  status='published',
  updated_at=datetime('now');

INSERT INTO nne_quests (
  id,type,platform,title,description,icon,reward_credits,reward_xp,status,cadence,
  verification_method,song_id,minimum_listen_seconds,pass_percentage,minimum_level,
  starts_at,ends_at,sort_order,created_at,updated_at
) VALUES
  ('d2_support_sisisi_release','social-proof','Instagram','SISISI ya salió · Apoya el estreno','Dale like, deja un comentario real sobre la canción y comparte el post del estreno. No cuentan comentarios repetidos ni solo emojis. Sube una captura donde se vean las acciones.\n\nAbrir contenido: https://www.instagram.com/gemeseoficial/p/DchWMPQnI3M/','◆',0.5,25,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',1,datetime('now'),datetime('now')),
  ('d2_support_janko_mastering','social-proof','Instagram','Janko · Desde la casa creativa','Apoya la publicación nueva de Janko: like, un comentario con criterio sobre el proceso del álbum y compartir. Sube una captura donde se vean las acciones.\n\nAbrir contenido: https://www.instagram.com/jankodiorr/p/Dc4Rd6In7Em/','◆',0.25,15,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',2,datetime('now'),datetime('now')),
  ('d2_support_gemese_petroleras','social-proof','Instagram','Gemese · De Los Haticos','Apoya el Reel nuevo de Gemese: like, un comentario real relacionado con el video y compartir. Sube una captura donde se vean las acciones.\n\nAbrir contenido: https://www.instagram.com/gemeseoficial/reel/Dc2kJPCgGwG/','◆',0.25,15,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',3,datetime('now'),datetime('now')),
  ('d2_support_xiam_preview','social-proof','Instagram','Xiam · ¿Salimos con esta?','Mira el preview de Xiam, dale like, comenta honestamente qué te transmite y compártelo. Sube una captura donde se vean las acciones.\n\nAbrir contenido: https://www.instagram.com/xiamoficial/reel/DbjaB1WRHqQ/','◆',0.25,15,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',4,datetime('now'),datetime('now')),
  ('d2_listen_sisisi','listening-trivia','Instagram / Streaming','SISISI · Conoce el estreno','Abre el estreno oficial de SISISI, escucha la canción y supera una trivia corta sobre el release.\n\nAbrir contenido: https://www.instagram.com/gemeseoficial/p/DchWMPQnI3M/','◆',0.5,25,'published','once','trivia','d2_song_sisisi',30,67,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',20,datetime('now'),datetime('now')),
  ('d2_creator_sisisi','social-proof','TikTok / Reels','Crea algo duro con SISISI','Haz un video ORIGINAL usando SISISI: actuación, outfit, transición, baile, humor o una idea propia. Debe sentirse tuyo y mencionar SISISI o NNE. Sube captura y pega el link público en la nota. El staff puede sumar un plus por creatividad e impacto.\n\nAbrir contenido: https://www.instagram.com/gemeseoficial/p/DchWMPQnI3M/','◆',1.25,40,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',30,datetime('now'),datetime('now')),
  ('d2_creator_gemese_petroleras','social-proof','TikTok / Reels','Responde a Gemese · Petroleras','Crea una respuesta ORIGINAL al Reel de Gemese: tu versión maracucha, un outfit, una reacción o una barra inspirada en el concepto. Sube captura y pega el link público en la nota.\n\nAbrir contenido: https://www.instagram.com/gemeseoficial/reel/Dc2kJPCgGwG/','◆',1,30,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',31,datetime('now'),datetime('now')),
  ('d2_creator_xiam_preview','social-proof','TikTok / Reels','Reacciona al preview de Xiam','Crea un video ORIGINAL reaccionando al preview de Xiam o explicando por qué debería salir. No copies comentarios: queremos tu opinión y tu estilo. Sube captura y pega el link público en la nota.\n\nAbrir contenido: https://www.instagram.com/xiamoficial/reel/DbjaB1WRHqQ/','◆',1,30,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',32,datetime('now'),datetime('now')),
  ('d2_creator_janko_process','social-proof','TikTok / Reels','Muestra tu proceso · Road to WESTDETRO','Inspirado en el post nuevo de Janko, muestra 15 a 45 segundos de tu proceso real como artista: grabando, escribiendo, diseñando, editando o ensayando. Incluye NNE o WESTDETRO en el texto. Sube captura y pega el link público en la nota.\n\nAbrir contenido: https://www.instagram.com/jankodiorr/p/Dc4Rd6In7Em/','◆',1,30,'published','once','manual',NULL,0,75,1,'2026-09-05T00:00:00.000Z','2026-09-20T04:00:00.000Z',33,datetime('now'),datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  type=excluded.type, platform=excluded.platform, title=excluded.title,
  description=excluded.description, reward_credits=excluded.reward_credits,
  reward_xp=excluded.reward_xp, status='published', cadence=excluded.cadence,
  verification_method=excluded.verification_method, song_id=excluded.song_id,
  minimum_listen_seconds=excluded.minimum_listen_seconds,
  pass_percentage=excluded.pass_percentage, minimum_level=excluded.minimum_level,
  starts_at=excluded.starts_at, ends_at=excluded.ends_at,
  sort_order=excluded.sort_order, updated_at=datetime('now');

INSERT INTO nne_trivia_questions (
  id,song_id,quest_id,prompt,options_json,correct_option_id,status,sort_order,created_at,updated_at
) VALUES
  ('d2_sisisi_q1','d2_song_sisisi','d2_listen_sisisi','¿Quiénes aparecen como artistas de SISISI?','[{"id":"a","text":"Gemese, Janko Diorr y Sourius"},{"id":"b","text":"Xiam y Gemese"},{"id":"c","text":"Janko Diorr y 82NGEL"}]','a','active',10,datetime('now'),datetime('now')),
  ('d2_sisisi_q2','d2_song_sisisi','d2_listen_sisisi','¿SISISI ya está disponible?','[{"id":"a","text":"Sí, ya salió"},{"id":"b","text":"No, es solo un preview"},{"id":"c","text":"Sale con el álbum"}]','a','active',20,datetime('now'),datetime('now')),
  ('d2_sisisi_q3','d2_song_sisisi','d2_listen_sisisi','¿A qué movimiento pertenece este estreno?','[{"id":"a","text":"NNE × WESTDETRO"},{"id":"b","text":"NNE Classical"},{"id":"c","text":"Solo WESTDETRO MOB"}]','a','active',30,datetime('now'),datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  prompt=excluded.prompt, options_json=excluded.options_json,
  correct_option_id=excluded.correct_option_id, status='active',
  sort_order=excluded.sort_order, updated_at=datetime('now');

INSERT INTO nne_feed_events (id,user_id,event_type,message,visibility,source_type,source_id,created_at)
VALUES (
  'chamba_drop_002_feed',NULL,'chamba_drop',
  'Nueva tanda de Bloques de Chamba: SISISI ya salió y hay misiones nuevas de Janko, Gemese y Xiam.',
  'public','chamba_drop','002',datetime('now')
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO nne_runtime_flags (key,value,updated_at)
VALUES ('chamba_drop_002_v1','ready',datetime('now'))
ON CONFLICT(key) DO UPDATE SET value='ready',updated_at=datetime('now');
