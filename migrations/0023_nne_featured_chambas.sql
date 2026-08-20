PRAGMA foreign_keys = ON;

INSERT INTO nne_quests (
  id,type,platform,title,description,icon,reward_credits,reward_xp,status,cadence,
  verification_method,song_id,minimum_listen_seconds,pass_percentage,minimum_level,
  starts_at,ends_at,sort_order,created_at,updated_at
) VALUES
  ('nne_sisisi_announcement','social-proof','Instagram / TikTok','SISISI · 26 AGO','Sube una story o video corto anunciando SISISI para el 26 de agosto. Debe mencionar SISISI, NNE × WESTDETRO y la fecha. Sube captura y pega el link si es público.\n\nAbrir contenido: https://www.youtube.com/@nosotrosnoellos','◆',0.5,20,'published','once','manual',NULL,0,75,1,'2026-08-20T00:00:00.000Z','2026-08-27T04:00:00.000Z',1,datetime('now'),datetime('now')),
  ('nne_sisisi_original','social-proof','TikTok / Reels','Haz algo original con SISISI','Crea una pieza original alrededor de SISISI: expectativa, concepto, outfit, reacción o una idea propia. No copies otro video. Base: 1 NNE; una ejecución especialmente dura puede recibir un plus del staff.\n\nAbrir contenido: https://www.youtube.com/@nosotrosnoellos','◆',1,30,'published','once','manual',NULL,0,75,1,'2026-08-20T00:00:00.000Z','2026-08-27T04:00:00.000Z',2,datetime('now'),datetime('now')),
  ('gemese_channel_discovery','social-proof','YouTube','Conoce el canal de Gemese','Entra al canal oficial de Gemese, mira uno de sus videos y deja un comentario real sobre lo que viste. Sube evidencia verificable.\n\nAbrir contenido: https://www.youtube.com/@gemeseoficial','◆',0.25,10,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',3,datetime('now'),datetime('now')),
  ('xiam_channel_discovery','social-proof','YouTube','Conoce el canal de Xiam','Entra al canal oficial de Xiam, mira uno de sus videos y deja un comentario real sobre lo que viste. Sube evidencia verificable.\n\nAbrir contenido: https://www.youtube.com/@xiamoficial','◆',0.25,10,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',4,datetime('now'),datetime('now')),
  ('s1_janko_channel_discovery','social-proof','YouTube','Conoce el canal de Janko','Entra al canal oficial de Janko Diorr, mira uno de sus videos y deja un comentario real sobre lo que viste. Sube evidencia verificable.\n\nAbrir contenido: https://www.youtube.com/@jankodiorr','◆',0.25,10,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',5,datetime('now'),datetime('now')),
  ('nne_channel_discovery','social-proof','YouTube','Conoce NOSOTROSNOELLOS','Entra al canal oficial de NOSOTROSNOELLOS, mira uno de los videos y deja un comentario real. Sube evidencia verificable.\n\nAbrir contenido: https://www.youtube.com/@nosotrosnoellos','◆',0.25,10,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',6,datetime('now'),datetime('now')),
  ('gemese_creator_spotlight','social-proof','TikTok / Reels','Recomienda una canción de Gemese','Crea un video corto recomendando una canción de Gemese y explica con tus palabras por qué alguien debería escucharla. Sube captura y link del video.\n\nAbrir contenido: https://www.youtube.com/@gemeseoficial','◆',1,25,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',7,datetime('now'),datetime('now')),
  ('xiam_creator_spotlight','social-proof','TikTok / Reels','Recomienda una canción de Xiam','Crea un video corto recomendando una canción de Xiam y explica con tus palabras por qué alguien debería escucharla. Sube captura y link del video.\n\nAbrir contenido: https://www.youtube.com/@xiamoficial','◆',1,25,'published','once','manual',NULL,0,75,1,'2026-08-16T00:00:00.000Z','2026-08-29T04:00:00.000Z',8,datetime('now'),datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  platform=excluded.platform,title=excluded.title,description=excluded.description,
  reward_credits=excluded.reward_credits,reward_xp=excluded.reward_xp,status='published',
  starts_at=excluded.starts_at,ends_at=excluded.ends_at,sort_order=excluded.sort_order,
  updated_at=datetime('now');

UPDATE nne_quests
SET title='Dale apoyo · Tracklist WESTDETRO',
    description='Like + comentario + repost/share del tracklist oficial. Las tres acciones juntas completan la chamba.\n\nAbrir contenido: https://www.instagram.com/p/DcET7ppDg_B/',
    sort_order=40,
    updated_at=datetime('now')
WHERE id='s1_support_tracklist';

UPDATE nne_quests
SET title='Ronda de comentarios · Tracklist WESTDETRO',
    description='Deja 10 comentarios reales en el post oficial y sube evidencia verificable.\n\nAbrir contenido: https://www.instagram.com/p/DcET7ppDg_B/',
    sort_order=41,
    updated_at=datetime('now')
WHERE id='s1_comments_tracklist';

INSERT INTO nne_runtime_flags (key,value,updated_at)
VALUES ('season_001_economy_v4','ready',datetime('now'))
ON CONFLICT(key) DO UPDATE SET value='ready',updated_at=datetime('now');
