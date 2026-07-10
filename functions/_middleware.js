const languageScript = '<script src="/assets/boostr-mother/language-engine.js" defer></script>';
const productionScript = '<script src="/assets/boostr-mother/production-shell.js?v=0.8.3" defer></script>';
const johankaCloudScript = '<script src="/assets/boostr-mother/johanka-cloud-link.js?v=0.8.3" defer></script>';
const founderCleanupScript = '<script src="/assets/boostr-mother/founder-shell-cleanup.js?v=0.8.3" defer></script>';
const managerLeadsScript = '<script src="/assets/boostr-mother/manager-leads-production.js?v=0.8.3" defer></script>';
const cloudHotfixScript = '<script src="/assets/boostr-mother/johanka-cloud-hotfix.js?v=0.8.3" defer></script>';
const workspaceNavigationScript = '<script src="/assets/boostr-mother/workspace-navigation.js?v=0.8.3" defer></script>';
const gateStyle = '<style id="boostr-gate-style">#boostr-loading-gate{position:fixed;inset:0;z-index:100020;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(125,255,158,.08),transparent 34%),#050708;color:#fff;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}</style>';
const gateMarkup = '<div id="boostr-loading-gate" data-no-i18n="true">Conectando tu OS...</div>';

function injectBeforeBody(html, script) {
  return html.includes('</body>') ? html.replace('</body>', `${script}</body>`) : `${html}${script}`;
}

function wantsWorkspaceShell(html) {
  return /<meta\s+[^>]*name=["']boostr-shell["'][^>]*content=["']workspace["'][^>]*>/i.test(html)
    || /<meta\s+[^>]*content=["']workspace["'][^>]*name=["']boostr-shell["'][^>]*>/i.test(html);
}

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('text/html')) return response;

  const url = new URL(context.request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const isDemo = path.startsWith('/demo/');
  const isPublicJohankarrd = path === '/johankarrd' || path.startsWith('/johankarrd/');
  const isFounderSurface = ['/app/janko', '/app/johanka', '/app/johanka/cloud'].includes(path);
  const isPrivate = ['/app', '/manager', '/admin', '/partner-dashboard'].some(
    (prefix) => path === prefix || path.startsWith(prefix + '/')
  );

  let html = await response.text();
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  };
  init.headers.delete('content-length');

  const shellRequestedByPage = isPublicJohankarrd && wantsWorkspaceShell(html);
  const shouldInjectEcosystem = !isPublicJohankarrd || shellRequestedByPage;

  if (shouldInjectEcosystem && !/boostr-mother\/language-engine\.js/.test(html)) {
    html = injectBeforeBody(html, languageScript);
  }

  if (shouldInjectEcosystem && !/boostr-mother\/production-shell\.js/.test(html)) {
    html = injectBeforeBody(html, productionScript);
  }

  if (shouldInjectEcosystem && !/boostr-mother\/workspace-navigation\.js/.test(html)) {
    html = injectBeforeBody(html, workspaceNavigationScript);
  }

  if (path === '/app/johanka' && !/boostr-mother\/johanka-cloud-link\.js/.test(html)) {
    html = injectBeforeBody(html, johankaCloudScript);
  }

  if (path === '/app/johanka/cloud' && !/boostr-mother\/johanka-cloud-hotfix\.js/.test(html)) {
    html = injectBeforeBody(html, cloudHotfixScript);
  }

  if (path === '/manager/leads' && !/boostr-mother\/manager-leads-production\.js/.test(html)) {
    html = injectBeforeBody(html, managerLeadsScript);
  }

  if (isFounderSurface && !/boostr-mother\/founder-shell-cleanup\.js/.test(html)) {
    html = injectBeforeBody(html, founderCleanupScript);
  }

  if (isPrivate && !isDemo && !html.includes('id="boostr-loading-gate"')) {
    html = html.includes('</head>') ? html.replace('</head>', `${gateStyle}</head>`) : `${gateStyle}${html}`;
    html = html.includes('<body')
      ? html.replace(/<body([^>]*)>/i, `<body$1>${gateMarkup}`)
      : `${gateMarkup}${html}`;
  }

  return new Response(html, init);
}
