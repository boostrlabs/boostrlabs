import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";

const SOURCE = "boostr-event-os-orlando-jul-25";

const parseObject = (value) => {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
};

const publicName = (value) => {
  const parts = clean(value, 120).split(/\s+/).filter(Boolean);
  if (!parts.length) return "Participante confirmado";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts.at(-1).slice(0, 1).toUpperCase()}.`;
};

export async function onRequestGet({ env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  try {
    const result = await env.DB.prepare(
      `SELECT contact_name, message, updated_at
       FROM leads
       WHERE source = ? AND status = 'confirmed'
       ORDER BY updated_at DESC
       LIMIT 100`
    ).bind(SOURCE).all();

    const participants = (result.results || []).map((row) => {
      const metadata = parseObject(row.message);
      const eventData = parseObject(metadata.extra_message);
      return {
        name: publicName(row.contact_name),
        entries: Math.min(Math.max(Number(eventData.quantity || 1) || 1, 1), 8),
        confirmed_at: row.updated_at
      };
    });

    return json({
      ok: true,
      participants,
      confirmed_buyers: participants.length,
      raffle_entries: participants.reduce((total, item) => total + item.entries, 0)
    });
  } catch (error) {
    console.error(JSON.stringify({ message: "event_participants_failed", error: String(error) }));
    return jsonError("participants_unavailable", "Participants are temporarily unavailable.", 503);
  }
}
