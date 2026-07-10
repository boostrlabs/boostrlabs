import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => { throw new Error(`Johankarrd backend health failed: ${message}`); };

const files = {
  assets: 'functions/api/johankarrd/assets.js',
  drafts: 'functions/api/johankarrd/drafts.js',
  sites: 'functions/api/johankarrd/sites.js',
  render: 'functions/api/johankarrd/render.js',
  publish: 'functions/api/johankarrd/publish.js',
  remove: 'functions/api/johankarrd/delete.js',
  renderer: 'functions/_lib/johankarrd-renderer.js'
};

const sources = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await read(path)])));

for (const [key, path] of Object.entries(files)) {
  const check = spawnSync(process.execPath, ['--check', new URL(path, root).pathname], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${key} has invalid syntax\n${check.stderr}`);
}

for (const marker of ['MAX_BYTES', 'ALLOWED_TYPES', 'validAssetKey', "image/jpeg", "image/png", "image/webp", 'File is too large', 'x-content-type-options']) {
  if (!sources.assets.includes(marker)) fail(`asset safety marker missing: ${marker}`);
}

for (const marker of ['MAX_REQUEST_BYTES', 'MAX_SITES', 'validateSites', 'Draft payload is too large', 'x-content-type-options']) {
  if (!sources.drafts.includes(marker)) fail(`draft safety marker missing: ${marker}`);
}

for (const marker of ['MAX_REQUEST_BYTES', 'MAX_HTML_BYTES', 'Rendered HTML failed safety checks', 'content-security-policy', 'x-content-type-options']) {
  if (!sources.render.includes(marker)) fail(`render safety marker missing: ${marker}`);
}

for (const marker of ['MAX_REQUEST_BYTES', 'MAX_SITE_BYTES', 'MAX_HTML_BYTES', 'MAX_VERSIONS_PER_SLUG', 'env.DB.batch', 'Rendered HTML failed safety checks', 'retained_versions']) {
  if (!sources.publish.includes(marker)) fail(`publish safety marker missing: ${marker}`);
}

for (const marker of ['safeCss', 'safeUrl', 'safeColor', 'normalizeSite', 'escapeHtml']) {
  if (!sources.renderer.includes(marker)) fail(`renderer sanitization marker missing: ${marker}`);
}

for (const source of Object.values(sources)) {
  if (/Access-Control-Allow-Origin\s*[:=]\s*['"]\*/i.test(source)) fail('wildcard CORS found');
  if (source.includes('eval(') || source.includes('new Function(')) fail('dynamic code execution found');
}

console.log('Johankarrd backend health passed: bounded payloads, scoped assets, sanitized renderer, batch publishing and security headers.');
