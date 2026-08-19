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
        <div className="eyebrow">Artist Moderation · Season 001</div>
        <h2>Tu contenido. Tu cola de aprobación.</h2>
        <p>Scopes: {scopes.join(", ") || "sin asignar"}. El reward base viene fijado por NNE; tú calificas creatividad e impacto y el sistema calcula el bonus.</p>
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
                <label>Creativity<select className="field" value={selected.quality} onChange={(event) => setGrade(item.id, { quality: event.target.value as Quality })}>
                  <option value="completed">Completed · +0</option><option value="good">Good · +250</option><option value="standout">Standout · +1,500</option><option value="exceptional">Exceptional · +5,000</option>
                </select></label>
                <label>Performance<select className="field" value={selected.performance} onChange={(event) => setGrade(item.id, { performance: event.target.value as Performance })}>
                  <option value="normal">Normal · +0</option><option value="strong">Strong · +1,000</option><option value="breakout">Breakout · +7,500</option><option value="viral">Viral · +25,000</option>
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
