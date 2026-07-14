const JANKO_URL = "https://boostrlabs.pages.dev/api/cloud?key=cloud%2Fws_janko_westdetro_artist%2F34e11c1d-5321-449d-95df-cabb56ad4b11%2F1783999187649-be9326b4-6c28-4784-b2b8-7a29ff8c7c9f-img_5787.png";
const GEMESE_URL = "https://boostrlabs.pages.dev/api/cloud?key=cloud%2Fws_janko_westdetro_artist%2F34e11c1d-5321-449d-95df-cabb56ad4b11%2F1783999185872-681314d0-ec04-427e-8605-a6bde9151244-04ef9c37-fea8-4cd8-9498-35216643a911.png";

const EXTRA_CSS = `
.brand{display:flex!important;align-items:center!important;gap:12px!important}
.brand .mark{display:none!important}
.brand-logo{width:142px;height:auto;display:block}
.brand-copy{display:flex;flex-direction:column;line-height:1}
.brand-name{font-size:.78rem;font-weight:900;letter-spacing:.18em;color:#fff}
.brand-sub{font-size:.68rem;font-weight:800;letter-spacing:.22em;color:var(--accent);margin-top:4px}
.artist strong{display:block!important;font-size:clamp(2rem,5vw,3.4rem)!important;margin:10px 0 0!important;line-height:.95!important;letter-spacing:-.04em!important}
.artist small{display:block!important;margin-top:8px!important;color:#b9b9b9!important;font-size:.95rem!important;line-height:1.35!important}
.footer-brand{display:flex;align-items:center;gap:12px}
.footer-logo{width:110px;height:auto;display:block}
@media(max-width:760px){.brand-logo{width:118px}.brand-copy{display:none}}
`;

function replaceFirst(source, search, replacement) {
  const index = source.indexOf(search);
  if (index < 0) return source;
  return source.slice(0, index) + replacement + source.slice(index + search.length);
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  let html = await response.text();

  html = html.replace(
    '<div class="brand"><span class="mark">B</span><span>BOOSTR EVENT OS</span></div>',
    '<div class="brand"><img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" class="brand-logo"><div class="brand-copy"><span class="brand-name">BOOSTR LABS</span><span class="brand-sub">EVENT OS</span></div></div>'
  );

  html = html.replace('</style>', `${EXTRA_CSS}</style>`);

  html = replaceFirst(html, `src="${JANKO_URL}" alt="Flyer oficial GEMESE"`, `src="${GEMESE_URL}" alt="Flyer oficial GEMESE"`);
  html = replaceFirst(html, `src="${GEMESE_URL}" alt="Flyer oficial Janko Diorr"`, `src="${JANKO_URL}" alt="Flyer oficial Janko Diorr"`);

  html = html.replace(
    `<div class="art-grid"><figure class="art"><img src="${JANKO_URL}" alt="Arte oficial del evento" loading="lazy"></figure><figure class="art"><img src="${GEMESE_URL}" alt="Arte oficial del evento" loading="lazy"></figure></div>`,
    `<div class="art-grid"><figure class="art"><img src="${GEMESE_URL}" alt="Arte oficial de GEMESE" loading="lazy"></figure><figure class="art"><img src="${JANKO_URL}" alt="Arte oficial de JANKO DIORR" loading="lazy"></figure></div>`
  );

  html = html.replace(
    '<footer><span><strong>BOOSTR EVENT OS</strong> · ROWMA Orlando</span><span>Powered by BOOSTR Labs</span></footer>',
    '<footer><div class="footer-brand"><img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" class="footer-logo"><div><strong>BOOSTR EVENT OS</strong><br><span>ROWMA · ORLANDO · JUL 25</span></div></div><span>Powered by BOOSTR Labs</span></footer>'
  );

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-cache, no-store, must-revalidate");
  return new Response(html, { status: response.status, headers });
}
