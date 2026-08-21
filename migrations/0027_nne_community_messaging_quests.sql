PRAGMA foreign_keys = ON;

INSERT INTO nne_quests (
  id, type, platform, title, description, icon, reward_credits, reward_xp,
  status, cadence, verification_method, minimum_listen_seconds,
  pass_percentage, minimum_level, starts_at, ends_at, sort_order, created_at, updated_at
)
VALUES
  (
    'nne_join_whatsapp', 'community', 'WhatsApp', 'Únete a la comunidad de WhatsApp',
    'Únete a la comunidad oficial de WhatsApp para recibir notificaciones, avisos rápidos, oportunidades y updates de NNE × WESTDETRO. Sube una captura donde se vea que ya entraste.\n\nAbrir comunidad: https://nne.westdetro.com/join/whatsapp',
    'WA', 0.50, 25, 'published', 'once', 'manual', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 7, datetime('now'), datetime('now')
  ),
  (
    'nne_join_telegram', 'community', 'Telegram', 'Únete a la comunidad de Telegram',
    'Únete al canal/comunidad oficial de Telegram para recibir notificaciones, briefs, archivos y anuncios de chambas. Sube una captura donde se vea que ya entraste.\n\nAbrir comunidad: https://nne.westdetro.com/join/telegram',
    'TG', 0.25, 20, 'published', 'once', 'manual', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 8, datetime('now'), datetime('now')
  ),
  (
    'nne_message_telegram_bot', 'community', 'Telegram', 'Escríbele al bot de NNE',
    'Verifica tu Telegram y envíale al menos un mensaje al bot oficial de NNE. Esta chamba se completa automáticamente cuando el bot recibe tu primer mensaje después de que tu cuenta ya está vinculada.\n\nVerificar Telegram: https://nne.westdetro.com/verify-telegram',
    'BOT', 0.25, 20, 'published', 'once', 'automatic', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 9, datetime('now'), datetime('now')
  )
ON CONFLICT(id) DO UPDATE SET
  platform = excluded.platform,
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  reward_credits = excluded.reward_credits,
  reward_xp = excluded.reward_xp,
  status = 'published',
  cadence = 'once',
  verification_method = excluded.verification_method,
  starts_at = excluded.starts_at,
  ends_at = NULL,
  sort_order = excluded.sort_order,
  updated_at = datetime('now');
