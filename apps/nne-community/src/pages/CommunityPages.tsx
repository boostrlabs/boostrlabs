import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { QuestCard } from "../components/QuestCard";
import { feedService } from "../services/feed";
import { rewardsService } from "../services/rewards";
import { questsService } from "../services/quests";
import type { FeedItem, Quest, Reward } from "../types";
import { formatNne, formatRelativeDate } from "../services/api";
import { VisualMedia } from "../components/VisualMedia";
import { nneAssets, rewardAsset } from "../config/assets";

const useApp = () => useOutletContext<AppOutletContext>();

export function HomePage() {
  const { dashboard, openQuest } = useApp();
  const completed = dashboard.quests.filter((quest) => quest.status === "completed").length;
  const percentage = dashboard.quests.length ? Math.round((completed / dashboard.quests.length) * 100) : 0;
  const xpRemaining = Math.max(0, dashboard.user.xpToNextLevel - dashboard.user.xpInLevel);

  return (
    <>
      <article className="card season-hero">
        <div className="season-hero-copy">
          <div className="eyebrow">NNE × WESTDETRO · SEASON 001</div>
          <h2>ROAD TO WESTDETRO</h2>
          <p>08.28.26 · Participar suma. Esforzarte multiplica.</p>
        </div>
        <VisualMedia src={nneAssets.seasonHero} alt="Season 001 — Road to WESTDETRO" fallback="001" eager />
      </article>
      <section className="hero-grid">
        <article className="card balance-card">
          <div className="eyebrow">Balance disponible</div>
          <div className="balance">{formatNne(dashboard.user.credits)}<span>NNE Credits</span></div>
          <div className="metric-row">
            <div><small>Streak</small><strong>{dashboard.user.streakDays} días</strong></div>
            <div><small>NNE Score</small><strong>{dashboard.user.nneScore} / 100</strong></div>
            <div><small>Level</small><strong>{dashboard.user.level}</strong></div>
          </div>
        </article>
        <article className="card level-card">
          <div className="eyebrow">Progreso</div>
          <div className="level-ring" style={{ background: `conic-gradient(var(--gold) 0 ${dashboard.user.xpInLevel / 10}%, #222 ${dashboard.user.xpInLevel / 10}%)` }}>
            <div><strong>{dashboard.user.level}</strong><span>LEVEL</span></div>
          </div>
          <p>{xpRemaining} XP para llegar al nivel {dashboard.user.level + 1}</p>
        </article>
      </section>

      <article className="card economy-tip">
        <div><div className="eyebrow">Cómo funciona</div><strong>Hoy puedes acumular hasta {formatNne(dashboard.economy.dailyCap)} NNE.</strong></div>
        <p>Te quedan <strong>{formatNne(dashboard.economy.remainingToday)} NNE</strong> disponibles hoy. Cada quest indica su recompensa y la evidencia es revisada antes de acreditarse.</p>
        <small>1 NNE Credit representa $1 de valor de canje dentro del catálogo. No es dinero, no se retira ni se transfiere. Reinicia {dashboard.economy.resetsAt}.</small>
      </article>

      <div className="section-heading"><h2>Quests activas</h2></div>
      <section className="quest-grid">{dashboard.quests.slice(0, 4).map((quest) => <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />)}</section>
      <article className="card progress-card">
        <div><strong>{completed} de {dashboard.quests.length} quests completadas</strong><p>Tu consistencia construye el score, el nivel y el acceso.</p></div>
        <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div><strong>{percentage}%</strong>
      </article>
    </>
  );
}

export function QuestsPage() {
  const { dashboard, openQuest } = useApp();
  const [quests, setQuests] = useState<Quest[]>(dashboard.quests);
  const [filter, setFilter] = useState("featured");

  useEffect(() => {
    questsService.list().then(setQuests).catch(() => undefined);
  }, []);

  const groups = [
    { id: "featured", label: "Destacadas" },
    { id: "support", label: "Support" },
    { id: "comments", label: "Comentarios" },
    { id: "listening", label: "Listening" },
    { id: "creator", label: "Creator" },
    { id: "all", label: "Todas" }
  ];
  const category = (quest: Quest) => {
    if (quest.id.includes("creator")) return "creator";
    if (quest.id.includes("comments")) return "comments";
    if (quest.verificationMethod === "trivia" || quest.type === "listening-trivia") return "listening";
    return "support";
  };
  const visibleQuests = filter === "all"
    ? quests
    : filter === "featured"
      ? quests.slice(0, 8)
      : quests.filter((quest) => category(quest) === filter);

  return (
    <>
      <article className="card" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Cómo completar una quest</div>
        <h2>Abre. Completa. Sube evidencia.</h2>
        <p>Las acciones simples pagan 0.25 NNE, las misiones de mayor esfuerzo 0.50 o 1 NNE. El staff valida la evidencia y puedes acumular un máximo de 5 NNE por día.</p>
      </article>
      <div className="section-heading"><h2>Quests disponibles</h2></div>
      <div className="filter-strip" aria-label="Filtrar quests">
        {groups.map((group) => (
          <button key={group.id} className={filter === group.id ? "active" : ""} onClick={() => setFilter(group.id)}>
            {group.label}
          </button>
        ))}
      </div>
      <section className="quest-grid">{visibleQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />)}</section>
      {visibleQuests.length === 0 && <div className="empty-state">No hay quests en esta categoría todavía.</div>}
    </>
  );
}

export function FeedPage() {
  const { dashboard } = useApp();
  const [items, setItems] = useState<FeedItem[]>(dashboard.feed);
  useEffect(() => { feedService.list().then(setItems).catch(() => undefined); }, []);
  return (
    <>
      <div className="section-heading"><h2>Actividad de la comunidad</h2></div>
      <section className="feed-list">{items.map((item) => <article className="feed-item" key={item.id}><span /><div><strong>{item.text}</strong><small>{formatRelativeDate(item.createdAt)}</small></div></article>)}</section>
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
    } finally { setBusyId(""); }
  };

  return (
    <>
      <article className="card" style={{ marginBottom: 18 }}><div className="eyebrow">Catálogo NNE</div><h2>Tu progreso se convierte en acceso.</h2><p>1 NNE Credit representa $1 de valor de canje dentro de este catálogo. Los créditos no son efectivo, no se retiran ni se transfieren.</p></article>
      <div className="section-heading"><h2>Rewards</h2><span className="balance-pill">{formatNne(dashboard.user.credits)} Credits</span></div>
      <section className="reward-grid">
        {rewards.map((reward) => {
          const levelLocked = dashboard.user.level < reward.minimumLevel;
          const creditLocked = dashboard.user.credits < reward.costCredits;
          const locked = levelLocked || creditLocked || reward.remaining === 0;
          return <article className={`card reward-card ${locked ? "locked" : ""}`} key={reward.id}>
            <VisualMedia className="reward-art" src={rewardAsset(reward.id, reward.imageUrl)} alt={reward.name} fallback={reward.icon} />
            <h3>{reward.name}</h3><p>{reward.description}</p>
            <footer><strong>{formatNne(reward.costCredits)} Credits</strong><button disabled={locked || busyId === reward.id} onClick={() => void redeem(reward)}>{levelLocked ? `Nivel ${reward.minimumLevel}` : creditLocked ? "Sin balance" : busyId === reward.id ? "Procesando…" : "Canjear"}</button></footer>
          </article>;
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
  const referralMessage = `Únete a NNE × WESTDETRO Community con mi invitación. Tú y ${dashboard.user.handle} reciben +${formatNne(dashboard.referralReward.credits)} NNE Credits y +${dashboard.referralReward.xp.toLocaleString()} XP al crear tu cuenta.`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralUrl);
    showToast("Enlace de invitación copiado.");
  };

  const shareReferral = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invitación a NNE × WESTDETRO Community",
          text: referralMessage,
          url: referralUrl
        });
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(`${referralMessage}\n${referralUrl}`);
    showToast("Invitación lista para compartir.");
  };

  return (
    <>
      <article className="card profile-card">
        <div className="profile-avatar">{dashboard.user.initials}</div>
        <div>
          <div className="eyebrow">{dashboard.user.title}</div>
          <h2>{dashboard.user.name}</h2>
          <p>{dashboard.user.handle} · NNE × WESTDETRO · Season 001</p>
          <div className="profile-stats">
            <div><small>Level</small><strong>{dashboard.user.level}</strong></div>
            <div><small>Credits</small><strong>{formatNne(dashboard.user.credits)}</strong></div>
            <div><small>Quests</small><strong>{dashboard.user.completedQuestCount}</strong></div>
            <div><small>Streak</small><strong>{dashboard.user.streakDays} días</strong></div>
          </div>
        </div>
      </article>
      <article className="card referral-card">
        <div>
          <div className="eyebrow">Tu señal se expande</div>
          <h2>Invita. Crezcan ambos.</h2>
        </div>
        <div className="referral-card-copy">
          <p>Cada artista que entra con tu enlace recibe la misma recompensa que tú.</p>
          <div className="referral-benefits">
            <span>+{formatNne(dashboard.referralReward.credits)} NNE Credits cada uno</span>
            <span>+{dashboard.referralReward.xp.toLocaleString()} XP cada uno</span>
          </div>
        </div>
        <div className="referral-actions">
          <button className="primary-button" disabled={!referralUrl} onClick={() => void shareReferral()}>
            Compartir invitación
          </button>
          <button className="text-button" disabled={!referralUrl} onClick={() => void copyReferral()}>
            Copiar enlace
          </button>
        </div>
      </article>
    </>
  );
}
