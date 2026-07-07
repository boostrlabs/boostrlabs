# BOOSTR Labs v0.2 Frontend Deploy Fix

This ZIP is an overlay patch for the existing `boostrlabs/boostrlabs` repo.

It does not replace the app source. It adds the missing deployment/build configuration so Cloudflare Pages builds the Vite app and publishes `dist` instead of serving the raw source files.

## What was wrong

The live page was loading `index.html`, but the body only had:

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

That works in Vite dev/build mode, but if Cloudflare publishes the repo root directly, the browser tries to run `/src/main.js` raw. That file imports CSS and uses Vite environment behavior, so the app can fail before rendering anything into `#app`.

## Files added/changed

- `wrangler.toml` — tells Cloudflare Pages the output folder is `dist`.
- `vite.config.js` — makes Vite build behavior explicit.
- `package.json` — bumps project to v0.2.0, keeps the Vite build script, adds Node engine.
- `.node-version` and `.nvmrc` — signal modern Node version for the build environment.
- `public/_redirects` — supports SPA routes like `/quote`, `/app`, `/admin`, `/login`, `/partner/...`.
- `public/_headers` — basic safe static headers.

## Apply locally

1. Unzip this patch.
2. Copy all files into the root of the local `boostrlabs/boostrlabs` repo.
3. Allow overwrite for `package.json` if prompted.
4. Run:

```bash
npm install
npm run build
```

5. If the build passes, commit:

```bash
git add .
git commit -m "Fix Cloudflare Pages Vite frontend deploy"
git push origin main
```

## Cloudflare Pages settings

In Cloudflare Pages, confirm:

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

Then trigger a new deployment.

## Expected result

Cloudflare should publish the compiled files from `dist`. The live site should no longer be a blank white page.
