const base = (process.env.BOOSTR_BASE_URL || "https://boostrlabs.pages.dev").replace(/\/$/, "");
const expectedBuild = "omni-self-heal-v1";
const attempts = Math.max(1, Number(process.env.OMNI_SMOKE_ATTEMPTS || 36));
const delayMs = Math.max(1000, Number(process.env.OMNI_SMOKE_DELAY_MS || 10000));
const expected = {
  standard: { amount: 2000, vehicle: "sedan_sport_coupe" },
  large: { amount: 2500, vehicle: "truck_big_suv" },
  monthly: { amount: 15000, vehicle: "monthly" }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function waitForDeployment() {
  let last = "not started";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { response, data } = await jsonRequest(`${base}/api/health/omni-jr`);
      if (response.ok && data.ok && data.build === expectedBuild) {
        console.log(`PASS deployment ready on attempt ${attempt}`);
        return data;
      }
      last = `HTTP ${response.status} build=${data.build || "missing"} error=${data.error || data.message || "unknown"}`;
    } catch (error) {
      last = error.message;
    }
    console.log(`WAIT deployment attempt ${attempt}/${attempts}: ${last}`);
    if (attempt < attempts) await sleep(delayMs);
  }
  throw new Error(`OMNI deployment did not become ready: ${last}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const health = await waitForDeployment();
assert(Object.keys(expected).every((key) => health.plans?.[key]?.ok), "health endpoint reports an unhealthy plan");

for (const [plan, rules] of Object.entries(expected)) {
  const stable = await fetch(`${base}/parking/omni-jr/${plan}`, { redirect: "manual", cache: "no-store" });
  assert([301, 302, 303, 307, 308].includes(stable.status), `${plan}: stable route returned HTTP ${stable.status}`);

  const rawLocation = stable.headers.get("location") || "";
  assert(rawLocation, `${plan}: stable route did not return a location`);
  const checkoutUrl = new URL(rawLocation, base);
  assert(["/omni-jr/checkout", "/omni-jr/checkout/"].includes(checkoutUrl.pathname), `${plan}: redirected to ${checkoutUrl.pathname}`);
  assert(checkoutUrl.searchParams.get("plan") === plan, `${plan}: checkout plan context missing`);
  const id = checkoutUrl.searchParams.get("id") || "";
  assert(id.length >= 20, `${plan}: payment link id missing`);

  const checkout = await fetch(checkoutUrl, { redirect: "follow", cache: "no-store" });
  const checkoutHtml = await checkout.text();
  const finalCheckoutUrl = new URL(checkout.url);
  assert(checkout.status === 200, `${plan}: checkout HTML returned HTTP ${checkout.status} at ${checkout.url}`);
  assert(["/omni-jr/checkout", "/omni-jr/checkout/"].includes(finalCheckoutUrl.pathname), `${plan}: checkout canonicalized to ${finalCheckoutUrl.pathname}`);
  assert(finalCheckoutUrl.searchParams.get("id") === id, `${plan}: payment link id was lost after canonical redirect`);
  assert(finalCheckoutUrl.searchParams.get("plan") === plan, `${plan}: plan was lost after canonical redirect`);
  assert(checkoutHtml.includes('data-build="omni-self-heal-v1"'), `${plan}: current checkout build marker missing`);
  assert(checkoutHtml.includes("OMNI JR PARKING"), `${plan}: OMNI branding missing`);
  assert(!checkoutHtml.includes("Link no disponible"), `${plan}: stale unavailable-link UI detected`);

  const { response: linkResponse, data: linkData } = await jsonRequest(`${base}/api/public/payment-links/${encodeURIComponent(id)}`);
  assert(linkResponse.ok && linkData.ok, `${plan}: payment-link API returned HTTP ${linkResponse.status}`);
  const link = linkData.payment_link || {};
  const metadata = link.metadata || {};
  assert(metadata.operator === "omni_jr", `${plan}: operator metadata is ${metadata.operator || "missing"}`);
  assert(metadata.plan_type === (plan === "monthly" ? "monthly" : "single"), `${plan}: plan type mismatch`);
  assert(metadata.vehicle_class === rules.vehicle, `${plan}: vehicle class mismatch`);
  assert(Number(link.amount_cents) === rules.amount, `${plan}: amount mismatch ${link.amount_cents}`);

  console.log(`PASS ${plan}: ${finalCheckoutUrl.pathname}${finalCheckoutUrl.search}`);
}

console.log(JSON.stringify({ base, ok: true, build: expectedBuild, plans: Object.keys(expected) }, null, 2));
