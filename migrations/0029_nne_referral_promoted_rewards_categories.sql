PRAGMA foreign_keys = ON;

-- Referral economics: inviter earns 3 NNE; approved invitee receives 2 NNE through PRIMEROS50.
UPDATE nne_promo_campaigns
SET name = 'Primeros 50 miembros aprobados · 2 NNE',
    reward_credits = 2,
    max_redemptions = 50,
    status = 'active',
    updated_at = datetime('now')
WHERE code = 'PRIMEROS50';

UPDATE nne_quests
SET title = 'Refiere a un amigo NNE y ganen los dos',
    description = 'Comparte tu enlace personal. Cuando la persona se registra con tu enlace y su cuenta es aprobada, tú ganas 3 NNE y esa persona recibe 2 NNE si todavía quedan cupos de PRIMEROS50.',
    reward_credits = 3,
    reward_xp = 100,
    cadence = 'once',
    verification_method = 'referral',
    status = 'published',
    sort_order = 0,
    updated_at = datetime('now')
WHERE id = 'quest_referral_artist';

-- Existing reward catalogue classification.
UPDATE nne_rewards SET reward_type='digital', updated_at=datetime('now')
WHERE id = 's1_reward_early';

UPDATE nne_rewards SET reward_type='service', updated_at=datetime('now')
WHERE id IN ('s1_reward_creator_review','s1_reward_westdetro_beat','s1_reward_production');

UPDATE nne_rewards SET reward_type='physical', updated_at=datetime('now')
WHERE id IN (
  's1_reward_shirt','s1_reward_af1_white','s1_reward_af1_black','s1_reward_nike_tech',
  's1_reward_focusrite_solo_3rd','s1_reward_at2020','s1_reward_xlr_cable'
);
