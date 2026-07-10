const FALLBACK_SITE = {
  name: 'Johankarrd',
  slug: 'johankarrd',
  bg: '#000',
  accent: '#fff',
  card: '#08080b',
  fontFamily: 'system',
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
  impact: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif'
};

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

export function safeSlug(value = 'johankarrd') {
  return String(value || 'johankarrd').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'johankarrd';
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

function normalizeItem(item = {}) {
  const type = String(item.type || '').toLowerCase();
  if (type === 'title' || type === 'text') {
    return {
      id: String(item.id || ''),
      type,
      text: String(item.text || (type === 'title' ? 'Título' : 'Texto')).slice(0, 4000),
      align: safeAlign(item.align),
      color: safeColor(item.color),
      fontSize: Math.max(8, Math.min(160, Number(item.fontSize) || (type === 'title' ? 34 : 15))),
      weight: Math.max(100, Math.min(1000, Number(item.weight) || (type === 'title' ? 900 : 500)))
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
      radius: Math.max(0, Math.min(120, Number(item.radius) || 0)),
      fit: item.fit === 'cover' ? 'cover' : 'contain'
    };
    const link = safeUrl(item.link);
    if (link) next.link = link;
    return next;
  }
  if (type === 'links') {
    const links = Array.isArray(item.links) ? item.links : [];
    return { id: String(item.id || ''), type, links: links.slice(0, 24).map((row) => [String(row?.[0] || 'ENLACE').slice(0, 40), safeUrl(row?.[1]) || '#']) };
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
    return {
      id: String(item.id || ''),
      type,
      style: item.style === 'ghost' ? 'ghost' : 'line',
      color: safeColor(item.color) || '#feedb9',
      size: Math.max(1, Math.min(12, Number(item.size) || 2)),
      label: String(item.label || '').slice(0, 48),
      target: safeSlug(String(item.target || '').replace(/^#/, ''))
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

function textStyle(item) {
  return `font-size:${item.fontSize}px;font-weight:${item.weight};text-align:${item.align};${item.color ? `color:${escapeHtml(item.color)};` : ''}`;
}

function itemHtml(item) {
  if (item.type === 'title') return `<div class="title" style="${textStyle(item)}">${escapeHtml(item.text)}</div>`;
  if (item.type === 'text') return `<div class="text" style="${textStyle(item)}">${escapeHtml(item.text)}</div>`;
  if (item.type === 'logo') return `<img class="logo" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" style="border-radius:${item.radius}px;object-fit:${item.fit}">`;
  if (item.type === 'image') {
    const image = `<img class="shot" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" style="border-radius:${item.radius}px;object-fit:${item.fit}">`;
    return item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${image}</a>` : image;
  }
  if (item.type === 'links') return `<div class="links">${item.links.map((row) => `<a href="${escapeHtml(row[1] || '#')}">${escapeHtml(row[0] || 'ENLACE')}</a>`).join('')}</div>`;
  if (item.type === 'gallery') return `<div class="gallery">${item.imgs.map((src) => `<img src="${escapeHtml(src)}" alt="">`).join('')}</div>`;
  if (item.type === 'grid') return `<div class="cargrid">${item.tiles.map((row) => `<a href="${escapeHtml(row[3] || '#')}"><img src="${escapeHtml(row[1])}" alt=""><img src="${escapeHtml(row[2])}" alt=""></a>`).join('')}</div>`;
  if (item.type === 'divider') {
    const classes = `divider ${item.style === 'ghost' ? 'ghost' : ''}`;
    const label = item.label ? `<small>${escapeHtml(item.label)}</small>` : '';
    const body = `<span style="--divider-color:${escapeHtml(item.color)};--divider-size:${item.size}px"></span>${label}`;
    return item.target ? `<a class="${classes}" href="#${escapeHtml(item.target)}">${body}</a>` : `<div class="${classes}">${body}</div>`;
  }
  return '';
}

export function renderJohankarrdHtml(inputSite) {
  const site = normalizeSite(inputSite);
  const font = FONT_STACKS[site.fontFamily] || FONT_STACKS.system;
  const ids = site.sections.map((section) => section.id);
  const nav = site.sections.map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a>`).join('');
  const pages = site.sections.map((section) => `<section class="page" id="${escapeHtml(section.id)}"><div class="card">${section.items.map(itemHtml).join('')}</div></section>`).join('');
  const css = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}body{font-family:${font}}.site{width:100vw;height:100vh;position:relative;overflow:hidden;background:${site.bg};color:${site.accent};font-family:${font}}.nav{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:14px;max-width:90%;overflow:auto;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}.nav a{border:0;background:transparent;color:${site.accent};font-family:${font};font-size:10px;font-weight:900;text-decoration:underline;text-transform:uppercase;white-space:nowrap}.page{position:absolute;inset:0;display:grid;place-items:center;padding:54px 14px 24px;opacity:0;pointer-events:none;filter:blur(10px);transform:scale(.99);transition:.45s}.page.active{opacity:1;pointer-events:auto;filter:blur(0);transform:none}.card{width:min(86%,320px);max-height:100%;overflow:auto;border-radius:20px;background:${site.card};padding:14px;display:grid;gap:9px;place-items:center;box-shadow:0 20px 38px #0008;font-family:${font};-webkit-overflow-scrolling:touch}.card img{display:block;max-width:100%;height:auto}.logo{max-height:84px}.shot{width:100%}.title,.text{width:100%;font-family:${font};white-space:pre-wrap}.title{text-transform:uppercase;line-height:.9}.text{line-height:1.45}.links{background:#feedb9;color:#061f3d;border-radius:12px;padding:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%}.links a{color:#061f3d;text-align:center;font-family:${font};font-size:9px;font-weight:900;text-decoration:none}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:7px;width:100%}.gallery img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px}.cargrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cargrid a{display:grid;place-items:center}.divider{width:100%;display:grid;gap:7px;place-items:center;padding:10px 0;text-decoration:none;color:inherit}.divider span{display:block;width:100%;height:var(--divider-size,2px);border-radius:999px;background:var(--divider-color,currentColor);box-shadow:0 0 24px color-mix(in srgb,var(--divider-color,currentColor) 42%,transparent)}.divider.ghost{min-height:32px}.divider.ghost span{opacity:0}.divider small{font-family:${font};font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;opacity:.58}.powered{position:absolute;bottom:10px;left:0;right:0;text-align:center;color:#ffffff5c;font-family:${font};font-size:10px}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(site.name)}</title><style>${css}</style></head><body><div class="site"><nav class="nav">${nav}</nav>${pages}<div class="powered">Powered by BOOSTR Labs</div></div><script>const ids=${JSON.stringify(ids)};function show(){let id=location.hash.slice(1)||ids[0];if(!ids.includes(id))id=ids[0];document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));}addEventListener('hashchange',show);show();<\/script></body></html>`;
}

export function isRenderable(site) {
  const normalized = normalizeSite(site);
  return Boolean(normalized.sections.length && normalized.sections[0].id);
}
