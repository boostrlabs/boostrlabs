const VERSION = "0.11.0";
const languageScript = `<script src="/assets/boostr-mother/language-engine.js?v=${VERSION}" defer></script>`;
const productionScript = `<script src="/assets/boostr-mother/production-shell.js?v=${VERSION}" defer></script>`;
const johankaCloudScript = `<script src="/assets/boostr-mother/johanka-cloud-link.js?v=${VERSION}" defer></script>`;
const johankaCloudRuntimeScript = `<script src="/assets/boostr-mother/johanka-cloud-hotfix.js?v=${VERSION}" defer></script>`;
const johankaCloudBinaryUploadScript = `<script src="/assets/boostr-mother/johanka-cloud-binary-upload.js?v=${VERSION}" defer></script>`;
const johankaCloudLiveScript = `<script src="/assets/boostr-mother/johanka-cloud-live.js?v=${VERSION}" defer></script>`;
const boostrCloudAccessScript = `<script src="/assets/boostr-mother/boostr-cloud-access.js?v=${VERSION}" defer></script>`;
const founderCleanupScript = `<script src="/assets/boostr-mother/founder-shell-cleanup.js?v=${VERSION}" defer></script>`;
const workspaceNavigationScript = `<script src="/assets/boostr-mother/workspace-navigation.js?v=${VERSION}" defer></script>`;
const jankoStripeSettingsScript = `<script src="/assets/boostr-mother/janko-stripe-settings.js?v=${VERSION}" defer></script>`;
const jankoThemeSettingsScript = `<script src="/assets/boostr-mother/janko-theme-settings.js?v=${VERSION}" defer></script>`;
const paymentLinksHotfixScript = `<script src="/assets/boostr-mother/payment-links-hotfix.js?v=${VERSION}" defer></script>`;
const themeStyle = `<link id="boostr-system-theme-style" rel="stylesheet" href="/assets/boostr-theme/app-ui.css?v=${VERSION}">`;
const sharedUiStyle = `<link id="boostr-shared-ui-v2-style" rel="stylesheet" href="/assets/boostr-theme/shared-ui-v2.css?v=${VERSION}">`;
const themeRuntimeScript = `<script src="/assets/boostr-theme/theme-runtime.js?v=${VERSION}" defer></script>`;
const sharedUiRuntimeScript = `<script src="/assets/boostr-theme/shared-ui-runtime.js?v=${VERSION}" defer></script>`;
const themeBootstrap = `<script id="boostr-theme-bootstrap">(function(){var d={theme_id:"night_blue",accent_id:"blue",revision:2};try{var c=JSON.parse(localStorage.getItem("boostr_system_theme_v2")||"{}");if(["night_blue","smart_light","mother_platinum"].includes(c.theme_id))d.theme_id=c.theme_id;if(["blue","violet","rose","emerald"].includes(c.accent_id))d.accent_id=c.accent_id}catch(e){}document.documentElement.dataset.boostrTheme=d.theme_id;document.documentElement.dataset.boostrAccent=d.accent_id})();</script>`;
const STRIPE_JS_DAHLIA = "https://js.stripe.com/dahlia/stripe.js";
const smartReceiptScript = `<script id="boostr-smart-receipt-link">(function(){var p=new URLSearchParams(location.search),s=p.get('session_id');if(!s)return;function add(url,number){if(!url||document.getElementById('boostr-receipt-button'))return;var host=document.getElementById('resultPanel')||document.querySelector('.success');if(!host)return;var a=document.createElement('a');a.id='boostr-receipt-button';a.href=url;a.textContent='Abrir comprobante interactivo'+(number?' · '+number:'');a.style.cssText='display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:16px;border-radius:999px;background:#feedb9;color:#050505;text-decoration:none;font-weight:950;padding:0 18px';host.appendChild(a)}fetch('/api/public/stripe/session?session_id='+encodeURIComponent(s),{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){if(d&&d.document)add(d.document.public_url,d.document.document_number)}).catch(function(){})})();</script>`;
const gateStyle = '<style id="boostr-gate-style">#boostr-loading-gate{position:fixed;inset:0;z-index:100020;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(61,124,255,.13),transparent 34%),#0c1118;color:#fff;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}</style>';
const gateMarkup = '<div id="boostr-loading-gate" data-no-i18n="true">Conectando tu OS...</div>';

function injectBeforeBody(html, script) {
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}

function injectBeforeHeadClose(html, markup) {
  return html.includes("</head>") ? html.replace("</head>", `${markup}</head>`) : `${markup}${html}`;
}

function wantsWorkspaceShell(html) {
  return /<meta\s+[^>]*name=["']boostr-shell["'][^>]*content=["']workspace["'][^>]*>/i.test(html)
    || /<meta\s+[^>]*content=["']workspace["'][^>]*name=["']boostr-shell["'][^>]*>/i.test(html);
}

function wantsCustomTheme(html) {
  return /<meta\s+[^>]*name=["']boostr-theme["'][^>]*content=["']custom["'][^>]*>/i.test(html)
    || /<meta\s+[^>]*content=["']custom["'][^>]*name=["']boostr-theme["'][^>]*>/i.test(html);
}

function matches(path, prefixes) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function surfaceName(path) {
  const entries = [
    ["/smart-payment-link", "smart-payment-link"],
    ["/partner-dashboard", "partner-dashboard"],
    ["/accept-invite", "accept-invite"],
    ["/password-reset", "password-reset"],
    ["/forgot-password", "forgot-password"],
    ["/verify-email", "verify-email"],
    ["/founder-access", "founder-access"],
    ["/manager", "manager"],
    ["/admin", "admin"],
    ["/modules", "modules"],
    ["/ecosystem", "ecosystem"],
    ["/audit", "audit"],
    ["/signup", "signup"],
    ["/login", "login"],
    ["/home", "home"],
    ["/app", "app"]
  ];
  return entries.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] || (path === "/" ? "root" : "shared");
}

function markSharedUi(html, path) {
  const surface = surfaceName(path);
  let next = html;
  if (!/data-boostr-surface=/i.test(next)) {
    next = next.replace(/<html([^>]*)>/i, `<html$1 data-boostr-surface="${surface}">`);
  }
  if (!/data-boostr-shared-ui=/i.test(next)) {
    next = next.replace(/<body([^>]*)>/i, `<body$1 data-boostr-shared-ui="true" data-boostr-surface="${surface}">`);
  }
  return next;
}

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const url = new URL(context.request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const isDemo = path.startsWith("/demo/");
  const isPublicAppGateway = path === "/app";
  const isNestedAppSurface = path.startsWith("/app/");
  const isPublicJohankarrd = path === "/johankarrd" || path.startsWith("/johankarrd/");
  const isPublicExperience = isPublicAppGateway || matches(path, [
    "/3d",
    "/jankodiorr",
    "/82ngel",
    "/pay",
    "/d",
    "/portfolio",
    "/partner",
    "/parking",
    "/omgbeauty"
  ]);
  const isPrivate = isNestedAppSurface || matches(path, ["/manager", "/admin", "/partner-dashboard"]);
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
  const isCloudSurface = ["/app/cloud", "/app/johanka/cloud"].includes(path);
  const isFounderSurface = ["/app/janko", "/app/johanka", "/app/cloud", "/app/johanka/cloud"].includes(path);

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

  const customDesignedRoute = isDemo || matches(path, [
    "/3d",
    "/jankodiorr",
    "/82ngel",
    "/pay",
    "/d",
    "/portfolio",
    "/partner",
    "/parking",
    "/omgbeauty",
    "/johankarrd",
    "/johankarrdbuildr",
    "/boostrcard",
    "/hummusfl",
    "/app/janko",
    "/app/johanka",
    "/app/82ngel",
    "/app/automotive",
    "/app/parking",
    "/app/cloud"
  ]);
  const coreThemeCandidate = path === "/"
    || isPublicAppGateway
    || isInternalSurface
    || isAuthSurface
    || path === "/audit"
    || path === "/signup"
    || path === "/founder-access";
  const shouldInjectTheme = coreThemeCandidate && !customDesignedRoute && !wantsCustomTheme(html);

  if (matches(path, ["/pay"])) {
    html = html.replace(/https:\/\/js\.stripe\.com\/(?:v3\/?|[a-z]+\/stripe\.js)/gi, STRIPE_JS_DAHLIA);
    if (!html.includes('id="boostr-smart-receipt-link"')) html = injectBeforeBody(html, smartReceiptScript);
    init.headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  if (matches(path, ["/d"])) {
    init.headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  if (isPublicAppGateway) {
    init.headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  if (path === "/app/johanka/cloud") {
    html = html.replace(
      "renderFilters();loadSession().then(loadAssets);",
      "renderFilters();window.__JOHANKA_CLOUD_BOOTSTRAP_DEFERRED__=true;"
    );
  }

  if (shouldInjectTheme) {
    html = markSharedUi(html, path);
    init.headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
    if (!html.includes('id="boostr-system-theme-style"')) {
      html = injectBeforeHeadClose(html, `${themeBootstrap}${themeStyle}${sharedUiStyle}`);
    } else if (!html.includes('id="boostr-shared-ui-v2-style"')) {
      html = injectBeforeHeadClose(html, sharedUiStyle);
    }
    if (!/boostr-theme\/theme-runtime\.js/.test(html)) html = injectBeforeBody(html, themeRuntimeScript);
    if (!/boostr-theme\/shared-ui-runtime\.js/.test(html)) html = injectBeforeBody(html, sharedUiRuntimeScript);
  }

  if (shouldInjectLanguage && !/boostr-mother\/language-engine\.js/.test(html)) html = injectBeforeBody(html, languageScript);
  if (shouldInjectRuntime && !/boostr-mother\/production-shell\.js/.test(html)) html = injectBeforeBody(html, productionScript);
  if (shouldInjectRuntime && !/boostr-mother\/workspace-navigation\.js/.test(html)) html = injectBeforeBody(html, workspaceNavigationScript);

  if (path === "/app/johanka" && !/boostr-mother\/johanka-cloud-link\.js/.test(html)) html = injectBeforeBody(html, johankaCloudScript);
  if (path === "/app/janko" && !/boostr-mother\/janko-stripe-settings\.js/.test(html)) html = injectBeforeBody(html, jankoStripeSettingsScript);
  if (path === "/app/janko" && !/boostr-mother\/janko-theme-settings\.js/.test(html)) html = injectBeforeBody(html, jankoThemeSettingsScript);
  if (path === "/manager/payment-links" && !/boostr-mother\/payment-links-hotfix\.js/.test(html)) html = injectBeforeBody(html, paymentLinksHotfixScript);
  if (isCloudSurface && !/boostr-mother\/johanka-cloud-hotfix\.js/.test(html)) html = injectBeforeBody(html, johankaCloudRuntimeScript);
  if (isCloudSurface && !/boostr-mother\/johanka-cloud-binary-upload\.js/.test(html)) html = injectBeforeBody(html, johankaCloudBinaryUploadScript);
  if (isCloudSurface && !/boostr-mother\/johanka-cloud-live\.js/.test(html)) html = injectBeforeBody(html, johankaCloudLiveScript);
  if (isCloudSurface && !/boostr-mother\/boostr-cloud-access\.js/.test(html)) html = injectBeforeBody(html, boostrCloudAccessScript);
  if (isFounderSurface && !/boostr-mother\/founder-shell-cleanup\.js/.test(html)) html = injectBeforeBody(html, founderCleanupScript);

  if (isPrivate && !isDemo && !html.includes('id="boostr-loading-gate"')) {
    html = html.includes("</head>") ? html.replace("</head>", `${gateStyle}</head>`) : `${gateStyle}${html}`;
    html = html.includes("<body")
      ? html.replace(/<body([^>]*)>/i, `<body$1>${gateMarkup}`)
      : `${gateMarkup}${html}`;
  }

  return new Response(html, init);
}
