import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { ReferralPromo } from "../components/ReferralPromo";
import { formatNne } from "../services/api";

export function ProfilePage() {
  const { dashboard } = useOutletContext<AppOutletContext>();

  return (
    <>
      <article className="card profile-card">
        <div className="profile-avatar">{dashboard.user.initials}</div>
        <div>
          <div className="eyebrow">{dashboard.user.title}</div>
          <h2>@{dashboard.user.username}</h2>
          <p>{dashboard.user.name} · NNE × WESTDETRO · Season 001</p>
          <div className="profile-stats">
            <div><small>Level</small><strong>{dashboard.user.level}</strong></div>
            <div><small>Credits</small><strong>{formatNne(dashboard.user.credits)}</strong></div>
            <div><small>Chambas</small><strong>{dashboard.user.completedQuestCount}</strong></div>
            <div><small>Streak</small><strong>{dashboard.user.streakDays} días</strong></div>
          </div>
        </div>
      </article>

      <ReferralPromo referralCode={dashboard.referralCode} reward={dashboard.referralReward} />

      <article className="card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Cómo funciona</div>
        <h3>3 NNE para quien invita + 2 NNE para quien entra.</h3>
        <p>La recompensa se activa cuando la nueva cuenta entra con tu enlace y es aprobada. El bono de +2 NNE del invitado depende de que todavía queden cupos de PRIMEROS50.</p>
      </article>
    </>
  );
}
