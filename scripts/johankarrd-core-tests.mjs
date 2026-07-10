import assert from 'node:assert/strict';
import '../public/johankarrdbuildr/core-v64.js';

const core = globalThis.JOHANKARRD_CORE;
assert.equal(core?.version, 64, 'core v64 did not load');

const base = {
  alpha: {
    name: 'Alpha',
    slug: 'alpha',
    sections: [
      {
        id: 'home',
        label: 'Inicio',
        items: [
          { id: 'a', type: 'title', text: 'A' },
          { id: 'b', type: 'text', text: 'B' },
          { id: 'c', type: 'image', src: '/c.png' }
        ]
      },
      { id: 'gallery', label: 'Galería', items: [{ id: 'd', type: 'image', src: '/d.png' }] }
    ]
  }
};

assert.deepEqual(core.auditState(base), { ok: true, code: 'healthy', detail: '' });

const movedDown = core.moveItemExact({ sites: base, siteKey: 'alpha', sectionId: 'home', itemId: 'a', toIndex: 2 });
assert.equal(movedDown.ok, true);
assert.deepEqual(movedDown.sites.alpha.sections[0].items.map((item) => item.id), ['b', 'c', 'a']);
assert.deepEqual(base.alpha.sections[0].items.map((item) => item.id), ['a', 'b', 'c'], 'move mutated original state');

const movedUp = core.moveItemExact({ sites: movedDown.sites, siteKey: 'alpha', sectionId: 'home', itemId: 'a', toIndex: 0 });
assert.deepEqual(movedUp.sites.alpha.sections[0].items.map((item) => item.id), ['a', 'b', 'c']);

const clamped = core.moveItemExact({ sites: base, siteKey: 'alpha', sectionId: 'home', itemId: 'a', toIndex: 999 });
assert.deepEqual(clamped.sites.alpha.sections[0].items.map((item) => item.id), ['b', 'c', 'a']);

for (const request of [
  { siteKey: 'missing', sectionId: 'home', itemId: 'a', toIndex: 1, code: 'site-not-found' },
  { siteKey: 'alpha', sectionId: 'missing', itemId: 'a', toIndex: 1, code: 'section-not-found' },
  { siteKey: 'alpha', sectionId: 'home', itemId: 'missing', toIndex: 1, code: 'item-not-found' }
]) {
  const output = core.moveItemExact({ sites: base, ...request });
  assert.equal(output.ok, false);
  assert.equal(output.code, request.code);
  assert.deepEqual(output.sites, base);
}

const crossSection = core.moveItemExact({ sites: base, siteKey: 'alpha', sectionId: 'home', itemId: 'd', toIndex: 0 });
assert.equal(crossSection.ok, false);
assert.equal(crossSection.code, 'item-not-found', 'cross-section move must be rejected');

const duplicateItem = structuredClone(base);
duplicateItem.alpha.sections[1].items[0].id = 'a';
assert.equal(core.auditState(duplicateItem).code, 'duplicate-item-id');

const duplicateSection = structuredClone(base);
duplicateSection.alpha.sections[1].id = 'home';
assert.equal(core.auditState(duplicateSection).code, 'duplicate-section-id');

const duplicateSlug = structuredClone(base);
duplicateSlug.beta = { name: 'Beta', slug: 'alpha', sections: [{ id: 'home', label: 'Inicio', items: [] }] };
assert.equal(core.auditState(duplicateSlug).code, 'duplicate-slug');

const current = core.ensureCurrent(base, 'missing', 'missing');
assert.deepEqual(current, { siteKey: 'alpha', sectionId: 'home' });

console.log('Johankarrd core tests passed: exact reorder, no cross-section mutation, immutable moves and state invariants.');
