import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { QuestCard } from "../components/QuestCard";
import { feedService } from "../services/feed";
import { rewardsService } from "../services/rewards";
import type { FeedItem, Reward } from "../types";
import { formatRelativeDate } from "../services/api";

const useApp = () => useOutletContext<AppOutletContext>();

export function HomePage() {
  const { dashboard, openQuest } = useApp();
  const completed = dashboard.quests.filter((quest) => quest.status === "completed").length;
  const percentage = dashboard.quests.length
    ? Math.round((completed / dashboard.quests.length) * 100)
    : 0;
  const xpRemaining = Math.max(0, dashboard.user.xpToNextLevel - dashboard.user.xpInLevel);

  return (
    <>
      <section className="hero-grid">
        <article className="card balance-card">
          <div className="eyebrow">Balance disponible</div>
          <div className="balance">
            {dashboard.user.credits.toLocaleString()}<span>NNE Credits</span>
          </div>
          <div className="metric-row">
            <div><small>Streak</small><strong>🔥 {dashboard.user.streakDays} días</strong></div>
            <div><small>NNE Score</small><strong>{dashboard.user.nneScore} / 100</strong></div>
            <div><small>Level</small><strong>{dashboard.user.level}</strong></div>
          </div>
        </article>
        <article className="card level-card">
          <div className="eyebrow">Progreso</div>
          <div
            className="level-ring"
            style={{ background: `conic-gradient(var(--gold) 0 ${dashboard.user.xpInLevel / 10}%, #222 ${dashboard.user.xpInLevel / 10}%)` }}
          >
            <div><strong>{dashboard.user.level}</strong><span>LEVEL</span></div>
          </div>
          <p>{xpRemaining} XP para llegar al nivel {dashboard.user.level + 1}</p>
        </article>
      </section>

      <div className="section-heading"><h2>Quests activas</h2></div>
      <section className="quest-grid">
        {dashboard.quests.slice(0, 4).map((quest) => (
          <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />
        ))}
      </section>
      <article className="card progress-card">
        <div>
          <strong>{completed} de {dashboard.quests.length} quests completadas</strong>
          <p>Tu consistencia construye el score, el nivel y el acceso.</p>
        </div>
        <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
        <strong>{percentage}%</strong>
      </article>
    </>
  );
}

export function QuestsPage() {
  const { dashboard, openQuest } = useApp();
  return (
    <>
      <div className="section-heading"><h2>Quests disponibles</h2></div>
      <section className="quest-grid">
        {dashboard.quests.map((quest) => <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />)}
      </section>
      {dashboard.quests.length === 0 && <div className="empty-state">Nuevas quests están en camino.</div>}
    </>
  );
}

export function FeedPage() {
  const { dashboard } = useApp();
  const [items, setItems] = useState<FeedItem[]>(dashboard.feed);
  useEffect(() => {
    feedService.list().then(setItems).catch(() => undefined);
  }, []);
  return (
    <>
      <div className="section-heading"><h2>Actividad de la comunidad</h2></div>
      <section className="feed-list">
        {items.map((item) => (
          <article className="feed-item" key={item.id}>
            <span />
            <div><strong>{item.text}</strong><small>{formatRelativeDate(item.createdAt)}</small></div>
          </article>
        ))}
      </section>
      {items.length === 0 && <div className="empty-state">La primera señal puede ser tuya.</div>}
    </>
  );
}

export function RewardsPage() {
  const { dashboard, refreshDashboard, showToast } = useApp();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [busyId, setBusyId] = useState("");
  const load = () => rewardsService.list().then((result) => setRewards(result.rewards));
  useEffect(() => { void load(); }, []);

  const redeem = async (reward: Reward) => {
    setBusyId(reward.id);
    try {
      await rewardsService.redeem(reward.id);
      await Promise.all([load(), refreshDashboard()]);
      showToast(`${reward.name} solicitado.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "No pudimos completar el canje.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <div className="section-heading">
        <h2>Rewards</h2><span className="balance-pill">{dashboard.user.credits.toLocaleString()} Credits</span>
      </div>
      <section className="reward-grid">
        {rewards.map((reward) => {
          const levelLocked = dashboard.user.level < reward.minimumLevel;
          const creditLocked = dashboard.user.credits < reward.costCredits;
          const locked = levelLocked || creditLocked || reward.remaining === 0;
          return (
            <article className={`card reward-card ${locked ? "locked" : ""}`} key={reward.id}>
              <div className="reward-art">{reward.icon}</div>
              <h3>{reward.name}</h3><p>{reward.description}</p>
              <footer>
                <strong>{reward.costCredits.toLocaleString()} Credits</strong>
                <button disabled={locked || busyId === reward.id} onClick={() => void redeem(reward)}>
                  {levelLocked ? `Nivel ${reward.minimumLevel}` : creditLocked ? "Sin balance" : busyId === reward.id ? "Procesando…" : "Canjear"}
                </button>
              </footer>
            </article>
          );
        })}
      </section>
    </>
  );
}

export function ProfilePage() {
  const { dashboard, showToast } = useApp();
  const referralUrl = useMemo(
    () => dashboard.referralCode
      ? `${window.location.origin}${import.meta.env.BASE_URL}signup?ref=${encodeURIComponent(dashboard.referralCode)}`
      : "",
    [dashboard.referralCode]
  );
  return (
    <>
      <article className="card profile-card">
        <div className="profile-avatar">{dashboard.user.initials}</div>
        <div>
          <div className="eyebrow">{dashboard.user.title}</div>
          <h2>{dashboard.user.name}</h2>
          <p>{dashboard.user.handle} · NNE Community</p>
          <div className="profile-stats">
            <div><small>Level</small><strong>{dashboard.user.level}</strong></div>
            <div><small>Credits</small><strong>{dashboard.user.credits.toLocaleString()}</strong></div>
            <div><small>Quests</small><strong>{dashboard.user.completedQuestCount}</strong></div>
            <div><small>Streak</small><strong>{dashboard.user.streakDays} días</strong></div>
          </div>
        </div>
      </article>
      <article className="card referral-card">
        <div><div className="eyebrow">Tu señal se expande</div><h2>Invita a un artista.</h2></div>
        <p>Recibes créditos cuando complete su registro con tu enlace.</p>
        <button
          className="primary-button"
          disabled={!referralUrl}
          onClick={() => navigator.clipboard.writeText(referralUrl).then(() => showToast("Enlace copiado."))}
        >
          Copiar enlace
        </button>
      </article>
    </>
  );
}
