const b64url = (value) => {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const base64 = (bytes) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

async function jwtAccessToken(env) {
  if (env.NNE_DOCUSIGN_ACCESS_TOKEN) return env.NNE_DOCUSIGN_ACCESS_TOKEN;
  const authBase = env.NNE_DOCUSIGN_AUTH_BASE || "https://account-d.docusign.com";
  const privatePem = String(env.NNE_DOCUSIGN_PRIVATE_KEY || "").replaceAll("\\n", "\n");
  const der = Uint8Array.from(atob(privatePem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const issued = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: env.NNE_DOCUSIGN_INTEGRATION_KEY, sub: env.NNE_DOCUSIGN_USER_ID,
    aud: new URL(authBase).host, iat: issued, exp: issued + 3500, scope: "signature impersonation"
  }));
  const input = `${header}.${payload}`;
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input)));
  const response = await fetch(`${authBase}/oauth/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${input}.${b64url(signature)}` })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "DocuSign OAuth failed");
  return data.access_token;
}

const withoutRestApi = (value) => String(value || "").replace(/\/(?:restapi)?\/?$/, "");

export async function checkDocusignConnection(env) {
  const state = esignProviderState(env);
  if (!state.ready) throw new Error("Faltan credenciales server-to-server de DocuSign.");

  const authBase = String(env.NNE_DOCUSIGN_AUTH_BASE || "https://account-d.docusign.com").replace(/\/$/, "");
  const token = await jwtAccessToken(env);
  const response = await fetch(`${authBase}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || "DocuSign no devolvió la cuenta OAuth.");

  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const account = accounts.find((item) => item.account_id === env.NNE_DOCUSIGN_ACCOUNT_ID);
  const configuredBase = withoutRestApi(env.NNE_DOCUSIGN_BASE_URI || "https://demo.docusign.net/restapi");
  const remoteBase = withoutRestApi(account?.base_uri);
  const accountMatches = Boolean(account);
  const baseUriMatches = Boolean(account && configuredBase === remoteBase);

  let hmacKeyCount = null;
  if (accountMatches) {
    const hmacResponse = await fetch(`${apiBase(env)}/connect/secret`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    if (hmacResponse.ok) {
      const hmacData = await hmacResponse.json().catch(() => ({}));
      hmacKeyCount = Array.isArray(hmacData.secrets) ? hmacData.secrets.length : null;
    }
  }

  return {
    connected: accountMatches && baseUriMatches,
    ready: accountMatches && baseUriMatches && state.webhooks_ready,
    authentication: "jwt",
    environment: new URL(authBase).host.includes("account-d") ? "demo" : "production",
    account_id_match: accountMatches,
    base_uri_match: baseUriMatches,
    webhooks_ready: state.webhooks_ready,
    hmac_key_count: hmacKeyCount,
    callback_url: state.webhooks_ready
      ? `${String(env.NNE_PUBLIC_URL).replace(/\/$/, "")}/api/nne/distribution/docusign-webhook`
      : null
  };
}

export function esignProviderState(env) {
  const ready = Boolean(env.NNE_DOCUSIGN_ACCOUNT_ID && env.NNE_DOCUSIGN_INTEGRATION_KEY && env.NNE_DOCUSIGN_USER_ID && (env.NNE_DOCUSIGN_PRIVATE_KEY || env.NNE_DOCUSIGN_ACCESS_TOKEN));
  const webhooksReady = Boolean(env.NNE_DOCUSIGN_HMAC_SECRET && env.NNE_PUBLIC_URL);
  return { key: "docusign", ready, webhooks_ready: webhooksReady, mode: "external_esign", status: ready ? "connected" : "configuration_required" };
}

const apiBase = (env) => `${String(env.NNE_DOCUSIGN_BASE_URI || "https://demo.docusign.net/restapi").replace(/\/$/, "")}/v2.1/accounts/${encodeURIComponent(env.NNE_DOCUSIGN_ACCOUNT_ID)}`;

export async function sendDocusignEnvelope(env, agreement, pdf, signers, signaturePage = 1) {
  const state = esignProviderState(env);
  if (!state.ready) throw new Error("Faltan las credenciales server-to-server de DocuSign.");
  const token = await jwtAccessToken(env);
  const unique = [...new Map(signers.map((signer) => [signer.participant_email.toLowerCase(), signer])).values()];
  const response = await fetch(`${apiBase(env)}/envelopes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      emailSubject: `Firma tu split sheet: ${agreement.title}`,
      emailBlurb: "Revisa y firma el acuerdo de splits generado por NNE Distribution OS.",
      documents: [{ documentBase64: base64(pdf), name: `${agreement.title} - split sheet v${agreement.version}.pdf`, fileExtension: "pdf", documentId: "1" }],
      recipients: { signers: unique.map((signer, index) => ({
        email: signer.participant_email, name: signer.participant_name, recipientId: String(index + 1), routingOrder: "1",
        tabs: { signHereTabs: [{ documentId: "1", pageNumber: String(signaturePage), xPosition: "48", yPosition: String(440 + index * 38) }] }
      })) },
      ...(env.NNE_DOCUSIGN_HMAC_SECRET && env.NNE_PUBLIC_URL ? { eventNotification: {
        url: `${String(env.NNE_PUBLIC_URL).replace(/\/$/, "")}/api/nne/distribution/docusign-webhook`,
        loggingEnabled: "true", requireAcknowledgment: "true", deliveryMode: "SIM", includeHMAC: "true",
        eventData: { version: "restv2.1", format: "json", includeData: ["recipients"] },
        envelopeEvents: ["sent", "delivered", "completed", "declined", "voided"].map((envelopeEventStatusCode) => ({ envelopeEventStatusCode }))
      } } : {}),
      status: "sent"
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.envelopeId) throw new Error(data.message || data.errorCode || "DocuSign rejected the envelope");
  return data;
}

export async function downloadDocusignEnvelopePdf(env, envelopeId) {
  const token = await jwtAccessToken(env);
  const response = await fetch(`${apiBase(env)}/envelopes/${encodeURIComponent(envelopeId)}/documents/combined`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" } });
  if (!response.ok) throw new Error(`Could not archive executed DocuSign PDF (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function getDocusignEnvelope(env, envelopeId) {
  const token = await jwtAccessToken(env);
  const response = await fetch(`${apiBase(env)}/envelopes/${encodeURIComponent(envelopeId)}?include=recipients`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.errorCode || "Could not read DocuSign envelope");
  return data;
}
