import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const target = resolve(root, ".deploy/nne");
await rm(target, { recursive: true, force: true });
await mkdir(resolve(target, "site"), { recursive: true });
await mkdir(resolve(target, "functions/api"), { recursive: true });
await mkdir(resolve(target, "functions/join"), { recursive: true });
await cp(resolve(root, "apps/nne-community/dist"), resolve(target, "site"), { recursive: true });
await cp(resolve(root, "functions/api/nne"), resolve(target, "functions/api/nne"), { recursive: true });
await cp(resolve(root, "functions/join"), resolve(target, "functions/join"), { recursive: true });
await cp(resolve(root, "functions/_lib"), resolve(target, "functions/_lib"), { recursive: true });
await writeFile(resolve(target, "site/_redirects"), "/* /index.html 200\n");
await writeFile(resolve(target, "wrangler.jsonc"), `${JSON.stringify({
  name: "nne-westdetro",
  compatibility_date: "2026-08-19",
  compatibility_flags: ["nodejs_compat"],
  pages_build_output_dir: "./site",
  vars: { NNE_APP_ORIGIN: "https://nne.westdetro.com" },
  d1_databases: [{ binding: "DB", database_name: "boostr_labs_core", database_id: "3998802e-1829-48b4-91dc-971ecfd4c23d" }],
  r2_buckets: [{ binding: "BOOSTR_ASSETS", bucket_name: "boostr-labs-assets-prod" }]
}, null, 2)}\n`);
console.log(target);
