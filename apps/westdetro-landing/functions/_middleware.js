const redirects = new Map([
  ["community", "/"],
  ["rewards", "/rewards"],
  ["quests", "/quests"],
  ["join", "/signup"],
  ["app", "/"]
]);

const pathRedirects = new Map([
  ["/nne", "/"],
  ["/community", "/"],
  ["/app", "/"],
  ["/rewards", "/rewards"],
  ["/quests", "/quests"],
  ["/join", "/signup"],
  ["/signup", "/signup"],
  ["/login", "/login"],
  ["/profile", "/profile"]
]);

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const subdomain = host.endsWith(".westdetro.com") ? host.slice(0, -".westdetro.com".length) : "";
  const subdomainPath = redirects.get(subdomain);
  if (subdomainPath) return Response.redirect(`https://nne.westdetro.com${subdomainPath}${url.search}`, 302);

  const destination = pathRedirects.get(url.pathname.replace(/\/$/, "") || "/");
  if (destination) return Response.redirect(`https://nne.westdetro.com${destination}${url.search}`, 302);
  return next();
}
