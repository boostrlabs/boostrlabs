const languageScript = '<script src="/assets/boostr-mother/language-engine.js" defer></script>';
const productionScript = '<script src="/assets/boostr-mother/production-shell.js?v=0.8.1" defer></script>';
const gateStyle = '<style id="boostr-gate-style">#boostr-loading-gate{position:fixed;inset:0;z-index:100020;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(125,255,158,.08),transparent 34%),#050708;color:#fff;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}</style>';
const gateMarkup = '<div id="boostr-loading-gate" data-no-i18n="true">Conectando tu OS...</div>';

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const url = new URL(context.request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const isDemo = path.startsWith("/demo/");
  const isPrivate = ["/app", "/manager", "/admin", "/partner-dashboard"].some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  let html = await response.text();
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  };
  init.headers.delete("content-length");

  if (!/boostr-mother\/language-engine\.js/.test(html)) {
    html = html.includes("</body>") ? html.replace("</body>", `${languageScript}</body>`) : `${html}${languageScript}`;
  }

  if (!/boostr-mother\/production-shell\.js/.test(html)) {
    html = html.includes("</body>") ? html.replace("</body>", `${productionScript}</body>`) : `${html}${productionScript}`;
  }

  if (isPrivate && !isDemo && !html.includes('id="boostr-loading-gate"')) {
    html = html.includes("</head>") ? html.replace("</head>", `${gateStyle}</head>`) : `${gateStyle}${html}`;
    html = html.includes("<body")
      ? html.replace(/<body([^>]*)>/i, `<body$1>${gateMarkup}`)
      : `${gateMarkup}${html}`;
  }

  return new Response(html, init);
}
