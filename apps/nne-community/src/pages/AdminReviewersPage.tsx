import { useEffect, useState, type FormEvent } from "react";
import { adminService } from "../services/admin";

export function AdminReviewersPage() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    try { const result = await adminService.reviewers(); setReviewers(result.reviewers || []); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos cargar reviewers."); }
  };
  useEffect(() => { void load(); }, []);

  const assign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      await adminService.assignReviewer(String(data.get("username") || ""), String(data.get("artist_slug")) as "janko" | "gemese" | "xiam");
      setMessage("Reviewer asignado."); form.reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo asignar."); }
  };

  return <>
    <article className="card" style={{ marginBottom: 18 }}><div className="eyebrow">NNE Admin · Artist Moderation</div><h2>Asignar reviewers</h2><p>Gemese, Xiam y Janko conservan cuentas normales de NNE; aquí se les otorga permiso únicamente sobre submissions de su artista.</p></article>
    {error && <div className="form-error">{error}</div>}{message && <div className="empty-state">{message}</div>}
    <section className="admin-split">
      <form className="card admin-form" onSubmit={assign}>
        <label>Username NNE<input className="field" name="username" placeholder="@username" required /></label>
        <label>Artista<select className="field" name="artist_slug" defaultValue="janko"><option value="janko">Janko</option><option value="gemese">Gemese</option><option value="xiam">Xiam</option></select></label>
        <button className="primary-button full">Dar acceso de reviewer</button>
      </form>
      <div className="admin-list">{reviewers.map((item) => <article className="card admin-row" key={`${item.user_id}-${item.artist_slug}`}><div><div className="eyebrow">{item.artist_slug}</div><h3>{item.display_name}</h3><p>@{item.username} · {item.email}</p></div><span className="tag">{item.active ? "activo" : "inactivo"}</span></article>)}{!reviewers.length && <div className="empty-state">Todavía no hay reviewers asignados.</div>}</div>
    </section>
  </>;
}
