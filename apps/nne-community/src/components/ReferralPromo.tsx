import type { ReferralReward } from "../types";
import { formatNne } from "../services/api";

interface ReferralPromoProps {
  referralCode: string | null;
  reward: ReferralReward;
  compact?: boolean;
}

export function ReferralPromo({ referralCode, reward, compact = false }: ReferralPromoProps) {
  const referralUrl = referralCode
    ? `${window.location.origin}${import.meta.env.BASE_URL}signup?ref=${encodeURIComponent(referralCode)}&promo=PRIMEROS50`
    : "";
  const copy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
  };

  return (
    <article className="card referral-card" style={compact ? { padding: 16, marginTop: 18 } : undefined}>
      <div>
        <div className="eyebrow">CHAMBA PROMOTED</div>
        <h3 style={{ margin: "6px 0" }}>Refiere a un amigo NNE y ganen los dos.</h3>
        <p style={{ margin: 0 }}>
          Tú ganas <strong>+{formatNne(reward.credits)} NNE</strong> cuando aprueben su cuenta. Tu invitado recibe <strong>+2 NNE</strong> si todavía quedan cupos de PRIMEROS50.
        </p>
      </div>
      <button className="primary-button" disabled={!referralUrl} onClick={() => void copy()}>
        Copiar mi enlace
      </button>
    </article>
  );
}
