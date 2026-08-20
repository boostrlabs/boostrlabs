// NNE × WESTDETRO Meta webhook: verification handshake + signed event intake.
const text = (body, status = 200) => new Response(body, {
  status,
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" }
});

function constantTimeEqual(a, b) {
  const left = new TextEncoder().encode(String(a || ""));
  const right = new TextEncoder().encode(String(b || ""));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function hmacSha256Hex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!env.META_WEBHOOK_VERIFY_TOKEN) {
    return text("META_WEBHOOK_VERIFY_TOKEN is not configured", 503);
  }

  if (
    mode === "subscribe" &&
    challenge &&
    constantTimeEqual(verifyToken, env.META_WEBHOOK_VERIFY_TOKEN)
  ) {
    return text(challenge, 200);
  }

  return text("Forbidden", 403);
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();

  if (!env.META_APP_SECRET) {
    return json({ ok: false, error: "meta_app_secret_not_configured" }, 503);
  }

  const signatureHeader = request.headers.get("X-Hub-Signature-256") || "";
  const expected = `sha256=${await hmacSha256Hex(env.META_APP_SECRET, rawBody)}`;

  if (!constantTimeEqual(signatureHeader, expected)) {
    return json({ ok: false, error: "invalid_signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Acknowledge immediately. Event processing/autoreplies are wired in a later block.
  // Meta retries webhook deliveries when a 2xx response is not returned quickly.
  if (env.DB) {
    try {
      const objectType = String(payload?.object || "meta");
      const entries = Array.isArray(payload?.entry) ? payload.entry : [];
      for (const entry of entries) {
        const eventId = String(entry?.id || crypto.randomUUID());
        await env.DB.prepare(
          `INSERT OR IGNORE INTO nne_messaging_events (
             id, platform, external_event_id, event_type, external_user_id,
             received_at, status
           ) VALUES (?, ?, ?, ?, ?, ?, 'received')`
        ).bind(
          crypto.randomUUID(),
          objectType === "instagram" ? "instagram" : "whatsapp",
          eventId,
          objectType,
          null,
          new Date().toISOString()
        ).run();
      }
    } catch (error) {
      console.error("NNE Meta webhook logging failed", error?.message || error);
    }
  }

  return json({ ok: true }, 200);
}
