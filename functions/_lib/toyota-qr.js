import { clean } from "./api.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const signingSecret = (env) => clean(env.TOYOTA_QR_SECRET, 500);

const hmac = async (secret, value) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
};

const equalBytes = (left, right) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
};

const randomCode = () => {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return `TOH-${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

export async function createToyotaPass(env, lead) {
  const secret = signingSecret(env);
  if (!secret) throw new Error("toyota_qr_secret_missing");

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 72 * 60 * 60 * 1000);
  const lastInitial = clean(lead.last_name, 80).slice(0, 1).toUpperCase();
  const phoneDigits = clean(lead.phone, 40).replace(/\D/g, "");
  const payload = {
    v: 1,
    code: randomCode(),
    guest: `${clean(lead.first_name, 80)}${lastInitial ? ` ${lastInitial}.` : ""}`,
    phone4: phoneDigits.slice(-4),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    campaign: "TOYOTA OF HOLLYWOOD X LA CHIQUI",
    vehicle: "2026 Toyota Tacoma SR5"
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(secret, body));
  return { ...payload, token: `${body}.${signature}` };
}

export async function verifyToyotaPass(env, token) {
  const secret = signingSecret(env);
  const value = clean(token, 3000);
  if (!secret || !value.includes(".")) return { ok: false, reason: "invalid" };

  try {
    const [body, signatureText, extra] = value.split(".");
    if (!body || !signatureText || extra) return { ok: false, reason: "invalid" };
    const expected = await hmac(secret, body);
    const supplied = fromBase64Url(signatureText);
    if (!equalBytes(expected, supplied)) return { ok: false, reason: "invalid" };

    const payload = JSON.parse(decoder.decode(fromBase64Url(body)));
    if (payload?.v !== 1 || !payload?.code || !payload?.expiresAt) {
      return { ok: false, reason: "invalid" };
    }

    const expired = Date.now() > Date.parse(payload.expiresAt);
    return { ok: true, expired, payload };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
