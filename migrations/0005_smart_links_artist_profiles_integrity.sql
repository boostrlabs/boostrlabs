-- BOOSTR Labs smart_links / artist_profiles integrity constraints
--
-- workspace_modules.status controls whether a workspace can access this module feature AT ALL
-- (gates the API via canAccessModule).
--
-- smart_links.status / artist_profiles.status is a PER-RECORD state
-- (this specific link or profile, independent of module access).
--
-- A module can be active while a specific record is locked, and vice versa:
-- checking module access does not imply the record is active.
--
-- D1/SQLite cannot add a CHECK constraint to an existing column without rebuilding
-- the table. To avoid touching existing data, status integrity is enforced here
-- with BEFORE INSERT/UPDATE triggers that reject any state outside active/locked.

CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_links_workspace_slug_unique
  ON smart_links(workspace_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_profiles_workspace_unique
  ON artist_profiles(workspace_id);

CREATE TRIGGER IF NOT EXISTS trg_smart_links_status_insert
BEFORE INSERT ON smart_links
WHEN NEW.status NOT IN ('active', 'locked')
BEGIN
  SELECT RAISE(ABORT, 'smart_links.status must be active or locked');
END;

CREATE TRIGGER IF NOT EXISTS trg_smart_links_status_update
BEFORE UPDATE OF status ON smart_links
WHEN NEW.status NOT IN ('active', 'locked')
BEGIN
  SELECT RAISE(ABORT, 'smart_links.status must be active or locked');
END;

CREATE TRIGGER IF NOT EXISTS trg_artist_profiles_status_insert
BEFORE INSERT ON artist_profiles
WHEN NEW.status NOT IN ('active', 'locked')
BEGIN
  SELECT RAISE(ABORT, 'artist_profiles.status must be active or locked');
END;

CREATE TRIGGER IF NOT EXISTS trg_artist_profiles_status_update
BEFORE UPDATE OF status ON artist_profiles
WHEN NEW.status NOT IN ('active', 'locked')
BEGIN
  SELECT RAISE(ABORT, 'artist_profiles.status must be active or locked');
END;
