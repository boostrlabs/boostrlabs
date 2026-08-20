const redirect = (location, status = 302) => new Response(null, {
  status,
  headers: {
    Location: location,
    "Cache-Control": "no-store"
  }
});

const encoder = new TextEncoder();

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
    return new Response("Instagram integration is not configured.", { status: 503 });
  }

  const origin = env.NNE_APP_ORIGIN || new URL(request.url).origin;
  const redirectUri = `${origin}/api/nne/integrations/instagram/callback`;
  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  const signature = await hmacHex(env.INSTAGRAM_APP_SECRET, payload);
  const state = `${payload}.${signature}`;

  const authorize = new URL("https://www.instagram.com/oauth/authorize");
  authorize.searchParams.set("enable_fb_login", "0");
  authorize.searchParams.set("force_authentication", "1");
  authorize.searchParams.set("client_id", env.INSTAGRAM_APP_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments"
  );
  authorize.searchParams.set("state", state);

  return redirect(authorize.toString());
}
