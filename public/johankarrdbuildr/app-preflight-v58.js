(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const FONT_KEY = 'johankarrd-fonts-v1';

  const slugify = (value = '') => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  function canonicalSlug(value = '', name = '') {
    const slug = slugify(value || name);
    const label = slugify(name);
    const joined = `${slug} ${label}`;
    if (/\bcafe-del-mar\b|\bcafedelmar\b/.test(joined) && !/\bcopy\b|\bcopia\b/.test(joined)) return 'cafedelmar';
    if (/\bsolve-inventory\b|\bsolveinventory\b|\binventory-solve\b/.test(joined) && !/\bcopy\b|\bcopia\b/.test(joined)) return 'solveinventory';
    if (slug === 'cafe' && /cafe-del-mar|cafedelmar/.test(label)) return 'cafedelmar';
    if (slug === 'inventory' && /solve-inventory|solveinventory/.test(label)) return 'solveinventory';
    return slug;
  }

  function storageKey(slug) {
    if (slug === 'cafedelmar') return 'cafe';
    if (slug === 'solveinventory') return 'inventory';
    return slug;
  }

  function quality(site = {}) {
    const sections = Array.isArray(site.sections) ? site.sections : [];
    const items = sections.reduce((total, section) => total + (Array.isArray(section?.items) ? section.items.length : 0), 0);
    const populated = sections.reduce((total, section) => total + (section?.items || []).filter((item) => item && Object.keys(item).length > 1).length, 0);
    const publishedBonus = site.status === 'published' || site.published ? 25 : 0;
    return sections.length * 100 + items * 10 + populated + publishedBonus;
  }

  function contentSignature(site = {}) {
    const sections = (site.sections || []).map((section) => ({
      id: slugify(section?.id || section?.label || ''),
      items: (section?.items || []).map((item) => ({
        type: item?.type || '',
        text: item?.text || '',
        src: item?.src || '',
        imgs: Array.isArray(item?.imgs) ? item.imgs.slice(0, 4) : []
      }))
    }));
    try { return JSON.stringify(sections); } catch (_) { return ''; }
  }

  function identity(key, site = {}) {
    const canonical = canonicalSlug(site.slug || key, site.name);
    if (canonical === 'cafedelmar' || canonical === 'solveinventory') return canonical;
    const name = slugify(site.name || '');
    const signature = contentSignature(site);
    return signature ? `${name || canonical || slugify(key)}::${signature}` : (name || canonical || slugify(key));
  }

  function dedupe(input = {}) {
    const grouped = new Map();
    for (const [key, raw] of Object.entries(input || {})) {
      if (!raw || typeof raw !== 'object') continue;
      const slug = canonicalSlug(raw.slug || key, raw.name);
      if (!slug) continue;
      const id = identity(key, raw);
      const target = storageKey(slug);
      const site = { ...raw, slug, sections: Array.isArray(raw.sections) ? raw.sections : [] };
      const previous = grouped.get(id);
      if (!previous || quality(site) > quality(previous.site)) grouped.set(id, { key: target, site });
    }
    const output = {};
    for (const { key, site } of grouped.values()) {
      if (!output[key] || quality(site) > quality(output[key])) output[key] = site;
    }
    return output;
  }

  function cleanLocal() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || '{}');
      const cleaned = dedupe(current);
      localStorage.setItem(KEY, JSON.stringify(cleaned));
    } catch (_) {}
  }

  cleanLocal();

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();

    try {
      const isStateWrite = method === 'POST' && (/\/api\/johankarrd\/drafts(?:\?|$)/.test(url) || /\/api\/johankarrd\/publish(?:\?|$)/.test(url));
      if (isStateWrite && typeof init.body === 'string') {
        const body = JSON.parse(init.body);
        const fonts = JSON.parse(localStorage.getItem(FONT_KEY) || '{}');
        const attachFont = (site, fallback = '') => {
          if (!site || typeof site !== 'object') return site;
          const slug = canonicalSlug(site.slug || fallback, site.name);
          const font = fonts[slug];
          return font ? { ...site, fontFamily: font } : site;
        };
        if (body.sites && typeof body.sites === 'object') {
          const sites = {};
          for (const [key, site] of Object.entries(dedupe(body.sites))) sites[key] = attachFont(site, key);
          body.sites = sites;
          localStorage.setItem(KEY, JSON.stringify(sites));
        }
        if (body.site) body.site = attachFont(body.site, body.slug);
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch (_) {}

    const response = await nativeFetch(input, init);

    try {
      const isStateRead = method === 'GET' && (/\/api\/johankarrd\/drafts(?:\?|$)/.test(url) || /\/api\/johankarrd\/sites(?:\?|$)/.test(url));
      if (isStateRead && response.ok) {
        const data = await response.clone().json();
        if (data?.sites && typeof data.sites === 'object') {
          data.sites = dedupe(data.sites);
          localStorage.setItem(KEY, JSON.stringify(data.sites));
          const headers = new Headers(response.headers);
          headers.set('content-type', 'application/json; charset=utf-8');
          return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers });
        }
      }
    } catch (_) {}

    return response;
  };

  window.JOHANKARRD_PREFLIGHT = { canonicalSlug, storageKey, dedupe, fontKey: FONT_KEY, identity };
})();
