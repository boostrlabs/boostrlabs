import { useMemo, useState } from "react";
import { Navigation, type View } from "./components/Navigation";
import { QuestCard } from "./components/QuestCard";
import { QuestModal } from "./components/QuestModal";
import { feedItems, initialQuests, initialUser, rewards } from "./data/mockData";
import type { Quest } from "./types";

const pageCopy: Record<View, { title: string; subtitle: string }> = {
  home: {
    title: "Buenos días, Janko.",
    subtitle: "Tu progreso de hoy ya comenzó."
  },
  quests: {
    title: "Daily Quests.",
    subtitle: "Convierte acciones reales en progreso real."
  },
  feed: {
    title: "La comunidad se está moviendo.",
    subtitle: "Todo avance deja una señal."
  },
  rewards: {
    title: "Canjea tu progreso.",
    subtitle: "Servicios reales. Valor real."
  },
  profile: {
    title: "Tu carrera, visible.",
    subtitle: "Este perfil cuenta tu consistencia."
  }
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState(initialUser);
  const [quests, setQuests] = useState(initialQuests);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const completedToday = quests.filter((quest) => quest.status === "completed").length;
  const completionPercentage = Math.round((completedToday / quests.length) * 100);

  const availableRewards = useMemo(
    () =>
      rewards.map((reward) => ({
        ...reward,
        locked: reward.minimumLevel > user.level
      })),
    [user.level]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function markQuestPending(questId: string) {
    setQuests((current) =>
      current.map((quest) =>
        quest.id === questId ? { ...quest, status: "pending" } : quest
      )
    );
    setSelectedQuest(null);
    showToast("Evidencia enviada a revisión.");
  }

  function completeListeningQuest(questId: string) {
    const quest = quests.find((item) => item.id === questId);
    if (!quest || quest.status === "completed") return;

    setQuests((current) =>
      current.map((item) =>
        item.id === questId ? { ...item, status: "completed" } : item
      )
    );

    setUser((current) => ({
      ...current,
      credits: current.credits + quest.rewardCredits,
      completedQuestCount: current.completedQuestCount + 1
    }));

    showToast(`+${quest.rewardCredits} NNE Credits.`);
  }

  function redeemReward(costCredits: number, minimumLevel: number) {
    if (user.level < minimumLevel) {
      showToast(`Necesitas llegar al nivel ${minimumLevel}.`);
      return;
    }
    if (user.credits < costCredits) {
      showToast("No tienes suficientes NNE Credits.");
      return;
    }
    setUser((current) => ({
      ...current,
      credits: current.credits - costCredits
    }));
    showToast("Reward solicitado.");
  }

  return (
    <div className="app-shell">
      <Navigation activeView={view} onChange={setView} />

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">NNE Community / Frontend Starter</div>
            <h1>{pageCopy[view].title}</h1>
            <p>{pageCopy[view].subtitle}</p>
          </div>
          <div className="avatar">{user.initials}</div>
        </header>

        {view === "home" && (
          <>
            <section className="hero-grid">
              <article className="card balance-card">
                <div className="eyebrow">Balance disponible</div>
                <div className="balance">
                  {user.credits.toLocaleString()}
                  <span>NNE Credits</span>
                </div>
                <div className="metric-row">
                  <div><small>Streak</small><strong>🔥 {user.streakDays} días</strong></div>
                  <div><small>NNE Score</small><strong>{user.nneScore} / 100</strong></div>
                  <div><small>Level</small><strong>{user.level}</strong></div>
                </div>
              </article>

              <article className="card level-card">
                <div className="eyebrow">Progreso</div>
                <div className="level-ring">
                  <div><strong>{user.level}</strong><span>LEVEL</span></div>
                </div>
                <p>{user.xpToNextLevel - user.xp} XP para llegar al nivel {user.level + 1}</p>
              </article>
            </section>

            <div className="section-heading">
              <h2>Quests de hoy</h2>
              <button onClick={() => setView("quests")}>Ver todas</button>
            </div>

            <section className="quest-grid">
              {quests.slice(0, 4).map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={setSelectedQuest} />
              ))}
            </section>

            <article className="card progress-card">
              <div>
                <strong>{completedToday} de {quests.length} quests completadas</strong>
                <p>Completa todas para desbloquear un bonus diario.</p>
              </div>
              <div className="progress-track">
                <span style={{ width: `${completionPercentage}%` }} />
              </div>
              <strong>{completionPercentage}%</strong>
            </article>
          </>
        )}

        {view === "quests" && (
          <>
            <div className="section-heading">
              <h2>Daily Quests</h2>
            </div>
            <section className="quest-grid">
              {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={setSelectedQuest} />
              ))}
            </section>
          </>
        )}

        {view === "feed" && (
          <>
            <div className="section-heading">
              <h2>Actividad de la comunidad</h2>
            </div>
            <section className="feed-list">
              {feedItems.map((item) => (
                <article className="feed-item" key={item.id}>
                  <span />
                  <div>
                    <strong>{item.text}</strong>
                    <small>{item.timestamp}</small>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {view === "rewards" && (
          <>
            <div className="section-heading">
              <h2>Rewards</h2>
            </div>
            <section className="reward-grid">
              {availableRewards.map((reward) => (
                <article
                  className={`card reward-card ${reward.locked ? "locked" : ""}`}
                  key={reward.id}
                >
                  <div className="reward-art">{reward.icon}</div>
                  <h3>{reward.name}</h3>
                  <p>{reward.description}</p>
                  <footer>
                    <strong>{reward.costCredits.toLocaleString()} Credits</strong>
                    <button
                      disabled={reward.locked}
                      onClick={() =>
                        redeemReward(reward.costCredits, reward.minimumLevel)
                      }
                    >
                      {reward.locked ? `Nivel ${reward.minimumLevel}` : "Canjear"}
                    </button>
                  </footer>
                </article>
              ))}
            </section>
          </>
        )}

        {view === "profile" && (
          <>
            <article className="card profile-card">
              <div className="profile-avatar">{user.initials}</div>
              <div>
                <div className="eyebrow">{user.title}</div>
                <h2>{user.name}</h2>
                <p>{user.handle} · Miembro desde julio 2026</p>
                <div className="profile-stats">
                  <div><small>Level</small><strong>{user.level}</strong></div>
                  <div><small>Credits</small><strong>{user.credits.toLocaleString()}</strong></div>
                  <div><small>Quests</small><strong>{user.completedQuestCount}</strong></div>
                  <div><small>Streak</small><strong>{user.streakDays} días</strong></div>
                </div>
              </div>
            </article>
          </>
        )}
      </main>

      <aside className="right-panel">
        <h3>Top esta semana</h3>
        {[
          ["1", "Gemese", "18.4K"],
          ["2", "82NGEL", "16.9K"],
          ["3", "Xiam", "14.2K"],
          ["8", "Tú", `${(user.credits / 1000).toFixed(1)}K`]
        ].map(([rank, name, value]) => (
          <div className="leader-row" key={name}>
            <span>{rank}</span>
            <strong>{name}</strong>
            <em>{value}</em>
          </div>
        ))}
      </aside>

      <QuestModal
        quest={selectedQuest}
        onClose={() => setSelectedQuest(null)}
        onSubmitEvidence={markQuestPending}
        onPassTrivia={completeListeningQuest}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
