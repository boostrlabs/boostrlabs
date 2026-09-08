import { clean, jsonError, jsonOk, onOptions } from "../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../_lib/nne-distribution.js";
import { checkDocusignConnection } from "../../../_lib/nne-esign-provider.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return jsonError("nne_distribution_admin_required", "Solo NNE Admin puede probar proveedores externos.", 403);
  }

  try {
    return jsonOk({ provider: await checkDocusignConnection(env), checked_at: new Date().toISOString() });
  } catch (error) {
    return jsonError(
      "nne_distribution_docusign_health_failed",
      clean(error?.message, 300) || "No pudimos verificar DocuSign.",
      502
    );
  }
}
