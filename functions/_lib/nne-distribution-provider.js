import { clean } from "./nne-api.js";

const sandboxCapabilities = {
  catalog_delivery: true,
  takedowns: true,
  royalty_import: true,
  upc_assignment: false,
  isrc_assignment: false
};

export function distributionProviderState(env, providerKey = "nne_sandbox") {
  const key = clean(providerKey || "nne_sandbox", 80);
  if (key === "nne_sandbox") {
    return {
      key,
      name: "NNE Sandbox",
      mode: "sandbox",
      status: "sandbox",
      capabilities: sandboxCapabilities,
      ready: true
    };
  }
  const endpoint = clean(env.NNE_DISTRIBUTION_PROVIDER_ENDPOINT, 500);
  return {
    key,
    name: clean(env.NNE_DISTRIBUTION_PROVIDER_NAME || key, 120),
    mode: "white_label",
    status: endpoint && env.NNE_DISTRIBUTION_PROVIDER_TOKEN ? "connected" : "configuration_required",
    capabilities: {
      catalog_delivery: true,
      takedowns: false,
      royalty_import: true,
      upc_assignment: false,
      isrc_assignment: false
    },
    ready: Boolean(endpoint && env.NNE_DISTRIBUTION_PROVIDER_TOKEN)
  };
}

export async function deliverDistributionPackage(env, { release, manifest, idempotencyKey }) {
  const provider = distributionProviderState(env, release.provider_key);
  if (provider.mode === "sandbox") {
    return {
      accepted: true,
      environment: "sandbox",
      provider_release_id: `NNE-SBX-${release.id.slice(-8).toUpperCase()}`,
      stores: release.stores
    };
  }
  if (!provider.ready) {
    const error = new Error("distribution_provider_not_configured");
    error.code = "distribution_provider_not_configured";
    throw error;
  }
  const response = await fetch(env.NNE_DISTRIBUTION_PROVIDER_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.NNE_DISTRIBUTION_PROVIDER_TOKEN}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(manifest)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(clean(body?.message || `Provider respondió HTTP ${response.status}.`, 500));
    error.code = "distribution_provider_rejected";
    error.providerResponse = body;
    throw error;
  }
  return {
    accepted: true,
    environment: "production",
    provider_release_id: clean(body?.provider_release_id || body?.id, 180),
    provider_response: body
  };
}
