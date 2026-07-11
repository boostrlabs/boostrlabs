const VERSION = "0.9.0";
const languageScript = `<script src="/assets/boostr-mother/language-engine.js?v=${VERSION}" defer></script>`;
const productionScript = `<script src="/assets/boostr-mother/production-shell.js?v=${VERSION}" defer></script>`;
const johankaCloudScript = `<script src="/assets/boostr-mother/johanka-cloud-link.js?v=${VERSION}" defer></script>`;
const founderCleanupScript = `<script src="/assets/boostr-mother/founder-shell-cleanup.js?v=${VERSION}" defer></script>`;
const workspaceNavigationScript = `<script src="/assets/boostr-mother/workspace-navigation.js?v=${VERSION}" defer></script>`;
const gateStyle = '<style id="boostr-gate-style">#boostr-loading-gate{position:fixed;inset:0;z-index:100020;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(125,255,158,.08),transparent 34%),#050708;color:#fff;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}</style>';
const gateMarkup = '<div id="boostr-loading-gate" data-no-i18n="true">Conectando tu OS...</div>';

function injectBeforeBody(html, script) {
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}

function wantsWorkspaceShell(html) {
  return /<meta\s+[^>]*name=["']boostr-shell["'][^>]*content=["']workspace["'][^>]*>/i.test(html)
    || /<meta\s+[^>]*content=["']workspace["'][^>]*name=["']boostr-shell["'][^>]*>/i.test(html);
}

function matches(path, prefixes) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const url = new URL(context.request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const isDemo = path.startsWith("/demo/");
  const isPublicJohankarrd = path === "/johankarrd" || path.startsWith("/johankarrd/");
  const isPublicExperience = matches(path, [
    "/3d",
    "/jankodiorr",
    "/82ngel",
    "/pay",
    "/portfolio",
    "/partner",
    "/omgbeauty"
  ]);
  const isPrivate = matches(path, ["/app", "/manager", "/admin", "/partner-dashboard"]);
  const isInternalSurface = isPrivate || matches(path, [
    "/home",
    "/modules",
    "/ecosystem",
    "/hummusfl",
    "/smart-payment-link"
  ]);
  const isAuthSurface = matches(path, [
    "/login",
    "/accept-invite",
    "/password-reset",
    "/forgot-password",
    "/verify-email"
  ]);
  const isFounderSurface = ["/app/janko", "/app/johanka", "/app/johanka/cloud"].includes(path);

  let html = await response.text();
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  };
  init.headers.delete("content-length");

  const shellRequestedByPage = isPublicJohankarrd && wantsWorkspaceShell(html);
  const shouldInjectRuntime = !isDemo && !isPublicExperience && (isInternalSurface || shellRequestedByPage);
  const shouldInjectLanguage = !isDemo && !isPublicExperience && (isInternalSurface || isAuthSurface || path === "/audit" || shellRequestedByPage);

  if (shouldInjectLanguage && !/boostr-mother\/language-engine\.js/.test(html)) {
    html = injectBeforeBody(html, languageScript);
  }

  if (shouldInjectRuntime && !/boostr-mother\/production-shell\.js/.test(html)) {
    html = injectBeforeBody(html, productionScript);
  }

  if (shouldInjectRuntime && !/boostr-mother\/workspace-navigation\.js/.test(html)) {
    html = injectBeforeBody(html, workspaceNavigationScript);
  }

  if (path === "/app/johanka" && !/boostr-mother\/johanka-cloud-link\.js/.test(html)) {
    html = injectBeforeBody(html, johankaCloudScript);
  }

  if (isFounderSurface && !/boostr-mother\/founder-shell-cleanup\.js/.test(html)) {
    html = injectBeforeBody(html, founderCleanupScript);
  }

  if (isPrivate && !isDemo && !html.includes('id="boostr-loading-gate"')) {
    html = html.includes("</head>") ? html.replace("</head>", `${gateStyle}</head>`) : `${gateStyle}${html}`;
    html = html.includes("<body")
      ? html.replace(/<body([^>]*)>/i, `<body$1>${gateMarkup}`)
      : `${gateMarkup}${html}`;
  }

  return new Response(html, init);
}
