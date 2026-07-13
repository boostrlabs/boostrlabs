import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "functions/_lib/documents.js",
  "functions/_lib/payment-receipts.js",
  "functions/api/documents.js",
  "functions/api/documents/[id].js",
  "functions/api/documents/[id]/events.js",
  "functions/api/public/documents/[slug].js",
  "functions/api/public/assets/[id].js",
  "functions/d/[slug].js",
  "public/app/documents/index.html",
  "migrations/0015_smart_documents.sql"
];

const jsFiles = requiredFiles.filter((file) => file.endsWith(".js"));
const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file: ${file}`);
}

for (const file of jsFiles) {
  if (!existsSync(file)) continue;
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`syntax failed: ${file}\n${result.stderr || result.stdout}`);
}

const dashboardPath = "public/app/documents/index.html";
if (existsSync(dashboardPath)) {
  const html = readFileSync(dashboardPath, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const [index, script] of scripts.entries()) {
    try {
      new Function(script);
    } catch (error) {
      failures.push(`inline script ${index + 1} failed in ${dashboardPath}: ${error.message}`);
    }
  }
  for (const required of ["/api/documents", "/app/documents", "Crear Smart Document", "data-type=\"invoice\""]) {
    if (!html.includes(required)) failures.push(`dashboard missing marker: ${required}`);
  }
}

const modulesPath = "public/modules/index.html";
if (existsSync(modulesPath)) {
  const html = readFileSync(modulesPath, "utf8");
  if (!html.includes("/app/documents")) failures.push("module deck missing Smart Documents route");
  if (!html.includes("BOOSTR Payments")) failures.push("module deck missing consolidated Payments label");
}

const migrationPath = "migrations/0015_smart_documents.sql";
if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, "utf8");
  for (const table of ["smart_documents", "smart_document_events"]) {
    if (!sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) failures.push(`migration missing table: ${table}`);
  }
}

const receiptHelperPath = "functions/_lib/payment-receipts.js";
if (existsSync(receiptHelperPath)) {
  const source = readFileSync(receiptHelperPath, "utf8");
  for (const marker of ["resolvePaymentImage", "publicProductImageUrl", "/api/public/assets/", "product_image"]) {
    if (!source.includes(marker)) failures.push(`receipt helper missing product image marker: ${marker}`);
  }
}

const publicAssetPath = "functions/api/public/assets/[id].js";
if (existsSync(publicAssetPath)) {
  const source = readFileSync(publicAssetPath, "utf8");
  for (const marker of ["product-media", "quick_publish_v4", "cache-control", "public, max-age=31536000"]) {
    if (!source.includes(marker)) failures.push(`public product asset route missing marker: ${marker}`);
  }
}

const publicDocumentPath = "functions/api/public/documents/[slug].js";
if (existsSync(publicDocumentPath)) {
  const source = readFileSync(publicDocumentPath, "utf8");
  if (!source.includes("syncInteractiveReceipt")) failures.push("public receipt route does not refresh interactive receipt data");
}

if (failures.length) {
  console.error("SMART DOCUMENTS HEALTH: FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SMART DOCUMENTS HEALTH: PASS (${requiredFiles.length} required files, ${jsFiles.length} JS syntax checks)`);
