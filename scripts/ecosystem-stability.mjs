import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
}

function fail(message) {
  failures.push(message);
}

function absolute(relative) {
  return path.join(root, relative);
}

function requireFile(relative) {
  if (!fs.existsSync(absolute(relative))) {
    fail(`Missing required file: ${relative}`);
    return false;
  }
  pass(`File exists: ${relative}`);
  return true;
}

function read(relative) {
  return fs.readFileSync(absolute(relative), 'utf8');
}

function assertContains(relative, pattern, message) {
  if (!requireFile(relative)) return;
  const content = read(relative);
  if (pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern)) pass(message);
  else fail(`${message} (${relative})`);
}

function assertNotContains(relative, pattern, message) {
  if (!requireFile(relative)) return;
  const content = read(relative);
  if (pattern instanceof RegExp ? !pattern.test(content) : !content.includes(pattern)) pass(message);
  else fail(`${message} (${relative})`);
}

function checkJson(relative) {
  if (!requireFile(relative)) return;
  try {
    JSON.parse(read(relative));
    pass(`Valid JSON: ${relative}`);
  } catch (error) {
    fail(`Invalid JSON ${relative}: ${error.message}`);
  }
}

function checkJsSyntax(relative) {
  if (!requireFile(relative)) return;
  const result = spawnSync(process.execPath, ['--check', absolute(relative)], { encoding: 'utf8' });
  if (result.status === 0) pass(`Valid JavaScript syntax: ${relative}`);
  else fail(`JavaScript syntax failed ${relative}: ${(result.stderr || result.stdout).trim()}`);
}

function checkInlineScripts(relative) {
  if (!requireFile(relative)) return;
  const html = read(relative);
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*\btype=["']module["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, index) => {
    try {
      new Function(match[1]);
      pass(`Inline script ${index + 1} parses: ${relative}`);
    } catch (error) {
      fail(`Inline script ${index + 1} failed ${relative}: ${error.message}`);
    }
  });
}

function routeTarget(url) {
  const clean = url.split(/[?#]/)[0];
  if (!clean.startsWith('/') || clean.startsWith('//')) return null;
  if (clean.startsWith('/api/')) return null;
  const relative = clean.replace(/^\/+/, '');
  if (!relative) return 'index.html';
  if (path.extname(relative)) return relative;
  return path.join(relative, 'index.html');
}

function checkLocalLinks(relative) {
  if (!requireFile(relative)) return;
  const html = read(relative);
  const urls = [...html.matchAll(/(?:href|src)=["'](\/[^"']+)["']/g)].map((match) => match[1]);
  const checked = new Set();
  for (const url of urls) {
    const target = routeTarget(url);
    if (!target || checked.has(target)) continue;
    checked.add(target);
    if (fs.existsSync(path.join(root, 'public', target)) || fs.existsSync(path.join(root, target))) {
      pass(`Local target exists: ${url}`);
    } else {
      fail(`Broken local target in ${relative}: ${url} -> ${target}`);
    }
  }
}

const required = [
  'functions/_middleware.js',
  'functions/api/session.js',
  'functions/api/session/switch.js',
  'functions/api/workspace-os.js',
  'functions/api/cloud.js',
  'functions/api/3d-model/[id].js',
  'public/home/index.html',
  'public/login/index.html',
  'public/manager/index.html',
  'public/manager/leads/index.html',
  'public/partner-dashboard/index.html',
  'public/app/janko/index.html',
  'public/app/johanka/index.html',
  'public/app/johanka/cloud/index.html',
  'public/3d/index.html',
  'public/3d/viewer.js',
  'public/3dmodels/models.json'
];
required.forEach(requireFile);

[
  'functions/_middleware.js',
  'functions/api/session.js',
  'functions/api/session/switch.js',
  'functions/api/workspace-os.js',
  'functions/api/cloud.js',
  'functions/api/3d-model/[id].js',
  'functions/_lib/founder-identity.js',
  'public/assets/boostr-mother/production-shell.js',
  'public/assets/boostr-mother/workspace-navigation.js',
  'public/assets/boostr-mother/johanka-cloud-hotfix.js',
  'public/3d/viewer.js'
].forEach(checkJsSyntax);

[
  'public/login/index.html',
  'public/manager/leads/index.html',
  'public/partner-dashboard/index.html',
  'public/app/johanka/cloud/index.html'
].forEach(checkInlineScripts);

['public/3dmodels/models.json', 'package.json'].forEach(checkJson);

assertContains('functions/_middleware.js', '"/3d"', 'Middleware explicitly isolates the 3D public experience');
assertContains('functions/_middleware.js', 'johanka-cloud-hotfix.js', 'Johanka Cloud stable runtime is injected');
assertContains('public/assets/boostr-mother/production-shell.js', '__BOOSTR_PRODUCTION_SHELL__', 'Production shell has a duplicate-runtime guard');
assertContains('public/assets/boostr-mother/production-shell.js', 'Workspace OS', 'Workspace OS is directly reachable from the context bar');
assertNotContains('public/manager/leads/index.html', /Manager PIN|id=["']pin["']|X-Manager-Pin/i, 'Audit Inbox has no manager PIN fallback UI');
assertNotContains('public/manager/leads/index.html', 'console.js', 'Audit Inbox does not load demo console effects');
assertNotContains('public/partner-dashboard/index.html', /OMG Beauty|GEMESE/i, 'Workspace OS does not expose legacy partner demo data');
assertContains('public/login/index.html', 'Founder · CEO · Full system access', 'Janko founder identity remains visible at login');
assertContains('public/assets/boostr-mother/johanka-cloud-hotfix.js', '__JOHANKA_CLOUD_RUNTIME__', 'Johanka Cloud runtime has a duplicate-bootstrap guard');
assertContains('public/3d/viewer.js', "format: 'ply'", '3D viewer preserves PLY rendering');
assertContains('public/3d/viewer.js', "format: 'luma'", '3D viewer includes Luma routing');

[
  'public/home/index.html',
  'public/login/index.html',
  'public/manager/leads/index.html',
  'public/partner-dashboard/index.html',
  'public/3d/index.html'
].forEach(checkLocalLinks);

console.log(`\nBOOSTR ecosystem stability checks: ${passes.length} passed, ${failures.length} failed.`);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}
passes.forEach((message) => console.log(`PASS: ${message}`));
