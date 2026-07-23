import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/users";
import type { DashboardData, Quest } from "../types";
import { Navigation } from "./Navigation";
import { QuestModal } from "./QuestModal";

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Tu progreso empieza aquí.", subtitle: "Cada acción suma al movimiento." },
  "/quests": { title: "Daily Quests.", subtitle: "Convierte acciones reales en progreso real." },
  "/feed": { title: "La comunidad se está moviendo.", subtitle: "Todo avance deja una señal." },
  "/rewards": { title: "Canjea tu progreso.", subtitle: "Servicios reales. Valor real." },
  "/profile": { title: "Tu carrera, visible.", subtitle: "Este perfil cuenta tu consistencia." },
  "/admin": { title: "NNE Command Center.", subtitle: "Contenido, validación y fulfillment en un solo lugar." }
};

export interface AppOutletContext {
  dashboard: DashboardData;
  refreshDashboard: () => Promise<void>;
  openQuest: (quest: Quest) => void;
  showToast: (message: string) => void;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const refreshDashboard = useCallback(async () => {
    try {
      setDashboard(await usersService.dashboard());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar NNE Community.");
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  if (!dashboard) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">NN</div>
        <strong>{error || "Cargando NNE Community…"}</strong>
        {error && (
          <div className="loading-actions">
            <button className="primary-button" onClick={() => void refreshDashboard()}>Reintentar</button>
            <button className="text-button" onClick={() => void logout()}>Cerrar sesión</button>
          </div>
        )}
      </div>
    );
  }

  const copy = pageCopy[location.pathname] || pageCopy["/"];
  return (
    <div className="app-shell">
      <Navigation />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">NNE Community / Powered by BOOSTR Labs</div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <div className="avatar" title={user?.name}>{dashboard.user.initials}</div>
        </header>
        <Outlet context={{
          dashboard,
          refreshDashboard,
          openQuest: setSelectedQuest,
          showToast
        } satisfies AppOutletContext} />
      </main>

      <aside className="right-panel">
        <h3>Top de la comunidad</h3>
        {dashboard.leaderboard.slice(0, 5).map((entry) => (
          <div className="leader-row" key={entry.userId}>
            <span>{entry.rank}</span>
            <strong>{entry.userId === dashboard.user.id ? "Tú" : entry.name}</strong>
            <em>{entry.score.toLocaleString()}</em>
          </div>
        ))}
        {dashboard.leaderboard.length === 0 && <p className="empty-copy">La tabla comienza contigo.</p>}
      </aside>

      <QuestModal
        quest={selectedQuest}
        referralCode={dashboard.referralCode}
        onClose={() => setSelectedQuest(null)}
        onChanged={async (message) => {
          await refreshDashboard();
          showToast(message);
        }}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
