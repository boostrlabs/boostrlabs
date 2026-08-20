PRAGMA foreign_keys = ON;

-- First 50 approved members arriving through the launch campaign receive 3 NNE.
-- Approval remains manual, so creating applications cannot farm the promotion.
UPDATE nne_promo_campaigns
SET name = 'Primeros 50 miembros aprobados · 3 NNE',
    reward_credits = 3,
    max_redemptions = 50,
    status = 'active',
    updated_at = datetime('now')
WHERE code = 'PRIMEROS50';

-- The member who invited an approved account receives 2 NNE. The credit still
-- passes through the global daily earning cap.
UPDATE nne_quests
SET title = 'Invita a alguien a la comunidad',
    description = 'Ganas 2 NNE cuando la persona entra con tu enlace y su solicitud es aprobada.',
    reward_credits = 2,
    reward_xp = 100,
    updated_at = datetime('now')
WHERE id = 'quest_referral_artist';

-- Keep internal IDs stable while moving all public-facing copy to NNE language.
UPDATE nne_quests
SET title = replace(title, 'Support ·', 'Dale apoyo ·'),
    updated_at = datetime('now')
WHERE id LIKE 's1_support_%';

UPDATE nne_quests
SET title = replace(title, 'Comment Run ·', 'Ronda de comentarios ·'),
    updated_at = datetime('now')
WHERE id LIKE 's1_comments_%' AND title LIKE 'Comment Run ·%';

UPDATE nne_quests
SET title = replace(title, ' · Know the record', ' · Conoce el tema'),
    updated_at = datetime('now')
WHERE id LIKE 's1_listen_%';

UPDATE nne_quests
SET title = replace(title, 'CREATE ·', 'Crea algo ·'),
    description = replace(description, 'Creator Quest', 'bloque creativo'),
    updated_at = datetime('now')
WHERE id LIKE 's1_create_%';

UPDATE nne_quests
SET title = replace(title, 'TikTok Push ·', 'Empuja el TikTok ·'),
    updated_at = datetime('now')
WHERE id LIKE 's1_tiktok_%';
