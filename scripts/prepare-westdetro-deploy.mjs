import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "apps/westdetro-landing");
const target = resolve(root, ".deploy/westdetro");
await rm(target, { recursive: true, force: true });
await mkdir(resolve(target, "site/assets"), { recursive: true });
await mkdir(resolve(target, "functions"), { recursive: true });
for (const file of ["index.html", "styles.css", "app.js"]) await cp(resolve(source, file), resolve(target, "site", file));
await cp(resolve(source, "assets"), resolve(target, "site/assets"), { recursive: true });
await cp(resolve(source, "functions"), resolve(target, "functions"), { recursive: true });
await writeFile(resolve(target, "wrangler.jsonc"), `${JSON.stringify({
  name: "westdetro-album",
  compatibility_date: "2026-08-19",
  pages_build_output_dir: "./site"
}, null, 2)}\n`);
console.log(target);
