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

function constantTimeEqual(a, b) {
  const left = encoder.encode(String(a || ""));
  const right = encoder.encode(String(b || ""));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function validState(state, secret) {
  const parts = String(state || "").split(".");
  if (parts.length !== 3 || !secret) return false;
  const [issuedAtRaw, nonce, suppliedSignature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || !nonce || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60 || now - issuedAt > 600) return false;
  const payload = `${issuedAtRaw}.${nonce}`;
  const expectedSignature = await hmacHex(secret, payload);
  return constantTimeEqual(suppliedSignature, expectedSignature);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = env.NNE_APP_ORIGIN || url.origin;
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";

  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
    return redirect(`${origin}/integrations/instagram?error=not_configured`);
  }

  if (!code || !(await validState(state, env.INSTAGRAM_APP_SECRET))) {
    return redirect(`${origin}/integrations/instagram?error=oauth_state`);
  }

  const redirectUri = `${origin}/api/nne/integrations/instagram/callback`;
  const form = new FormData();
  form.set("client_id", env.INSTAGRAM_APP_ID);
  form.set("client_secret", env.INSTAGRAM_APP_SECRET);
  form.set("grant_type", "authorization_code");
  form.set("redirect_uri", redirectUri);
  form.set("code", code.replace(/#_$/, ""));

  try {
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: form
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Instagram OAuth token exchange failed", tokenData?.error_message || tokenResponse.status);
      return redirect(`${origin}/integrations/instagram?error=token_exchange`);
    }

    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,username,account_type,profile_picture_url");
    profileUrl.searchParams.set("access_token", tokenData.access_token);
    const profileResponse = await fetch(profileUrl.toString());
    const profile = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok || !profile.id) {
      console.error("Instagram profile fetch failed", profile?.error?.message || profileResponse.status);
      return redirect(`${origin}/integrations/instagram?error=profile_fetch`);
    }

    const done = new URL(`${origin}/integrations/instagram`);
    done.searchParams.set("connected", "1");
    done.searchParams.set("username", String(profile.username || ""));
    done.searchParams.set("account_type", String(profile.account_type || "Professional"));
    if (profile.profile_picture_url) done.searchParams.set("profile_picture_url", String(profile.profile_picture_url));
    return redirect(done.toString());
  } catch (error) {
    console.error("Instagram OAuth callback failed", error instanceof Error ? error.message : String(error));
    return redirect(`${origin}/integrations/instagram?error=unexpected`);
  }
}
