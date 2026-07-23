import { jsonOk, requireNneDb } from "../../_lib/nne-api.js";

export async function onRequestGet({ env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const row = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM nne_users) AS users,
       (SELECT COUNT(*) FROM nne_quests WHERE status = 'published') AS quests,
       (SELECT COUNT(*) FROM nne_rewards WHERE status = 'published') AS rewards`
  ).first();

  return jsonOk({
    service: "nne-community",
    database_namespace: "nne_*",
    storage_prefix: "nne/",
    counts: {
      users: Number(row?.users || 0),
      quests: Number(row?.quests || 0),
      rewards: Number(row?.rewards || 0)
    }
  });
}
