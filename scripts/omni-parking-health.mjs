import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const serverFiles = [
  "functions/_lib/smart-parking.js",
  "functions/_lib/omni-parking.js",
  "functions/api/public/qr.js",
  "functions/api/public/payment-links/[id].js",
  "functions/api/public/payment-links/[id]/checkout.js",
  "functions/api/public/omni-jr/plan/[plan].js",
  "functions/api/public/stripe/session.js",
  "functions/api/public/stripe/webhook.js",
  "functions/api/health/omni-jr.js",
  "functions/api/smart-parking/provision.js",
  "functions/api/smart-parking/omni-jr/manager-signup.js",
  "functions/api/smart-parking/omni-jr/verify.js",
  "functions/parking/omni-jr/[plan].js",
  "functions/parking/omni-jr/ticket/[token].js",
  "functions/pay/[id].js"
];

const htmlFiles = [
  "public/app/parking/index.html",
  "public/app/parking/omni-jr/index.html",
  "public/app/parking/omni-jr/manager/index.html",
  "public/join/omni-jr/maikfine/index.html",
  "public/parking/omni-jr/index.html",
  "public/parking/omni-jr/qr/index.html",
  "public/pay/index.html",
  "public/omni-jr/checkout-v3/index.html"
];

const supportFiles = [
  "scripts/omni-parking-live-smoke.mjs",
  "public/assets/omni-jr/omni-jr-logo-black.svg"
];
const failures = [];

for (const file of [...serverFiles, ...htmlFiles, ...supportFiles]) {
  if (!existsSync(file)) failures.push(`missing file: ${file}`);
}

for (const file of [...serverFiles, "scripts/omni-parking-live-smoke.mjs"]) {
  if (!existsSync(file)) continue;
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`syntax failed: ${file}\n${result.stderr || result.stdout}`);
}

for (const file of htmlFiles) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  scripts.forEach((script, index) => {
    try { new Function(script); }
    catch (error) { failures.push(`inline script ${index + 1} failed in ${file}: ${error.message}`); }
  });
}

const checks = {
  "functions/_lib/smart-parking.js": ["parking_sessions", "syncParkingSession", "lookupParkingSession", "verification_token", "normalizePlate"],
  "functions/_lib/omni-parking.js": ["OMNI_PLANS", "ensureOmniCoreSchema", "ALTER TABLE", "ensureOmniPlan", "boostr_smart_parking_v4", "omni_jr_standard_8h", "omni_jr_large_8h", "omni_jr_monthly"],
  "functions/api/public/payment-links/[id].js": ["normalizeOmniMetadata", "workspace_slug", "operator: \"omni_jr\""],
  "functions/api/public/payment-links/[id]/checkout.js": ["parking_plate_required", "normalizePlate", "normalizeOmniMetadata", "workspace_slug"],
  "functions/api/public/omni-jr/plan/[plan].js": ["omni-self-heal-v3", "/omni-jr/checkout-v3/?id=", "ensureOmniPlan"],
  "functions/api/health/omni-jr.js": ["omni-self-heal-v3", "/omni-jr/checkout-v3/?id=", "workspace_slug"],
  "functions/api/smart-parking/provision.js": ["omni-self-heal-v3", "/omni-jr/checkout-v3/?id=", "ensureOmniPlan"],
  "functions/parking/omni-jr/[plan].js": ["/omni-jr/checkout-v3/?id=", "ensureOmniPlan", "plan="],
  "functions/parking/omni-jr/ticket/[token].js": ["PARKING ACTIVO", "/api/public/qr", "omni-jr-logo-black.svg"],
  "functions/pay/[id].js": ["/omni-jr/checkout-v3/", "omniPlanKey", "activeLink", "target.searchParams.set(\"plan\", plan)"],
  "public/parking/omni-jr/index.html": ["Sedan / Sport / Coupe", "Truck / Big SUV", "$150 / mes"],
  "public/parking/omni-jr/qr/index.html": ["$20", "$25", "$150 / MES", "/api/public/qr"],
  "public/omni-jr/checkout-v3/index.html": ["data-build=\"omni-self-heal-v3\"", "repairPlan", "/api/public/omni-jr/plan/", "Powered by BOOSTR Labs", "plate:$('plate')"],
  "scripts/omni-parking-live-smoke.mjs": ["omni-self-heal-v3", "/api/health/omni-jr", "/omni-jr/checkout-v3", "Link no disponible"],
  "public/assets/omni-jr/omni-jr-logo-black.svg": ["OMNI JR Parking — official logo", "viewBox=\"0 0 1254 1254\""]
};

for (const [file, markers] of Object.entries(checks)) {
  if (!existsSync(file)) continue;
  const source = readFileSync(file, "utf8");
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${file} missing marker: ${marker}`);
  }
}

try {
  const { onRequestGet } = await import("../functions/pay/[id].js");
  const legacyId = "913ccc9a-e7fe-4dfc-8310-a70b47d10fb8";
  const request = { url: `https://boostrlabs.pages.dev/pay/${legacyId}` };
  const activeOmniRow = {
    title: "OMNI JR PARKING · SEDAN / SPORT / COUPE",
    metadata_json: JSON.stringify({ operator: "omni_jr", parking_code: "omni_jr_standard_8h" }),
    product_metadata_json: "{}",
    workspace_name: "OMNI JR Parking",
    workspace_slug: "omni-jr-parking"
  };
  const dbReturning = (row) => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) });
  const active = await onRequestGet({ request, env: { DB: dbReturning(activeOmniRow) }, params: { id: legacyId } });
  if (active.headers.get("location") !== `/omni-jr/checkout-v3/?id=${legacyId}&plan=standard`) {
    failures.push(`active legacy OMNI redirect incorrect: ${active.headers.get("location")}`);
  }
  const missing = await onRequestGet({ request, env: { DB: dbReturning(null) }, params: { id: legacyId } });
  if (missing.headers.get("location") !== "/parking/omni-jr/standard") {
    failures.push(`missing legacy OMNI fallback incorrect: ${missing.headers.get("location")}`);
  }
} catch (error) {
  failures.push(`OMNI redirect runtime test failed: ${error.message}`);
}

try {
  const { getOmniPlan } = await import("../functions/_lib/omni-parking.js");
  if (getOmniPlan("standard")?.amount !== 2000) failures.push("standard plan catalog mismatch");
  if (getOmniPlan("large")?.amount !== 2500) failures.push("large plan catalog mismatch");
  if (getOmniPlan("monthly")?.amount !== 15000) failures.push("monthly plan catalog mismatch");
  if (getOmniPlan("invalid") !== null) failures.push("invalid plan should resolve to null");
} catch (error) {
  failures.push(`OMNI plan catalog runtime test failed: ${error.message}`);
}

if (failures.length) {
  console.error("BOOSTR SMART PARKING HEALTH: FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("BOOSTR SMART PARKING HEALTH: PASS");
