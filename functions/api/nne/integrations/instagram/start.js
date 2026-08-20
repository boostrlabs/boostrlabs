const redirect = (location, status = 302) => new Response(null, {
  status,
  headers: {
    Location: location,
    "Cache-Control": "no-store"
  }
});

export async function onRequestGet({ request, env }) {
  if (!env.INSTAGRAM_APP_ID) {
    return new Response("Instagram integration is not configured.", { status: 503 });
  }

  const origin = env.NNE_APP_ORIGIN || new URL(request.url).origin;
  const redirectUri = `${origin}/api/nne/integrations/instagram/callback`;
  const state = crypto.randomUUID();

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

  const response = redirect(authorize.toString());
  response.headers.append(
    "Set-Cookie",
    `nne_ig_oauth_state=${encodeURIComponent(state)}; Path=/api/nne/integrations/instagram/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return response;
}
