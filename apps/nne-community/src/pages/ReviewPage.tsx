import { useEffect, useState } from "react";
import { reviewService } from "../services/review";

type Quality = "completed" | "good" | "standout" | "exceptional";
type Performance = "normal" | "strong" | "breakout" | "viral";

const qualityCredits: Record<Quality, number> = { completed: 0, good: 0.25, standout: 0.5, exceptional: 1 };
const performanceCredits: Record<Performance, number> = { normal: 0, strong: 0.25, breakout: 0.5, viral: 1 };

export function ReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [grading, setGrading] = useState<Record<string, { quality: Quality; performance: Performance }>>({});

  const load = async () => {
    try {
      const result = await reviewService.evidence();
      setItems(result.items || []); setScopes(result.scopes || []); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos cargar tu cola de revisión."); }
  };
  useEffect(() => { void load(); }, []);

  const grade = (id: string) => grading[id] || { quality: "completed" as Quality, performance: "normal" as Performance };
  const setGrade = (id: string, patch: Partial<{ quality: Quality; performance: Performance }>) => setGrading((current) => ({ ...current, [id]: { ...grade(id), ...patch } }));

  const approve = async (item: any) => {
    const selected = grade(item.id); setBusy(item.id);
    try { await reviewService.review(item.id, "approve", selected.quality, selected.performance); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo aprobar."); }
    finally { setBusy(""); }
  };

  const reject = async (item: any) => {
    const reason = window.prompt("Razón breve para rechazar:"); if (!reason) return;
    setBusy(item.id);
    try { await reviewService.review(item.id, "reject", "completed", "normal", reason); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo rechazar."); }
    finally { setBusy(""); }
  };

  return (
    <>
      <article className="card" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Revisión de chamba · Season 001</div>
        <h2>Pruebas pendientes.</h2>
        <p>Equipo asignado: {scopes.join(", ") || "sin asignar"}. La base está definida; tú calificas ejecución e impacto y el sistema calcula el plus sin pasar el límite diario.</p>
      </article>
      {error && <div className="form-error">{error}</div>}
      <section className="admin-list">
        {items.map((item) => {
          const selected = grade(item.id);
          const bonus = qualityCredits[selected.quality] + performanceCredits[selected.performance];
          return <article className="card evidence-card" key={item.id}>
            <img src={item.evidence_url} alt={`Evidencia ${item.user.handle}`} />
            <div>
              <div className="eyebrow">{item.quest_title}</div>
              <h3>{item.user.name} <small>{item.user.handle}</small></h3>
              {item.note && <p>{item.note}</p>}
              <div className="form-grid">
                <label>Ejecución<select className="field" value={selected.quality} onChange={(event) => setGrade(item.id, { quality: event.target.value as Quality })}>
                  <option value="completed">Cumplió · +0</option><option value="good">Buena · +0.25 NNE</option><option value="standout">Destacada · +0.50 NNE</option><option value="exceptional">Durísima · +1 NNE</option>
                </select></label>
                <label>Números<select className="field" value={selected.performance} onChange={(event) => setGrade(item.id, { performance: event.target.value as Performance })}>
                  <option value="normal">Normal · +0</option><option value="strong">Agarró movimiento · +0.25 NNE</option><option value="breakout">Agarró números · +0.50 NNE</option><option value="viral">Se fue · +1 NNE</option>
                </select></label>
              </div>
              <p><strong>Base +{Number(item.reward_credits).toLocaleString()}</strong> · Bonus +{bonus.toLocaleString()} · <strong>Total +{(Number(item.reward_credits) + bonus).toLocaleString()} NNE</strong></p>
              <div className="action-row"><button className="primary-button" disabled={busy === item.id} onClick={() => void approve(item)}>Aprobar</button><button className="danger-button" disabled={busy === item.id} onClick={() => void reject(item)}>Rechazar</button></div>
            </div>
          </article>;
        })}
        {!items.length && !error && <div className="empty-state">No tienes submissions pendientes.</div>}
      </section>
    </>
  );
}
