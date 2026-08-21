PRAGMA foreign_keys = ON;

UPDATE nne_channel_settings
SET join_url = 'https://chat.whatsapp.com/ETKL5f6KWKJHEdeOCWEgHd',
    status = 'active',
    updated_at = datetime('now')
WHERE channel = 'whatsapp';

UPDATE nne_channel_settings
SET join_url = 'https://t.me/NOSOTROSNOELLOS',
    status = 'active',
    updated_at = datetime('now')
WHERE channel = 'telegram';
