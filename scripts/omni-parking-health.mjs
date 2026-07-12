import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = [
  "functions/parking/omni-jr/[plan].js",
  "functions/api/smart-parking/provision.js",
  "public/app/parking/index.html",
  "public/app/parking/omni-jr/index.html",
  "public/parking/omni-jr/qr/index.html"
];
const failures = [];

for (const file of required) {
  if (!existsSync(file)) failures.push(`missing file: ${file}`);
}

for (const file of required.slice(0, 2)) {
  if (!existsSync(file)) continue;
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`syntax failed: ${file}\n${result.stderr || result.stdout}`);
}

const route = required[0];
if (existsSync(route)) {
  const source = readFileSync(route, "utf8");
  for (const marker of ["omni_jr_8h", "omni_jr_monthly", "BOOSTR Smart Parking", "workspace_id = ?", "/pay/"]) {
    if (!source.includes(marker)) failures.push(`parking route missing marker: ${marker}`);
  }
}

const provision = required[1];
if (existsSync(provision)) {
  const source = readFileSync(provision, "utf8");
  for (const marker of ["omni-jr-parking", "archiveMisassignedParking", "ensureMembership", "boostr_smart_parking_v1"]) {
    if (!source.includes(marker)) failures.push(`Smart Parking provision missing marker: ${marker}`);
  }
}

for (const file of required.slice(2)) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const [index, script] of scripts.entries()) {
    try { new Function(script); }
    catch (error) { failures.push(`inline script ${index + 1} failed in ${file}: ${error.message}`); }
  }
}

const dashboard = required[2];
if (existsSync(dashboard)) {
  const html = readFileSync(dashboard, "utf8");
  for (const marker of ["BOOSTR SMART PARKING", "/api/smart-parking/provision", "OMNI JR Parking", "mode:'subscription'", "subscription_interval"]) {
    if (!html.includes(marker)) failures.push(`Smart Parking dashboard missing marker: ${marker}`);
  }
}

const alias = required[3];
if (existsSync(alias)) {
  const html = readFileSync(alias, "utf8");
  if (!html.includes("/app/parking/?operator=omni-jr")) failures.push("OMNI dashboard alias missing redirect");
}

const qrSheet = required[4];
if (existsSync(qrSheet)) {
  const html = readFileSync(qrSheet, "utf8");
  for (const marker of ["BOOSTR SMART PARKING", "/parking/omni-jr/8h", "/parking/omni-jr/monthly", "quickchart.io/qr"]) {
    if (!html.includes(marker)) failures.push(`QR sheet missing marker: ${marker}`);
  }
}

if (failures.length) {
  console.error("BOOSTR SMART PARKING HEALTH: FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("BOOSTR SMART PARKING HEALTH: PASS");
