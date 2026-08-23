import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CollabBrand } from "../components/CollabBrand";
import { useAuth } from "../context/AuthContext";
import { formatNne } from "../services/api";

type PublicQuest = {
  id: string;
  platform: string;
  title: string;
  description: string;
  icon: string;
  reward_credits: number;
  reward_xp: number;
  minimum_level: number;
  visibility: "public" | "preview" | "private";
  source_url: string | null;
  song: { title: string; artist_name: string; artwork_url: string | null } | null;
};

export function PublicQuestPage() {
  const { questId = "" } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [quest, setQuest] = useState<PublicQuest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/nne/public/quests/${encodeURIComponent(questId)}`, { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) throw new Error(payload.message || "Esta chamba no está disponible.");
        return payload.quest as PublicQuest;
      })
      .then((result) => { if (active) setQuest(result); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Esta chamba no está disponible."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [questId]);

  const smartPath = `/chamba/${encodeURIComponent(questId)}`;

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <CollabBrand />
        <div className="eyebrow">SMART LINK · NNE × WESTDETRO</div>
        <h1>Chamba.</h1>
        <p>Las chambas pueden compartirse públicamente sin abrir el acceso operativo de NNE.</p>
      </section>
      <section className="card auth-card">
        {loading ? <strong>Cargando chamba…</strong> : error ? <div className="form-error">{error}</div> : quest ? (
          <>
            <div className="eyebrow">{quest.platform} · {quest.visibility === "public" ? "Pública" : quest.visibility === "private" ? "Privada" : "Vista pública"}</div>
            <h2>{quest.title}</h2>
            <p>{quest.description}</p>
            <div className="referral-benefits">
              <span>+{formatNne(quest.reward_credits)} NNE</span>
              <span>+{formatNne(quest.reward_xp)} XP</span>
              <span>Nivel {quest.minimum_level}+</span>
            </div>

            {quest.visibility === "public" && quest.source_url ? (
              <a className="primary-button full button-link" href={quest.source_url} target="_blank" rel="noreferrer">Abrir chamba</a>
            ) : !authLoading && user ? (
              <Link className="primary-button full button-link" to="/quests">Entrar a NNE para hacerla</Link>
            ) : (
              <Link className="primary-button full button-link" to="/login" state={{ from: location.pathname }}>Inicia sesión para hacerla</Link>
            )}

            {!user && <p className="auth-note">Puedes ver esta página sin cuenta. Las instrucciones operativas, pruebas, links protegidos y rewards privados se desbloquean solo después de identificarte.</p>}
            <button className="text-button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${smartPath}`)}>Copiar smart link</button>
          </>
        ) : null}
      </section>
    </main>
  );
}
