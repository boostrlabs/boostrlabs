import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { adminService } from "../services/admin";

type AdminTab = "evidence" | "quests" | "trivia" | "rewards" | "redemptions";

export function AdminPage() {
  const { refreshDashboard, showToast } = useOutletContext<AppOutletContext>();
  const [tab, setTab] = useState<AdminTab>("evidence");
  const [data, setData] = useState<any>({
    metrics: {},
    evidence: [],
    quests: [],
    trivia: [],
    rewards: [],
    redemptions: []
  });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [overview, evidence, quests, trivia, rewards, redemptions] = await Promise.all([
        adminService.overview(),
        adminService.evidence(),
        adminService.quests(),
        adminService.trivia(),
        adminService.rewards(),
        adminService.redemptions()
      ]);
      setData({
        metrics: overview.metrics,
        evidence: evidence.items || [],
        quests: quests.quests || [],
        trivia: trivia.questions || [],
        rewards: rewards.rewards || [],
        redemptions: redemptions.redemptions || []
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar Admin.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await Promise.all([load(), refreshDashboard()]);
      showToast(message);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "No pudimos completar la acción.");
    }
  };

  const createQuest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    void run(() => adminService.createQuest(payload), "Quest creada.").then(() => form.reset());
  };

  const createTrivia = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const optionIds = ["a", "b", "c", "d"];
    const payload = {
      quest_id: values.get("quest_id"),
      prompt: values.get("prompt"),
      correct_option_id: values.get("correct_option_id"),
      options: optionIds.map((id) => ({ id, text: values.get(`option_${id}`) }))
    };
    void run(() => adminService.createTrivia(payload), "Pregunta creada.").then(() => form.reset());
  };

  const createReward = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    void run(() => adminService.createReward(payload), "Reward creado.").then(() => form.reset());
  };

  if (busy && !data.quests.length) return <div className="empty-state">Cargando Command Center…</div>;
  if (error) return <div className="form-error">{error}</div>;

  return (
    <>
      <section className="admin-metrics">
        <Metric label="Usuarios activos" value={data.metrics.active_users} />
        <Metric label="Evidencias pendientes" value={data.metrics.pending_evidence} />
        <Metric label="Canjes abiertos" value={data.metrics.open_redemptions} />
        <Metric label="Quests · 7 días" value={data.metrics.quests_completed_7d} />
      </section>

      <nav className="admin-tabs">
        {([
          ["evidence", "Evidencias"],
          ["quests", "Quests"],
          ["trivia", "Trivias"],
          ["rewards", "Rewards"],
          ["redemptions", "Canjes"]
        ] as Array<[AdminTab, string]>).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === "evidence" && (
        <section className="admin-list">
          {data.evidence.map((item: any) => (
            <article className="card evidence-card" key={item.id}>
              <img src={item.evidence_url} alt={`Evidencia de ${item.user.name}`} />
              <div>
                <div className="eyebrow">{item.quest_title}</div>
                <h3>{item.user.name} <small>{item.user.handle}</small></h3>
                {item.note && <p>{item.note}</p>}
                <strong>+{Number(item.reward_credits).toLocaleString()} Credits</strong>
                <div className="action-row">
                  <button
                    className="primary-button"
                    onClick={() => void run(
                      () => adminService.reviewEvidence(item.id, "approve"),
                      "Evidencia aprobada y créditos emitidos."
                    )}
                  >
                    Aprobar
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      const reason = window.prompt("Razón breve para el usuario:");
                      if (reason) void run(
                        () => adminService.reviewEvidence(item.id, "reject", reason),
                        "Evidencia rechazada."
                      );
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!data.evidence.length && <div className="empty-state">No hay evidencias pendientes.</div>}
        </section>
      )}

      {tab === "quests" && (
        <section className="admin-split">
          <form className="card admin-form" onSubmit={createQuest}>
            <div className="eyebrow">Nueva quest</div>
            <h2>Crear misión</h2>
            <label>Título<input className="field" name="title" required /></label>
            <label>Descripción<textarea className="field" name="description" required /></label>
            <div className="form-grid">
              <label>Tipo<select className="field" name="type" defaultValue="social-proof">
                <option value="social-proof">Social proof</option>
                <option value="listening-trivia">Listening trivia</option>
                <option value="referral">Referral</option>
                <option value="community">Community</option>
              </select></label>
              <label>Verificación<select className="field" name="verification_method" defaultValue="manual">
                <option value="manual">Manual</option>
                <option value="trivia">Trivia</option>
                <option value="referral">Referral</option>
                <option value="automatic">Automática</option>
              </select></label>
              <label>Plataforma<input className="field" name="platform" defaultValue="Instagram" /></label>
              <label>Cadencia<select className="field" name="cadence" defaultValue="once">
                <option value="once">Una vez</option><option value="daily">Diaria</option><option value="weekly">Semanal</option>
              </select></label>
              <label>Credits<input className="field" name="reward_credits" type="number" min="0" defaultValue="100" /></label>
              <label>XP<input className="field" name="reward_xp" type="number" min="0" defaultValue="100" /></label>
              <label>Nivel mínimo<input className="field" name="minimum_level" type="number" min="1" defaultValue="1" /></label>
              <label>Estado<select className="field" name="status" defaultValue="draft">
                <option value="draft">Draft</option><option value="published">Publicada</option>
              </select></label>
            </div>
            <button className="primary-button full">Crear quest</button>
          </form>
          <AdminCatalog
            items={data.quests}
            render={(item) => (
              <><span className="tag">{item.status}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.attempts} intentos · {item.completions} completadas</small></>
            )}
          />
        </section>
      )}

      {tab === "trivia" && (
        <section className="admin-split">
          <form className="card admin-form" onSubmit={createTrivia}>
            <div className="eyebrow">Respuesta privada</div>
            <h2>Nueva pregunta</h2>
            <label>Quest<select className="field" name="quest_id" required>
              <option value="">Seleccionar</option>
              {data.quests.filter((quest: any) => quest.verification_method === "trivia").map((quest: any) => (
                <option key={quest.id} value={quest.id}>{quest.title}</option>
              ))}
            </select></label>
            <label>Pregunta<textarea className="field" name="prompt" required /></label>
            {["a", "b", "c", "d"].map((id) => (
              <label key={id}>Opción {id.toUpperCase()}<input className="field" name={`option_${id}`} required /></label>
            ))}
            <label>Respuesta correcta<select className="field" name="correct_option_id" defaultValue="a">
              <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
            </select></label>
            <p className="privacy-note">La respuesta viaja al servidor al guardar y nunca vuelve al frontend.</p>
            <button className="primary-button full">Guardar pregunta</button>
          </form>
          <AdminCatalog
            items={data.trivia}
            render={(item) => (
              <><span className="tag">{item.status}</span><h3>{item.prompt}</h3><p>{item.options?.length || 0} opciones · clave protegida</p></>
            )}
          />
        </section>
      )}

      {tab === "rewards" && (
        <section className="admin-split">
          <form className="card admin-form" onSubmit={createReward}>
            <div className="eyebrow">Catálogo</div><h2>Nuevo reward</h2>
            <label>Nombre<input className="field" name="name" required /></label>
            <label>Descripción<textarea className="field" name="description" required /></label>
            <div className="form-grid">
              <label>Costo<input className="field" name="cost_credits" type="number" min="1" required /></label>
              <label>Nivel mínimo<input className="field" name="minimum_level" type="number" min="1" defaultValue="1" /></label>
              <label>Inventario<input className="field" name="inventory" type="number" min="0" placeholder="Ilimitado" /></label>
              <label>Estado<select className="field" name="status" defaultValue="draft">
                <option value="draft">Draft</option><option value="published">Publicado</option>
              </select></label>
            </div>
            <button className="primary-button full">Crear reward</button>
          </form>
          <AdminCatalog
            items={data.rewards}
            render={(item) => (
              <><span className="tag">{item.status}</span><h3>{item.name}</h3><p>{Number(item.cost_credits).toLocaleString()} Credits · nivel {item.minimum_level}</p><small>{item.redeemed} canjes</small></>
            )}
          />
        </section>
      )}

      {tab === "redemptions" && (
        <section className="admin-list">
          {data.redemptions.map((item: any) => (
            <article className="card admin-row" key={item.id}>
              <div><span className="tag">{item.status}</span><h3>{item.reward_name}</h3><p>{item.display_name} · @{item.username} · {item.email}</p></div>
              <div className="action-row">
                {item.status === "requested" && <button onClick={() => void run(() => adminService.updateRedemption(item.id, "in_progress"), "Canje en proceso.")}>Comenzar</button>}
                {item.status !== "fulfilled" && <button className="primary-button" onClick={() => void run(() => adminService.updateRedemption(item.id, "fulfilled"), "Canje completado.")}>Marcar entregado</button>}
              </div>
            </article>
          ))}
          {!data.redemptions.length && <div className="empty-state">No hay canjes todavía.</div>}
        </section>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="card admin-metric"><small>{label}</small><strong>{Number(value || 0).toLocaleString()}</strong></article>;
}

function AdminCatalog({ items, render }: { items: any[]; render: (item: any) => React.ReactNode }) {
  return (
    <div className="admin-catalog">
      {items.map((item) => <article className="card admin-row" key={item.id}><div>{render(item)}</div></article>)}
    </div>
  );
}
