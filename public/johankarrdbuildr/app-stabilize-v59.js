(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const slugify = (value = '') => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  function canonical(site = {}, fallback = '') {
    const slug = slugify(site.slug || fallback || site.name);
    const name = slugify(site.name || '');
    const joined = `${slug}|${name}`;
    if (/(^|\|)(inventory|solve-inventory|solveinventory)(\||$)/.test(joined) || name.includes('solve-inventory')) return 'solveinventory';
    if (/(^|\|)(cafe|cafe-del-mar|cafedelmar)(\||$)/.test(joined) || name.includes('cafe-del-mar')) return 'cafedelmar';
    return slug || name || slugify(fallback);
  }

  function storageKey(id) {
    if (id === 'cafedelmar') return 'cafe';
    if (id === 'solveinventory') return 'inventory';
    return id;
  }

  function score(site = {}) {
    const sections = Array.isArray(site.sections) ? site.sections : [];
    const items = sections.reduce((total, section) => total + (Array.isArray(section?.items) ? section.items.length : 0), 0);
    const hasLiveSlug = site.slug ? 25 : 0;
    return sections.length * 100 + items * 10 + hasLiveSlug;
  }

  function dedupe(input = {}) {
    const result = {};
    for (const [key, raw] of Object.entries(input || {})) {
      if (!raw || typeof raw !== 'object') continue;
      const id = canonical(raw, key);
      if (!id) continue;
      const target = storageKey(id);
      const site = { ...raw, slug: id, sections: Array.isArray(raw.sections) ? raw.sections : [] };
      if (!result[target] || score(site) > score(result[target])) result[target] = site;
    }
    return result;
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function writeLocal(sites) {
    localStorage.setItem(KEY, JSON.stringify(dedupe(sites)));
  }

  function hideNativeSelect() {
    const field = $('[data-site-select]')?.closest('.field');
    if (!field) return;
    field.style.position = 'absolute';
    field.style.width = '1px';
    field.style.height = '1px';
    field.style.overflow = 'hidden';
    field.style.opacity = '0';
    field.style.pointerEvents = 'none';
    field.setAttribute('aria-hidden', 'true');
  }

  function rebuildNativeSelect(sites) {
    const select = $('[data-site-select]');
    if (!select) return;
    const previous = select.value;
    select.innerHTML = Object.entries(sites).map(([key, site]) => {
      const label = String(site.name || key).replace(/[&<>"']/g, '');
      return `<option value="${key}">${label}</option>`;
    }).join('');
    if (sites[previous]) select.value = previous;
    else if (Object.keys(sites).length) select.value = Object.keys(sites)[0];
  }

  async function synchronizeSites() {
    let sites = dedupe(readLocal());
    try {
      const response = await fetch('/api/johankarrd/sites', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        sites = dedupe({ ...sites, ...(data.sites || {}) });
      }
    } catch (_) {}

    writeLocal(sites);
    rebuildNativeSelect(sites);

    try {
      await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites })
      });
    } catch (_) {}
  }

  function closeTopLayer() {
    const modal = $('.modal-backdrop');
    if (modal) {
      modal.remove();
      return true;
    }
    const sheet = $('[data-mobile-sheet].open');
    if (sheet) {
      $('[data-mobile-close]')?.click();
      return true;
    }
    const quick = $('[data-mobile-more-menu]');
    if (quick) {
      quick.remove();
      return true;
    }
    return false;
  }

  function polishFontCards() {
    const fallbackStacks = {
      system: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      inter: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      arial: 'Arial,Helvetica,sans-serif',
      trebuchet: '"Trebuchet MS",Arial,sans-serif',
      verdana: 'Verdana,Geneva,sans-serif',
      georgia: 'Georgia,"Times New Roman",serif',
      times: '"Times New Roman",Times,serif',
      courier: '"Courier New",Courier,monospace',
      impact: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif'
    };
    $$('.font-card').forEach((card) => {
      const key = card.dataset.font;
      if (fallbackStacks[key]) card.style.fontFamily = fallbackStacks[key];
    });
  }

  function simplifyImageModal(box) {
    if (!box || box.dataset.v59ImageSimple) return;
    const upload = $('[data-config-upload]', box);
    const src = $('[data-value="src"]', box);
    if (!upload || !src) return;
    box.dataset.v59ImageSimple = '1';
    const uploadLabel = upload.closest('label');
    if (uploadLabel) {
      uploadLabel.style.cursor = 'pointer';
      uploadLabel.innerHTML = 'Choose image from Photos or Files<small style="display:block;margin-top:6px;opacity:.55">No file path needed</small>';
      uploadLabel.append(upload);
    }
    const field = src.closest('.field');
    if (field) {
      field.style.display = 'none';
      const advanced = document.createElement('button');
      advanced.type = 'button';
      advanced.className = 'media-advanced-toggle';
      advanced.textContent = 'Use image URL instead';
      advanced.addEventListener('click', () => {
        field.style.display = field.style.display === 'none' ? 'grid' : 'none';
      });
      field.insertAdjacentElement('afterend', advanced);
    }
  }

  function inspect() {
    hideNativeSelect();
    polishFontCards();
    $$('.modal-card').forEach(simplifyImageModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (closeTopLayer()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }, true);

  window.addEventListener('load', async () => {
    await synchronizeSites();
    inspect();
    new MutationObserver(inspect).observe(document.body, { childList: true, subtree: true });
  });
})();
