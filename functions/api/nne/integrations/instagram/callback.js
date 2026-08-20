function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

const redirect = (location, status = 302) => new Response(null, {
  status,
  headers: {
    Location: location,
    "Cache-Control": "no-store",
    "Set-Cookie": "nne_ig_oauth_state=; Path=/api/nne/integrations/instagram/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  }
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = env.NNE_APP_ORIGIN || url.origin;
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const expectedState = getCookie(request, "nne_ig_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect(`${origin}/integrations/instagram?error=oauth_state`);
  }

  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
    return redirect(`${origin}/integrations/instagram?error=not_configured`);
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
