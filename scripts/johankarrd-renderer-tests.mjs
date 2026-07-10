import assert from 'node:assert/strict';
import { normalizeSite, renderJohankarrdHtml } from '../functions/_lib/johankarrd-renderer.js';
import { onRequest } from '../functions/_middleware.js';

const site = {
  name: 'Hummus Mediterranean Food',
  slug: 'hummus',
  shellMode: 'clean',
  fontFamily: 'cormorant-sc',
  bg: '#742719',
  accent: '#ffffff',
  card: '#050505',
  sections: [
    {
      id: 'home',
      label: 'Home',
      items: [
        {
          id: 'title-1',
          type: 'title',
          text: 'HUMMUS',
          align: 'center',
          fontSize: 62,
          letterSpacing: 3.5,
          lineHeight: .9,
          width: 76
        },
        {
          id: 'image-1',
          type: 'image',
          src: '/assets/hummus.png',
          link: '#gallery',
          width: 72,
          maxHeight: 420,
          align: 'center',
          radius: 22
        },
        {
          id: 'links-1',
          type: 'links',
          layout: 'row',
          align: 'center',
          fontSize: 14,
          letterSpacing: 1.25,
          buttonHeight: 54,
          radius: 20,
          links: [['GALLERY', '#gallery'], ['INSTAGRAM', 'https://instagram.com/example']]
        },
        {
          id: 'divider-1',
          type: 'divider',
          shape: 'heart',
          anchor: 'menu-principal',
          target: 'gallery',
          color: '#ffffff',
          symbolSize: 26,
          space: 32
        }
      ]
    },
    { id: 'gallery', label: 'Gallery', items: [{ type: 'text', text: 'Gallery' }] }
  ]
};

const normalized = normalizeSite(site);
assert.equal(normalized.shellMode, 'clean');
assert.equal(normalized.fontFamily, 'cormorant-sc');
assert.equal(normalized.sections[0].items[0].letterSpacing, 3.5);
assert.equal(normalized.sections[0].items[1].maxHeight, 420);
assert.equal(normalized.sections[0].items[2].layout, 'row');
assert.equal(normalized.sections[0].items[3].shape, 'heart');
assert.equal(normalized.sections[0].items[3].anchor, 'menu-principal');

const cleanHtml = renderJohankarrdHtml(site);
for (const marker of [
  '<meta name="boostr-shell" content="clean">',
  'Cormorant SC',
  'width:76%',
  'letter-spacing:3.5px',
  '--button-height:54px',
  'layout-row',
  'id="menu-principal"',
  '♥',
  'href="#gallery"'
]) assert.ok(cleanHtml.includes(marker), `clean render missing ${marker}`);
assert.ok(!cleanHtml.includes('href="#gallery" target="_blank"'), 'internal hash must remain in the same tab');
assert.ok(cleanHtml.includes('href="https://instagram.com/example" target="_blank" rel="noopener"'), 'external links must be isolated');

const workspaceHtml = renderJohankarrdHtml({ ...site, shellMode: 'boostr' });
assert.ok(workspaceHtml.includes('<meta name="boostr-shell" content="workspace">'));

async function runMiddleware(pathname, html) {
  return onRequest({
    request: new Request(`https://boostrlabs.pages.dev${pathname}`),
    next: async () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }).then((response) => response.text());
}

const cleanPublic = await runMiddleware('/johankarrd/hummus/', cleanHtml);
assert.ok(!cleanPublic.includes('production-shell.js'), 'clean public page must not receive BOOSTR shell');
assert.ok(!cleanPublic.includes('workspace-navigation.js'), 'clean public page must not receive workspace navigation');
assert.ok(!cleanPublic.includes('language-engine.js'), 'clean public page must not receive global language engine');

const workspacePublic = await runMiddleware('/johankarrd/internal-menu/', workspaceHtml);
assert.ok(workspacePublic.includes('production-shell.js'), 'workspace page must receive BOOSTR shell');
assert.ok(workspacePublic.includes('workspace-navigation.js'), 'workspace page must receive workspace navigation');

const privatePage = await runMiddleware('/manager/', '<!doctype html><html><head></head><body>Manager</body></html>');
assert.ok(privatePage.includes('production-shell.js'));
assert.ok(privatePage.includes('id="boostr-loading-gate"'));

console.log('Johankarrd renderer tests passed: custom controls, internal hashtags, creative dividers and clean/BOOSTR shell isolation.');
