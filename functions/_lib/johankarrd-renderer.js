const FALLBACK_SITE = {
  name: 'Johankarrd',
  slug: 'johankarrd',
  bg: '#000',
  accent: '#fff',
  card: '#08080b',
  fontFamily: 'system',
  shellMode: 'clean',
  sections: [{ id: 'home', label: 'Inicio', items: [{ type: 'title', text: 'Johankarrd' }] }]
};

const FONT_STACKS = {
  system: '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',
  inter: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  arial: 'Arial,Helvetica,sans-serif',
  trebuchet: '"Trebuchet MS",Arial,sans-serif',
  verdana: 'Verdana,Geneva,sans-serif',
  georgia: 'Georgia,"Times New Roman",serif',
  times: '"Times New Roman",Times,serif',
  courier: '"Courier New",Courier,monospace',
  impact: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif',
  'cormorant-sc': '"Cormorant SC",Georgia,serif',
  'playfair-display': '"Playfair Display",Georgia,serif',
  cinzel: 'Cinzel,Georgia,serif',
  'bodoni-moda': '"Bodoni Moda",Georgia,serif'
};

const FONT_IMPORT = '@import url("https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Cinzel:wght@400;600;700&family=Cormorant+SC:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap");';

const DIVIDER_SYMBOLS = {
  dots: '•••',
  diamond: '◆',
  heart: '♥',
  star: '✦',
  sparkle: '✧ ✦ ✧',
  flower: '❀',
  ornament: '❦'
};

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

export function safeSlug(value = 'johankarrd') {
  return String(value || 'johankarrd').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'johankarrd';
}

function safeOptionalSlug(value = '') {
  const text = String(value || '').replace(/^#/, '').trim();
  return text ? safeSlug(text) : '';
}

function safeCss(value, fallback) {
  const text = String(value || '').trim();
  if (!text || /[;{}<>]/.test(text) || text.length > 520) return fallback;
  return text;
}

function safeFont(value = 'system') {
  const key = String(value || 'system').toLowerCase();
  return FONT_STACKS[key] ? key : 'system';
}

function safeUrl(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('/') || text.startsWith('#') || text.startsWith('mailto:') || text.startsWith('tel:')) return text;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(text) && text.length < 1800000) return text;
  try { const url = new URL(text); if (url.protocol === 'https:' || url.protocol === 'http:') return text; } catch (_) {}
  return '';
}

function safeColor(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(text)) return text;
  return '';
}

function safeAlign(value = 'center') {
  return ['left', 'center', 'right'].includes(value) ? value : 'center';
}

function numberIn(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function safeLayout(value = 'auto') {
  return ['auto', 'stack', 'row'].includes(value) ? value : 'auto';
}

function normalizeItem(item = {}) {
  const type = String(item.type || '').toLowerCase();
  if (type === 'title' || type === 'text') {
    return {
      id: String(item.id || ''),
      type,
      text: String(item.text || (type === 'title' ? 'Título' : 'Texto')).slice(0, 4000),
      align: safeAlign(item.align),
      color: safeColor(item.color),
      fontSize: numberIn(item.fontSize, type === 'title' ? 34 : 15, 8, 160),
      weight: numberIn(item.weight, type === 'title' ? 900 : 500, 100, 1000),
      letterSpacing: numberIn(item.letterSpacing, 0, -2, 20),
      lineHeight: numberIn(item.lineHeight, type === 'title' ? .95 : 1.4, .7, 2.4),
      width: numberIn(item.width, 100, 10, 100)
    };
  }

  if (type === 'logo' || type === 'image') {
    const src = safeUrl(item.src);
    if (!src) return null;
    const next = {
      id: String(item.id || ''),
      type,
      src,
      alt: String(item.alt || '').slice(0, 240),
      radius: numberIn(item.radius, 0, 0, 120),
      fit: item.fit === 'cover' ? 'cover' : 'contain',
      width: numberIn(item.width, 100, 10, 100),
      maxHeight: numberIn(item.maxHeight, type === 'logo' ? 120 : 640, 40, 1200),
      align: safeAlign(item.align)
    };
    const link = safeUrl(item.link);
    if (link) next.link = link;
    return next;
  }

  if (type === 'links') {
    const links = Array.isArray(item.links) ? item.links : [];
    return {
      id: String(item.id || ''),
      type,
      links: links.slice(0, 24).map((row) => [String(row?.[0] || 'ENLACE').slice(0, 80), safeUrl(row?.[1]) || '#']),
      align: safeAlign(item.align),
      layout: safeLayout(item.layout),
      fontSize: numberIn(item.fontSize, 12, 8, 42),
      letterSpacing: numberIn(item.letterSpacing, 0, -1, 12),
      buttonHeight: numberIn(item.buttonHeight, 42, 30, 96),
      radius: numberIn(item.radius, 14, 0, 48)
    };
  }

  if (type === 'gallery') {
    const imgs = Array.isArray(item.imgs) ? item.imgs.map(safeUrl).filter(Boolean).slice(0, 120) : [];
    return imgs.length ? { id: String(item.id || ''), type, imgs } : null;
  }

  if (type === 'grid') {
    const tiles = Array.isArray(item.tiles) ? item.tiles : [];
    return { id: String(item.id || ''), type, tiles: tiles.slice(0, 60).map((row) => [String(row?.[0] || '').slice(0, 48), safeUrl(row?.[1]), safeUrl(row?.[2]), safeUrl(row?.[3]) || '#']).filter((row) => row[1] || row[2]) };
  }

  if (type === 'divider') {
    const shape = Object.hasOwn(DIVIDER_SYMBOLS, item.shape) ? item.shape : 'line';
    return {
      id: String(item.id || ''),
      type,
      style: item.style === 'ghost' ? 'ghost' : 'line',
      shape,
      color: safeColor(item.color) || '#feedb9',
      size: numberIn(item.size, 2, 1, 12),
      label: String(item.label || '').slice(0, 80),
      target: safeOptionalSlug(item.target),
      anchor: safeOptionalSlug(item.anchor),
      symbolSize: numberIn(item.symbolSize, 18, 8, 64),
      space: numberIn(item.space, 20, 0, 120)
    };
  }
  return null;
}

export function normalizeSite(site) {
  const source = site && typeof site === 'object' ? site : FALLBACK_SITE;
  const sections = Array.isArray(source.sections) ? source.sections : [];
  const normalized = {
    name: String(source.name || 'Johankarrd').slice(0, 80),
    slug: safeSlug(source.slug || source.name || 'johankarrd'),
    bg: safeCss(source.bg, '#000'),
    accent: safeCss(source.accent, '#fff'),
    card: safeCss(source.card, '#08080b'),
    fontFamily: safeFont(source.fontFamily),
    shellMode: source.shellMode === 'boostr' ? 'boostr' : 'clean',
    sections: sections.slice(0, 1000).map((section, index) => {
      const id = safeSlug(section?.id || section?.label || `seccion-${index + 1}`);
      const label = String(section?.label || id || 'Sección').slice(0, 48);
      const items = Array.isArray(section?.items) ? section.items.map(normalizeItem).filter(Boolean) : [];
      return { id, label, items };
    }).filter((section) => section.id)
  };
  if (!normalized.sections.length) normalized.sections = FALLBACK_SITE.sections;
  return normalized;
}

function blockAlign(item) {
  if (item.align === 'left') return 'margin-left:0;margin-right:auto;';
  if (item.align === 'right') return 'margin-left:auto;margin-right:0;';
  return 'margin-left:auto;margin-right:auto;';
}

function textStyle(item) {
  return `width:${item.width}%;${blockAlign(item)}font-size:${item.fontSize}px;font-weight:${item.weight};text-align:${item.align};letter-spacing:${item.letterSpacing}px;line-height:${item.lineHeight};${item.color ? `color:${escapeHtml(item.color)};` : ''}`;
}

function externalAttrs(url) {
  return /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : '';
}

function itemHtml(item) {
  if (item.type === 'title') return `<div class="title" style="${textStyle(item)}">${escapeHtml(item.text)}</div>`;
  if (item.type === 'text') return `<div class="text" style="${textStyle(item)}">${escapeHtml(item.text)}</div>`;

  if (item.type === 'logo' || item.type === 'image') {
    const className = item.type === 'logo' ? 'logo' : 'shot';
    const media = `<img class="${className}" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" style="border-radius:${item.radius}px;object-fit:${item.fit};max-height:${item.maxHeight}px">`;
    const body = item.link ? `<a href="${escapeHtml(item.link)}"${externalAttrs(item.link)}>${media}</a>` : media;
    return `<div class="media" style="width:${item.width}%;${blockAlign(item)}">${body}</div>`;
  }

  if (item.type === 'links') {
    const style = `--button-size:${item.fontSize}px;--button-spacing:${item.letterSpacing}px;--button-height:${item.buttonHeight}px;--button-radius:${item.radius}px;--button-align:${item.align};`;
    return `<div class="links layout-${item.layout} align-${item.align}" style="${style}">${item.links.map((row) => `<a href="${escapeHtml(row[1] || '#')}"${externalAttrs(row[1] || '#')}>${escapeHtml(row[0] || 'ENLACE')}</a>`).join('')}</div>`;
  }

  if (item.type === 'gallery') return `<div class="gallery">${item.imgs.map((src) => `<img src="${escapeHtml(src)}" alt="">`).join('')}</div>`;
  if (item.type === 'grid') return `<div class="cargrid">${item.tiles.map((row) => `<a href="${escapeHtml(row[3] || '#')}"${externalAttrs(row[3] || '#')}><img src="${escapeHtml(row[1])}" alt=""><img src="${escapeHtml(row[2])}" alt=""></a>`).join('')}</div>`;

  if (item.type === 'divider') {
    const classes = `divider ${item.style === 'ghost' ? 'ghost' : ''} ${item.shape !== 'line' ? 'symbol' : ''}`;
    const id = item.anchor ? ` id="${escapeHtml(item.anchor)}"` : '';
    const label = item.label ? `<small>${escapeHtml(item.label)}</small>` : '';
    const symbol = item.shape !== 'line' ? `<b style="--symbol-size:${item.symbolSize}px">${escapeHtml(DIVIDER_SYMBOLS[item.shape] || '◆')}</b>` : `<span style="--divider-color:${escapeHtml(item.color)};--divider-size:${item.size}px"></span>`;
    const body = `${symbol}${label}`;
    const style = `style="--divider-space:${item.space}px;color:${escapeHtml(item.color)}"`;
    return item.target ? `<a${id} class="${classes}" href="#${escapeHtml(item.target)}" ${style}>${body}</a>` : `<div${id} class="${classes}" ${style}>${body}</div>`;
  }
  return '';
}

export function renderJohankarrdHtml(inputSite) {
  const site = normalizeSite(inputSite);
  const font = FONT_STACKS[site.fontFamily] || FONT_STACKS.system;
  const ids = site.sections.map((section) => section.id);
  const nav = site.sections.map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a>`).join('');
  const pages = site.sections.map((section) => `<section class="page" id="${escapeHtml(section.id)}"><div class="card">${section.items.map(itemHtml).join('')}</div></section>`).join('');
  const shellMeta = `<meta name="boostr-shell" content="${site.shellMode === 'boostr' ? 'workspace' : 'clean'}">`;
  const css = `${FONT_IMPORT}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}body{font-family:${font}}.site{width:100vw;height:100vh;position:relative;overflow:hidden;background:${site.bg};color:${site.accent};font-family:${font}}.nav{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:14px;max-width:90%;overflow:auto;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}.nav a{border:0;background:transparent;color:${site.accent};font-family:${font};font-size:10px;font-weight:900;text-decoration:underline;text-transform:uppercase;white-space:nowrap}.page{position:absolute;inset:0;display:grid;place-items:center;padding:54px 14px 24px;opacity:0;pointer-events:none;filter:blur(10px);transform:scale(.99);transition:.45s}.page.active{opacity:1;pointer-events:auto;filter:blur(0);transform:none}.card{width:min(86%,420px);max-height:100%;overflow:auto;border-radius:20px;background:${site.card};padding:14px;display:grid;gap:9px;place-items:center;box-shadow:0 20px 38px #0008;font-family:${font};-webkit-overflow-scrolling:touch}.card img{display:block;max-width:100%;height:auto}.media{display:grid;place-items:center}.media>a{display:grid;place-items:center;width:100%}.logo{width:auto;max-width:100%}.shot{width:100%}.title,.text{font-family:${font};white-space:pre-wrap}.title{text-transform:uppercase}.links{background:#feedb9;color:#061f3d;border-radius:var(--button-radius);padding:8px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}.links.layout-stack{grid-template-columns:1fr}.links.layout-row{grid-template-columns:repeat(auto-fit,minmax(0,1fr))}.links.align-left a{text-align:left;justify-content:flex-start}.links.align-center a{text-align:center;justify-content:center}.links.align-right a{text-align:right;justify-content:flex-end}.links a{min-height:var(--button-height);display:flex;align-items:center;color:#061f3d;font-family:${font};font-size:var(--button-size);font-weight:900;letter-spacing:var(--button-spacing);text-decoration:none;border-radius:calc(var(--button-radius) * .72);padding:8px 10px}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:7px;width:100%}.gallery img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px}.cargrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cargrid a{display:grid;place-items:center}.divider{width:100%;display:grid;gap:7px;place-items:center;padding:var(--divider-space,10px) 0;text-decoration:none;color:inherit}.divider span{display:block;width:100%;height:var(--divider-size,2px);border-radius:999px;background:var(--divider-color,currentColor);box-shadow:0 0 24px color-mix(in srgb,var(--divider-color,currentColor) 42%,transparent)}.divider.symbol b{font-size:var(--symbol-size,18px);font-weight:500;letter-spacing:.22em;line-height:1;filter:drop-shadow(0 0 14px currentColor)}.divider.ghost{min-height:32px}.divider.ghost span{opacity:0}.divider small{font-family:${font};font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;opacity:.58}.powered{position:absolute;bottom:10px;left:0;right:0;text-align:center;color:#ffffff5c;font-family:${font};font-size:10px}@media(max-width:640px){.card{width:min(88%,420px)}.links.layout-row{grid-template-columns:repeat(auto-fit,minmax(90px,1fr))}}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${shellMeta}<title>${escapeHtml(site.name)}</title><style>${css}</style></head><body><div class="site"><nav class="nav">${nav}</nav>${pages}<div class="powered">Powered by BOOSTR Labs</div></div><script>const ids=${JSON.stringify(ids)};function show(){let id=location.hash.slice(1)||ids[0];if(!ids.includes(id))id=ids[0];document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));}addEventListener('hashchange',show);show();<\/script></body></html>`;
}

export function isRenderable(site) {
  const normalized = normalizeSite(site);
  return Boolean(normalized.sections.length && normalized.sections[0].id);
}
