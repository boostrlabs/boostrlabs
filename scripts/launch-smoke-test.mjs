#!/usr/bin/env node

const baseUrl = (process.env.BOOSTR_BASE_URL || "http://127.0.0.1:8788").replace(/\/$/, "");
const runId = (process.env.BOOSTR_TEST_RUN_ID || Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 12);
const results = [];
let authToken = "";
let createdUser = null;

const env = (name) => String(process.env[name] || "").trim();
const mark = (name, status, detail = "") => {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : "SKIP";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
};

const withRun = (value) => value.includes("{run}") ? value.replaceAll("{run}", runId) : value;
const testEmail = () => {
  const email = env("BOOSTR_TEST_EMAIL");
  if (!email) return "";
  if (email.includes("{run}")) return withRun(email);
  const at = email.indexOf("@");
  return at === -1 ? email : `${email.slice(0, at)}+${runId}${email.slice(at)}`;
};

const data = {
  email: testEmail(),
  username: withRun(env("BOOSTR_TEST_USERNAME") || `boostrtest{run}`).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 31),
  phone: env("BOOSTR_TEST_PHONE") ? withRun(env("BOOSTR_TEST_PHONE")) : "",
  password: env("BOOSTR_TEST_PASSWORD"),
  workspace: withRun(env("BOOSTR_TEST_WORKSPACE") || `BOOSTR Smoke Test {run}`),
  code: env("BOOSTR_TEST_SECRET_CODE")
};

async function call(path, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) };
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { res, json };
}

async function check(name, fn) {
  try { await fn(); } catch (error) { mark(name, "FAIL", error?.message || String(error)); }
}

await check("GET /api/health", async () => {
  const { res, json } = await call("/api/health");
  if (!res.ok || json.ok === false) throw new Error(`HTTP ${res.status}`);
  mark("GET /api/health", "PASS", json.version || "ok");
});

await check("GET /api/readiness", async () => {
  const { res, json } = await call("/api/readiness");
  if (!res.ok || json.ok === false) throw new Error(`HTTP ${res.status}`);
  mark("GET /api/readiness", "PASS", json.status || "ok");
});

await check("POST /api/invite-codes/validate", async () => {
  if (!data.code) return mark("POST /api/invite-codes/validate", "SKIPPED", "BOOSTR_TEST_SECRET_CODE missing");
  const { res, json } = await call("/api/invite-codes/validate", { method: "POST", body: { code: data.code, source: "launch_smoke_test" } });
  if (!res.ok || json.ok === false) throw new Error(`HTTP ${res.status}`);
  if (!json.valid) throw new Error("code invalid");
  mark("POST /api/invite-codes/validate", "PASS", "valid");
});

await check("GET /api/signup/check-username", async () => {
  const { res, json } = await call(`/api/signup/check-username?username=${encodeURIComponent(data.username)}`);
  if (!res.ok || json.ok === false) throw new Error(`HTTP ${res.status}`);
  mark("GET /api/signup/check-username", "PASS", json.available ? "available" : "unavailable");
});

await check("POST /api/signup", async () => {
  const missing = ["BOOSTR_TEST_EMAIL", "BOOSTR_TEST_PASSWORD"].filter((key) => !env(key));
  if (missing.length) return mark("POST /api/signup", "SKIPPED", `missing ${missing.join(", ")}`);
  const { res, json } = await call("/api/signup", { method: "POST", body: {
    display_name: "BOOSTR Smoke Test",
    username: data.username,
    email: data.email,
    phone: data.phone,
    password: data.password,
    language: "en",
    workspace_name: data.workspace,
    business_type: "client",
    default_persona: "client",
    secret_boostr_code: data.code,
    source: "launch_smoke_test"
  }});
  if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
  if (!json.token || !json.workspace?.id || !json.persona?.id) throw new Error("missing token/workspace/persona");
  authToken = json.token;
  createdUser = json.user;
  mark("POST /api/signup", "PASS", `${createdUser?.username || data.username}`);
});

for (const [label, identifier] of [["email", data.email], ["username", data.username], ["phone", data.phone]]) {
  await check(`POST /api/session by ${label}`, async () => {
    if (!createdUser || !identifier || !data.password) return mark(`POST /api/session by ${label}`, "SKIPPED", "signup skipped or identifier missing");
    const { res, json } = await call("/api/session", { method: "POST", body: { identifier, password: data.password } });
    if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
    if (!json.token) throw new Error("missing token");
    authToken = json.token;
    mark(`POST /api/session by ${label}`, "PASS", "session");
  });
}

await check("GET /api/dashboard", async () => {
  if (!authToken) return mark("GET /api/dashboard", "SKIPPED", "no auth token");
  const { res, json } = await call("/api/dashboard");
  if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
  if (!json.workspace?.id || !Array.isArray(json.cards)) throw new Error("missing workspace/cards");
  mark("GET /api/dashboard", "PASS", `${json.cards.length} cards`);
});

const failed = results.filter((item) => item.status === "FAIL");
const passed = results.filter((item) => item.status === "PASS");
const skipped = results.filter((item) => item.status === "SKIPPED");
console.log("\nBOOSTR Launch Smoke Test Summary");
console.log(`Base URL: ${baseUrl}`);
console.log(`PASS: ${passed.length}`);
console.log(`FAIL: ${failed.length}`);
console.log(`SKIPPED: ${skipped.length}`);
if (failed.length) process.exit(1);
