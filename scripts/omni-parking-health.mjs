import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = [
  "functions/parking/omni-jr/[plan].js",
  "functions/api/smart-parking/provision.js",
  "public/app/parking/index.html",
  "public/app/parking/omni-jr/index.html",
  "public/parking/omni-jr/index.html",
  "public/parking/omni-jr/qr/index.html",
  "public/pay/index.html"
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
  for (const marker of ["omni_jr_standard_8h", "omni_jr_large_8h", "amount: 2000", "amount: 2500", "checkout_theme", "/pay/"]) {
    if (!source.includes(marker)) failures.push(`parking route missing marker: ${marker}`);
  }
}

const provision = required[1];
if (existsSync(provision)) {
  const source = readFileSync(provision, "utf8");
  for (const marker of ["omni-jr-parking", "archiveMisassignedParking", "ensureMembership", "boostr_smart_parking_v2", "sedan_sport_coupe", "truck_big_suv"]) {
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

const moduleDashboard = required[2];
if (existsSync(moduleDashboard)) {
  const html = readFileSync(moduleDashboard, "utf8");
  for (const marker of ["BOOSTR SMART PARKING", "$20 / $25", "/api/smart-parking/provision", "/app/parking/omni-jr/"]) {
    if (!html.includes(marker)) failures.push(`Smart Parking dashboard missing marker: ${marker}`);
  }
}

const customOs = required[3];
if (existsSync(customOs)) {
  const html = readFileSync(customOs, "utf8");
  for (const marker of ["THEME WHITE", "OMNI JR PARKING", "$20", "$25", "/api/smart-parking/provision"]) {
    if (!html.includes(marker)) failures.push(`OMNI Custom OS missing marker: ${marker}`);
  }
}

const publicSelector = required[4];
if (existsSync(publicSelector)) {
  const html = readFileSync(publicSelector, "utf8");
  for (const marker of ["Sedan / Sport / Coupe", "Truck / Big SUV", "/parking/omni-jr/standard", "/parking/omni-jr/large"]) {
    if (!html.includes(marker)) failures.push(`OMNI selector missing marker: ${marker}`);
  }
}

const qrSheet = required[5];
if (existsSync(qrSheet)) {
  const html = readFileSync(qrSheet, "utf8");
  for (const marker of ["$20", "$25", "/parking/omni-jr/", "/parking/omni-jr/monthly", "quickchart.io/qr"]) {
    if (!html.includes(marker)) failures.push(`QR sheet missing marker: ${marker}`);
  }
}

const smartPay = required[6];
if (existsSync(smartPay)) {
  const html = readFileSync(smartPay, "utf8");
  for (const marker of ["theme-light", "checkout_theme", "vehicle_class", "OMNI JR Custom OS"]) {
    if (!html.includes(marker)) failures.push(`Smart Pay custom branding missing marker: ${marker}`);
  }
}

if (failures.length) {
  console.error("BOOSTR SMART PARKING HEALTH: FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("BOOSTR SMART PARKING HEALTH: PASS");