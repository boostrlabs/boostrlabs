import { clean, json, jsonError } from "../../_lib/api.js";

const COMMAND_HASH = "2db9739451e0008455f395bd5f89055f825ad5d44e085915991e64a9b7eaf325";

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const messageFromUpdate = (update) => update?.message || update?.channel_post || null;

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError("invalid_json", "Invalid JSON body.", 400);
  }

  const command = clean(payload?.command, 100).toLowerCase();
  if (!command || await sha256(command) !== COMMAND_HASH) {
    return jsonError("not_found", "Discovery command not found.", 404);
  }

  const token = clean(env.TELEGRAM_BOT_TOKEN, 200);
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
    return jsonError("telegram_not_configured", "Telegram bot is not configured.", 503);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=${encodeURIComponent('["message","channel_post"]')}`,
      { headers: { Accept: "application/json" } }
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      throw new Error(`telegram_get_updates_failed:${clean(result.description || response.status, 200)}`);
    }

    const match = [...(result.result || [])].reverse().map(messageFromUpdate).find((message) => {
      const receivedCommand = clean(message?.text, 200).split(/\s+/)[0].split("@")[0].toLowerCase();
      return receivedCommand === command && ["group", "supergroup"].includes(message?.chat?.type);
    });

    if (!match) {
      return json({ ok: true, found: false });
    }

    let testSent = false;
    if (payload?.send_test === true) {
      const testResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: String(match.chat.id),
          text: "✅ BOOSTR Notifications conectado. Este grupo recibirá únicamente los leads del evento ROWMA Orlando."
        })
      });
      const testResult = await testResponse.json().catch(() => ({}));
      testSent = testResponse.ok && testResult.ok === true;
      if (!testSent) throw new Error(`telegram_test_failed:${clean(testResult.description || testResponse.status, 200)}`);
    }

    return json({
      ok: true,
      found: true,
      test_sent: testSent,
      group: {
        id: String(match.chat.id),
        title: clean(match.chat.title, 160),
        type: clean(match.chat.type, 30)
      }
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: "telegram_event_group_discovery_failed",
      error: error instanceof Error ? error.message : String(error)
    }));
    return jsonError("telegram_discovery_failed", "Could not inspect Telegram updates.", 502);
  }
}
