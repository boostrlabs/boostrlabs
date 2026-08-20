import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";
import { listNneRaffles } from "../../_lib/nne-raffles.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const raffles = await listNneRaffles(env, auth.user.id);
  return jsonOk({
    raffles,
    rules: {
      xpIsSpent: false,
      referralXpEligible: false,
      bonusXpEligible: false,
      staffEligible: false
    }
  });
}
