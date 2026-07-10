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
    if (['cafe', 'cafe-del-mar', 'cafedelmar'].includes(slug) || ['cafe-del-mar', 'cafedelmar'].includes(label)) return 'cafedelmar';
    if (['inventory', 'solve-inventory', 'solveinventory'].includes(slug) || ['solve-inventory', 'solveinventory'].includes(label)) return 'solveinventory';
    return slug;
  }

  function storageKey(slug) {
    if (slug === 'cafedelmar') return 'cafe';
    if (slug === 'solveinventory') return 'inventory';
    return slug;
  }

  function quality(site = {}) {
    const sections = Array.isArray(site.sections) ? site.sections : [];
    return sections.length * 10 + sections.reduce((total, section) => total + (Array.isArray(section?.items) ? section.items.length : 0), 0);
  }

  function dedupe(input = {}) {
    const output = {};
    for (const [key, raw] of Object.entries(input || {})) {
      if (!raw || typeof raw !== 'object') continue;
      const slug = canonicalSlug(raw.slug || key, raw.name);
      if (!slug) continue;
      const target = storageKey(slug);
      const site = { ...raw, slug, sections: Array.isArray(raw.sections) ? raw.sections : [] };
      if (!output[target] || quality(site) > quality(output[target])) output[target] = site;
    }
    return output;
  }

  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '{}');
    const cleaned = dedupe(current);
    if (Object.keys(cleaned).length) localStorage.setItem(KEY, JSON.stringify(cleaned));
  } catch (_) {}

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init?.method || 'GET').toUpperCase();
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
        }
        if (body.site) body.site = attachFont(body.site, body.slug);
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };

  window.JOHANKARRD_PREFLIGHT = { canonicalSlug, storageKey, dedupe, fontKey: FONT_KEY };
})();
