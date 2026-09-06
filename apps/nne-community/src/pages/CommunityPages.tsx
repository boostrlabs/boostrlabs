import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { QuestCard } from "../components/QuestCard";
import { feedService } from "../services/feed";
import { rewardsService } from "../services/rewards";
import { questsService } from "../services/quests";
import { rafflesService } from "../services/raffles";
import type { FeedItem, Quest, RaffleCampaign, Reward } from "../types";
import { formatNne, formatRelativeDate } from "../services/api";
import { VisualMedia } from "../components/VisualMedia";
import { nneAssets, rewardAssets } from "../config/assets";
import { nnePlaylistHubUrl, nnePlaylists } from "../config/playlists";

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
        <p>Te quedan <strong>{formatNne(dashboard.economy.remainingToday)} NNE</strong> disponibles hoy. Cada bloque indica cuánto paga y revisamos la evidencia antes de acreditarlo.</p>
        <small>1 NNE Credit representa $1 de valor de canje dentro del catálogo. No es dinero, no se retira ni se transfiere. Reinicia {dashboard.economy.resetsAt}.</small>
      </article>

      <article className="card raffle-teaser">
        <div><div className="eyebrow">Sorteo semanal</div><strong>Tu XP te puede ganar un Beat WESTDETRO.</strong></div>
        <p>Cada 10 XP elegibles de chamba aprobada crea una participación automática. No gastas XP ni NNE.</p>
        <Link className="primary-button" to="/raffles">Ver sorteo</Link>
      </article>

      <a className="playlist-home-banner" href={nnePlaylistHubUrl} target="_blank" rel="noreferrer">
        <div>
          <div className="eyebrow">NNE OFFICIAL SPOTIFY PLAYLISTS</div>
          <strong>El movimiento también se escucha.</strong>
          <p>Essentials, Rotation, Perreo &amp; Sistema y After en un solo lugar.</p>
        </div>
        <span>ABRIR HUB <b>↗</b></span>
      </a>

      <section className="music-strip" aria-label="En rotación">
        <article><VisualMedia src={nneAssets.music.sisisi} alt="SISISI" fallback="SISISI" /><strong>SISISI <small>26 AGO</small></strong></article>
        <article><VisualMedia src={nneAssets.music.deDescargue} alt="DE DESCARGUE" fallback="DD" /><strong>DE DESCARGUE</strong></article>
        <article><VisualMedia src={nneAssets.music.caption} alt="CAPTION" fallback="CAPTION" /><strong>CAPTION</strong></article>
      </section>

      <div className="section-heading"><h2>Bloques de Chamba activos</h2></div>
      <section className="quest-grid">{dashboard.quests.slice(0, 4).map((quest) => <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />)}</section>
      <article className="card progress-card">
        <div><strong>{completed} de {dashboard.quests.length} bloques completados</strong><p>Tu consistencia construye el score, el nivel y el acceso.</p></div>
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
    { id: "support", label: "Apoyo" },
    { id: "comments", label: "Comentarios" },
    { id: "listening", label: "Escucha" },
    { id: "creator", label: "Creativos" },
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
        <div className="eyebrow">Cómo funciona la chamba</div>
        <h2>Hazlo. Sube prueba. Nosotros revisamos.</h2>
        <p>Hay bloques cortos desde 0.25 NNE y otros creativos de mayor esfuerzo. Un buen concepto o buenos números pueden sumar un plus, pero nadie puede farmear más de 5 NNE diarios con chamba regular.</p>
        <div className="work-tier-row"><span><b>Base</b>Cumpliste</span><span><b>Intermedio</b>Buena ejecución</span><span><b>Plus</b>Creatividad o números</span></div>
      </article>
      <div className="section-heading"><h2>Bloques de Chamba</h2></div>
      <div className="filter-strip" aria-label="Filtrar bloques de chamba">
        {groups.map((group) => (
          <button key={group.id} className={filter === group.id ? "active" : ""} onClick={() => setFilter(group.id)}>
            {group.label}
          </button>
        ))}
      </div>
      <section className="quest-grid">{visibleQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onOpen={openQuest} />)}</section>
      {visibleQuests.length === 0 && <div className="empty-state">No hay bloques en esta categoría todavía.</div>}
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
          const assets = rewardAssets(reward.id, reward.imageUrl);
          return <article className={`card reward-card ${locked ? "locked" : ""}`} key={reward.id}>
            <div className={`reward-visuals ${assets.length > 1 ? "has-variants" : ""}`}>
              {(assets.length ? assets : [null]).map((asset, index) => (
                <VisualMedia className="reward-art" src={asset} alt={`${reward.name}${assets.length > 1 ? index === 0 ? " gris" : " negro" : ""}`} fallback={reward.icon} key={asset || "fallback"} />
              ))}
            </div>
            <h3>{reward.name}</h3><p>{reward.description}</p>
            {reward.saleCostCredits != null && <div className={`sale-banner ${reward.onSale ? "" : "upcoming"}`}><span>{reward.onSale ? "20% OFF" : "OFERTA MAÑANA"}</span><small>{formatNne(reward.saleCostCredits)} NNE · 20 AGO — 20 SEP</small></div>}
            <footer><strong className="reward-price">{reward.onSale && <del>{formatNne(reward.regularCostCredits)}</del>}{formatNne(reward.costCredits)} Credits</strong><button disabled={locked || busyId === reward.id} onClick={() => void redeem(reward)}>{levelLocked ? `Nivel ${reward.minimumLevel}` : creditLocked ? "Sin balance" : busyId === reward.id ? "Procesando…" : "Canjear"}</button></footer>
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
      ? `${window.location.origin}${import.meta.env.BASE_URL}signup?ref=${encodeURIComponent(dashboard.referralCode)}&promo=PRIMEROS50`
      : "",
    [dashboard.referralCode]
  );
  const referralMessage = `Únete a NNE × WESTDETRO Community. Los primeros 50 aprobados reciben 3 NNE. Si entras con mi enlace, yo sumo +${formatNne(dashboard.referralReward.credits)} NNE cuando aprueben tu cuenta.`;

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
      <article className="card referral-card">
        <div>
          <div className="eyebrow">Tu señal se expande</div>
          <h2>Invita a alguien.</h2>
        </div>
        <div className="referral-card-copy">
          <p>Cuando aprobemos a la persona que entra con tu enlace, tú sumas la recompensa. Si todavía quedan cupos de lanzamiento, esa persona empieza con 3 NNE.</p>
          <div className="referral-benefits">
            <span>+{formatNne(dashboard.referralReward.credits)} NNE para quien invita</span>
            <span>+3 NNE de bienvenida · primeros 50</span>
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

export function PlaylistsPage() {
  return (
    <>
      <article className="card playlist-intro">
        <div>
          <div className="eyebrow">NNE OFFICIAL SPOTIFY PLAYLISTS</div>
          <h2>Cuatro mundos.<br />Un movimiento.</h2>
          <p>Selecciones oficiales de NOSOTROSNOELLOS para descubrir el sonido, los artistas y la energía de NNE.</p>
        </div>
        <a className="primary-button" href={nnePlaylistHubUrl} target="_blank" rel="noreferrer">Compartir el hub ↗</a>
      </article>
      <section className="playlist-community-grid">
        {nnePlaylists.map((playlist, index) => (
          <a key={playlist.id} className="card playlist-community-card" href={playlist.url} target="_blank" rel="noreferrer">
            <div className="playlist-cover-wrap">
              <img src={playlist.image} alt={`Portada de ${playlist.title}`} loading={index > 1 ? "lazy" : "eager"} />
              <span>▶</span>
            </div>
            <div className="playlist-community-copy">
              <small>{playlist.label}</small>
              <strong>{playlist.title}</strong>
              <p>{playlist.description}</p>
              <b>ESCUCHAR EN SPOTIFY ↗</b>
            </div>
          </a>
        ))}
      </section>
    </>
  );
}

const raffleDate = (value: string) => new Intl.DateTimeFormat("es-US", {
  weekday: "long",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York"
}).format(new Date(value));

export function RafflesPage() {
  const [raffles, setRaffles] = useState<RaffleCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    rafflesService.list()
      .then((response) => setRaffles(response.raffles))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "No pudimos cargar los sorteos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">Calculando tus participaciones…</div>;
  if (error) return <div className="form-error">{error}</div>;

  return (
    <>
      <article className="card raffle-rules">
        <div>
          <div className="eyebrow">Sorteos NNE</div>
          <h2>No compras tickets. Tu chamba te mete.</h2>
        </div>
        <div className="raffle-rule-grid">
          <span><b>10 XP</b>1 participación</span>
          <span><b>3 máximo</b>por persona</span>
          <span><b>5 XP</b>máximo elegible por día</span>
        </div>
        <p>Solo cuenta el XP base de Bloques de Chamba aprobados. Referrals, bonos y puntos extra por views no generan más participaciones. Tu XP nunca se descuenta.</p>
      </article>

      <section className="raffle-grid">
        {raffles.map((raffle) => {
          const prizeAsset = raffle.prizeRewardId
            ? rewardAssets(raffle.prizeRewardId, null)[0]
            : rewardAssets("s1_reward_westdetro_beat", null)[0];
          const progress = raffle.userEntries >= raffle.maxEntriesPerUser
            ? 100
            : ((raffle.userEligibleXp % raffle.xpPerEntry) / raffle.xpPerEntry) * 100;
          return (
            <article className="card raffle-card" key={raffle.id}>
              <VisualMedia src={prizeAsset} alt={raffle.prizeName} fallback="BEAT" eager />
              <div className="raffle-card-copy">
                <div className="raffle-card-topline">
                  <span className="tag">{raffle.status === "drawn" ? "Resultado" : "Activo"}</span>
                  <small>{raffleDate(raffle.drawAt)} · hora Miami</small>
                </div>
                <h2>{raffle.prizeName}</h2>
                <p>{raffle.description}</p>

                {raffle.result ? (
                  <div className="raffle-winner">
                    {raffle.result.winner ? <><small>Ganador</small><strong>@{raffle.result.winner.username}</strong></> : <strong>No hubo participaciones elegibles.</strong>}
                    <span>Resultado verificable · {raffle.result.rosterHash.slice(0, 12)}</span>
                  </div>
                ) : (
                  <>
                    <div className="raffle-entry-count">
                      <div><small>Tus participaciones</small><strong>{raffle.userEntries} / {raffle.maxEntriesPerUser}</strong></div>
                      <div><small>XP elegible</small><strong>{formatNne(raffle.userEligibleXp)}</strong></div>
                      <div><small>En juego</small><strong>{raffle.totalEntries}</strong></div>
                    </div>
                    <div className="raffle-progress"><span style={{ width: `${Math.min(100, progress)}%` }} /></div>
                    <small className="raffle-next">
                      {raffle.userEntries >= raffle.maxEntriesPerUser
                        ? "Ya tienes el máximo para este sorteo."
                        : `Te faltan ${formatNne(raffle.xpToNextEntry)} XP elegibles para tu próxima participación.`}
                    </small>
                  </>
                )}

                <div className="raffle-roster">
                  <strong>Participantes · {raffle.participantCount}</strong>
                  {raffle.participants.length > 0
                    ? <div>{raffle.participants.map((participant) => <span key={participant.username}>@{participant.username} · {participant.entries}</span>)}</div>
                    : <small>Todavía no hay participaciones. La primera puede ser tuya.</small>}
                </div>
              </div>
            </article>
          );
        })}
      </section>
      {!raffles.length && <div className="empty-state">El próximo sorteo se está preparando.</div>}
    </>
  );
}
