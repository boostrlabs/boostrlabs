import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = [
  "functions/parking/omni-jr/[plan].js",
  "public/app/parking/omni-jr/index.html",
  "public/parking/omni-jr/qr/index.html"
];
const failures = [];

for (const file of required) {
  if (!existsSync(file)) failures.push(`missing file: ${file}`);
}

const route = required[0];
if (existsSync(route)) {
  const result = spawnSync(process.execPath, ["--check", route], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`syntax failed: ${route}\n${result.stderr || result.stdout}`);
  const source = readFileSync(route, "utf8");
  for (const marker of ["omni_jr_8h", "omni_jr_monthly", "/pay/", "json_extract"]) {
    if (!source.includes(marker)) failures.push(`parking route missing marker: ${marker}`);
  }
}

for (const file of required.slice(1)) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const [index, script] of scripts.entries()) {
    try { new Function(script); }
    catch (error) { failures.push(`inline script ${index + 1} failed in ${file}: ${error.message}`); }
  }
}

const dashboard = required[1];
if (existsSync(dashboard)) {
  const html = readFileSync(dashboard, "utf8");
  for (const marker of ["amount:2500", "mode:'purchase_now'", "mode:'subscription'", "subscription_interval", "omni_jr_parking_v1"]) {
    if (!html.includes(marker)) failures.push(`parking dashboard missing marker: ${marker}`);
  }
}

const qrSheet = required[2];
if (existsSync(qrSheet)) {
  const html = readFileSync(qrSheet, "utf8");
  for (const marker of ["/parking/omni-jr/8h", "/parking/omni-jr/monthly", "quickchart.io/qr"]) {
    if (!html.includes(marker)) failures.push(`QR sheet missing marker: ${marker}`);
  }
}

if (failures.length) {
  console.error("OMNI PARKING HEALTH: FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OMNI PARKING HEALTH: PASS");
