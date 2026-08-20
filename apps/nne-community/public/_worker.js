const text = (body, status = 200) => new Response(body, {
  status,
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
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
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function handleMetaWebhook(request, env) {
  if (request.method === "GET") {
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

  if (request.method === "POST") {
    const rawBody = await request.text();

    if (!env.META_APP_SECRET) {
      return json({ ok: false, error: "meta_app_secret_not_configured" }, 503);
    }

    const signatureHeader = request.headers.get("X-Hub-Signature-256") || "";
    const expected = `sha256=${await hmacSha256Hex(env.META_APP_SECRET, rawBody)}`;
    if (!constantTimeEqual(signatureHeader, expected)) {
      return json({ ok: false, error: "invalid_signature" }, 401);
    }

    return json({ ok: true }, 200);
  }

  return text("Method Not Allowed", 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/nne/integrations/meta/webhook") {
      return handleMetaWebhook(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
