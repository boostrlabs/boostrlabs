(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const baseFetch = window.fetch.bind(window);
  const api = window.JOHANKARRD_PREFLIGHT || {};
  const canonicalSlug = api.canonicalSlug || ((value) => String(value || '').toLowerCase());
  const storageKey = api.storageKey || ((value) => value);
  const dedupe = api.dedupe || ((sites) => sites || {});

  const readLocal = () => {
    try { return dedupe(JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
    catch (_) { return {}; }
  };

  const identity = (key, site = {}) => {
    const canonical = canonicalSlug(site.slug || key, site.name);
    if (canonical === 'cafedelmar' || canonical === 'solveinventory') return canonical;
    return String(site.name || canonical || key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  function preferLocal(remote = {}, local = {}) {
    const result = { ...dedupe(remote) };
    const byIdentity = new Map(Object.entries(result).map(([key, site]) => [identity(key, site), key]));
    for (const [key, site] of Object.entries(dedupe(local))) {
      const id = identity(key, site);
      const oldKey = byIdentity.get(id);
      if (oldKey) delete result[oldKey];
      const target = storageKey(canonicalSlug(site.slug || key, site.name)) || key;
      result[target] = site;
      byIdentity.set(id, target);
    }
    return dedupe(result);
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
    const response = await baseFetch(input, init);
    try {
      if (method === 'GET' && response.ok && (/\/api\/johankarrd\/drafts(?:\?|$)/.test(url) || /\/api\/johankarrd\/sites(?:\?|$)/.test(url))) {
        const data = await response.clone().json();
        if (data?.sites) {
          data.sites = preferLocal(data.sites, readLocal());
          localStorage.setItem(KEY, JSON.stringify(data.sites));
          const headers = new Headers(response.headers);
          headers.set('content-type', 'application/json; charset=utf-8');
          return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers });
        }
      }
    } catch (_) {}
    return response;
  };

  function persistPending() {
    const sites = readLocal();
    if (!Object.keys(sites).length) return;
    const body = JSON.stringify({ sites });
    try {
      navigator.sendBeacon('/api/johankarrd/drafts', new Blob([body], { type: 'application/json' }));
    } catch (_) {
      fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    }
  }

  window.addEventListener('pagehide', persistPending);
})();