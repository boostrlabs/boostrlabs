(() => {
  'use strict';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const result = (ok, code = 'ok', detail = '') => ({ ok, code, detail });

  function findSection(sites, siteKey, sectionId) {
    const site = sites?.[siteKey];
    const section = site?.sections?.find((entry) => entry?.id === sectionId);
    return { site, section };
  }

  function moveItemExact({ sites, siteKey, sectionId, itemId, toIndex }) {
    const next = clone(sites || {});
    const { site, section } = findSection(next, siteKey, sectionId);
    if (!site) return { ...result(false, 'site-not-found'), sites: next };
    if (!section || !Array.isArray(section.items)) return { ...result(false, 'section-not-found'), sites: next };

    const from = section.items.findIndex((item) => item?.id === itemId);
    if (from < 0) return { ...result(false, 'item-not-found'), sites: next };

    const target = Math.max(0, Math.min(Number.isFinite(Number(toIndex)) ? Number(toIndex) : from, section.items.length - 1));
    if (from === target) return { ...result(true, 'unchanged'), sites: next, from, to: target };

    const [item] = section.items.splice(from, 1);
    section.items.splice(target, 0, item);
    return { ...result(true, 'moved'), sites: next, from, to: target };
  }

  function auditState(sites) {
    if (!sites || typeof sites !== 'object' || Array.isArray(sites)) return result(false, 'invalid-sites');

    const slugs = new Set();
    const globalItemIds = new Set();
    for (const [siteKey, site] of Object.entries(sites)) {
      if (!site || typeof site !== 'object') return result(false, 'invalid-site', siteKey);
      if (!Array.isArray(site.sections) || !site.sections.length) return result(false, 'site-without-sections', siteKey);
      if (!site.slug || typeof site.slug !== 'string') return result(false, 'site-without-slug', siteKey);
      if (slugs.has(site.slug)) return result(false, 'duplicate-slug', site.slug);
      slugs.add(site.slug);

      const sectionIds = new Set();
      for (const section of site.sections) {
        if (!section?.id || typeof section.id !== 'string') return result(false, 'section-without-id', siteKey);
        if (sectionIds.has(section.id)) return result(false, 'duplicate-section-id', `${siteKey}:${section.id}`);
        sectionIds.add(section.id);
        if (!Array.isArray(section.items)) return result(false, 'invalid-items', `${siteKey}:${section.id}`);

        for (const item of section.items) {
          if (!item?.id || typeof item.id !== 'string') return result(false, 'item-without-id', `${siteKey}:${section.id}`);
          if (globalItemIds.has(item.id)) return result(false, 'duplicate-item-id', item.id);
          globalItemIds.add(item.id);
          if (!item.type || typeof item.type !== 'string') return result(false, 'item-without-type', item.id);
        }
      }
    }

    return result(true, 'healthy');
  }

  function ensureCurrent(sites, currentSite, currentSection) {
    const keys = Object.keys(sites || {});
    const siteKey = sites?.[currentSite] ? currentSite : keys[0] || '';
    const site = sites?.[siteKey];
    const sectionId = site?.sections?.some((section) => section.id === currentSection)
      ? currentSection
      : site?.sections?.[0]?.id || '';
    return { siteKey, sectionId };
  }

  globalThis.JOHANKARRD_CORE = Object.freeze({
    version: 64,
    clone,
    findSection,
    moveItemExact,
    auditState,
    ensureCurrent
  });
})();
