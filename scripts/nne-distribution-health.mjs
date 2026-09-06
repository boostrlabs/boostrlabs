import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { releaseReadiness } from "../functions/_lib/nne-distribution.js";

const root = new URL("..", import.meta.url);
const migration = await readFile(new URL("migrations/0028_nne_distribution_os.sql", root), "utf8");
const requiredTables = [
  "nne_distribution_artists",
  "nne_distribution_access",
  "nne_distribution_releases",
  "nne_distribution_tracks",
  "nne_distribution_contributors",
  "nne_distribution_splits",
  "nne_distribution_agreements",
  "nne_distribution_delivery_jobs",
  "nne_distribution_events",
  "nne_distribution_invites",
  "nne_distribution_providers",
  "nne_distribution_statements",
  "nne_distribution_royalty_lines",
  "nne_distribution_payouts"
];
for (const table of requiredTables) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
assert.match(migration, /nne_dist_release_westdetro/);
assert.equal(
  (migration.match(/^\s*\('nne_dist_westdetro_\d{2}','nne_dist_release_westdetro'/gm) || []).length,
  16,
  "WESTDETRO must seed 16 tracks"
);

const baseRelease = {
  release_date: "2026-12-04",
  primary_genre: "Latin Urban",
  language_code: "es",
  c_line: "© 2026 NNE",
  p_line: "℗ 2026 NNE",
  artwork_object_key: "artwork.jpg",
  rights_confirmed: true,
  agreement_accepted: true
};
const tracks = [{ id: "track-1", master_object_key: "master.wav" }];
const contributors = [{ track_id: "track-1", name: "Artist", role: "primary_artist" }];
const splits = [{ track_id: "track-1", participant_name: "Artist", percentage_bps: 10000 }];
assert.equal(releaseReadiness(baseRelease, tracks, contributors, splits).ready, true);
assert.equal(releaseReadiness({ ...baseRelease, artwork_object_key: null }, tracks, contributors, splits).ready, false);
assert.equal(releaseReadiness(baseRelease, tracks, contributors, [{ ...splits[0], percentage_bps: 9000 }]).ready, false);

const packageScript = await readFile(new URL("scripts/prepare-nne-deploy.mjs", root), "utf8");
assert.match(packageScript, /functions\/api\/nne/);
console.log("NNE Distribution OS health: OK");
