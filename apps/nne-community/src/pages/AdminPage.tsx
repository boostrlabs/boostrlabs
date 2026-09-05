import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { adminService } from "../services/admin";

type AdminTab = "applications" | "evidence" | "quests" | "trivia" | "rewards" | "beats" | "redemptions";

export function AdminPage() {
  const { refreshDashboard, showToast } = useOutletContext<AppOutletContext>();
  const [tab, setTab] = useState<AdminTab>("applications");
  const [data, setData] = useState<any>({
    metrics: {},
    applications: [],
    evidence: [],
    quests: [],
    trivia: [],
    rewards: [],
    beats: [],
    redemptions: []
  });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [overview, applications, evidence, quests, trivia, rewards, beats, redemptions] = await Promise.all([
        adminService.overview(),
        adminService.applications(),
        adminService.evidence(),
        adminService.quests(),
        adminService.trivia(),
        adminService.rewards(),
        adminService.beats(),
        adminService.redemptions()
      ]);
      setData({
        metrics: overview.metrics,
        applications: applications.applications || [],
        evidence: evidence.items || [],
        quests: quests.quests || [],
        trivia: trivia.questions || [],
        rewards: rewards.rewards || [],
        beats: beats.beats || [],
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
    void run(() => adminService.createQuest(payload), "Bloque creado.").then(() => form.reset());
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

  const createBeat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = Object.fromEntries(values);
    const artwork = values.get("artwork");
    const stream = values.get("stream");
    const master = values.get("master");
    delete payload.artwork;
    delete payload.stream;
    delete payload.master;
    const requestedStatus = payload.status;
    payload.status = "draft";
    void run(async () => {
      const result = await adminService.createBeat(payload);
      const beatId = result.beat.id as string;
      if (artwork instanceof File && artwork.size) await adminService.uploadBeatAsset(beatId, "artwork", artwork);
      if (stream instanceof File && stream.size) await adminService.uploadBeatAsset(beatId, "stream", stream);
      if (master instanceof File && master.size) await adminService.uploadBeatAsset(beatId, "master", master);
      if (requestedStatus === "published") await adminService.updateBeatStatus(beatId, "published");
    }, "Beat cargado en el vault.").then(() => form.reset());
  };

  if (busy && !data.quests.length) return <div className="empty-state">Cargando Command Center…</div>;
  if (error) return <div className="form-error">{error}</div>;

  return (
    <>
      <section className="admin-metrics">
        <Metric label="NNE creados · total" value={data.metrics.credits_created_total} suffix=" NNE" />
        <Metric label="NNE en circulación" value={data.metrics.credits_in_circulation} suffix=" NNE" />
        <Metric label="NNE usados" value={data.metrics.credits_redeemed_total} suffix=" NNE" />
        <Metric label="Trabajos generados" value={data.metrics.jobs_generated} />
        <Metric label="Solicitudes pendientes" value={data.metrics.pending_applications} />
        <Metric label="Usuarios activos" value={data.metrics.active_users} />
        <Metric label="Participantes · 30 días" value={data.metrics.active_participants_30d} />
        <Metric label="Bono primeros 50" value={data.metrics.promo_members} suffix=" / 50" />
      </section>

      <p className="admin-metric-note">“Trabajos generados” cuenta servicios creativos entregados desde el catálogo. Los productos físicos se miden aparte como canjes.</p>

      <nav className="admin-tabs">
        {([
          ["applications", "Solicitudes"],
          ["evidence", "Evidencias"],
          ["quests", "Bloques"],
          ["trivia", "Trivias"],
          ["rewards", "Rewards"],
          ["beats", "Beat Vault"],
          ["redemptions", "Canjes"]
        ] as Array<[AdminTab, string]>).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === "applications" && (
        <section className="admin-list">
          {data.applications.map((item: any) => (
            <article className="card admin-row application-row" key={item.id}>
              <div>
                <div className="eyebrow">{item.artist_role} · {item.country}{item.city ? ` / ${item.city}` : ""}</div>
                <h3>{item.display_name} <small>@{item.username}</small></h3>
                <p>{item.bio}</p>
                <div className="application-identities">
                  <span>{item.email_verification_status === "verified" ? "Correo verificado" : item.email_verification_status === "pending" ? "Esperando verificación" : "Solicitud anterior"}</span>
                  {item.instagram_handle && <span>IG @{item.instagram_handle}</span>}
                  {item.whatsapp_contact && <span>WA {item.whatsapp_contact}</span>}
                  {item.telegram_handle && <span>TG @{item.telegram_handle}</span>}
                  <span>Contacto: {item.primary_contact}</span>
                  {item.referral_code && <span>Referral {item.referral_code}</span>}
                  {item.promo_code && <span>Promo {item.promo_code}</span>}
                </div>
              </div>
              <div className="action-row">
                <button className="primary-button" disabled={item.email_verification_status === "pending"} onClick={() => void run(() => adminService.reviewApplication(item.id, "approve"), `@${item.username} aprobado.`)}>{item.email_verification_status === "pending" ? "Falta verificar correo" : "Aprobar acceso"}</button>
                <button className="danger-button" onClick={() => {
                  const note = window.prompt("Razón interna o mensaje para seguimiento:") || "";
                  void run(() => adminService.reviewApplication(item.id, "reject", note), `Solicitud de @${item.username} rechazada.`);
                }}>Rechazar</button>
              </div>
            </article>
          ))}
          {!data.applications.length && <div className="empty-state">No hay solicitudes pendientes.</div>}
        </section>
      )}

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
            <div className="eyebrow">Nuevo bloque de chamba</div>
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
              <label>Credits<input className="field" name="reward_credits" type="number" min="0" step="0.25" defaultValue="0.25" /></label>
              <label>XP elegible<input className="field" name="reward_xp" type="number" min="0" step="0.25" defaultValue="0.25" /></label>
              <label>Nivel mínimo<input className="field" name="minimum_level" type="number" min="1" defaultValue="1" /></label>
              <label>Estado<select className="field" name="status" defaultValue="draft">
                <option value="draft">Draft</option><option value="published">Publicada</option>
              </select></label>
            </div>
            <button className="primary-button full">Crear bloque</button>
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
            <label>Bloque<select className="field" name="quest_id" required>
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
              <label>Tipo<select className="field" name="reward_type" defaultValue="physical"><option value="physical">Producto físico</option><option value="service">Servicio / trabajo</option><option value="digital">Digital</option></select></label>
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

      {tab === "beats" && (
        <section className="admin-split">
          <form className="card admin-form" onSubmit={createBeat}>
            <div className="eyebrow">WESTDETRO Secure Listening</div><h2>Subir al Beat Vault</h2>
            <label>Título<input className="field" name="title" required /></label>
            <label>Productor<input className="field" name="producer_name" required /></label>
            <label>Descripción<textarea className="field" name="description" /></label>
            <div className="form-grid">
              <label>BPM<input className="field" name="bpm" type="number" min="30" max="300" /></label>
              <label>Tonalidad<input className="field" name="musical_key" placeholder="F# minor" /></label>
              <label>Modalidad<select className="field" name="sale_mode" defaultValue="lease">
                <option value="lease">Licencias</option><option value="exclusive">Solo exclusiva</option><option value="both">Ambas</option>
              </select></label>
              <label>Precio licencia<input className="field" name="lease_price_credits" type="number" min="1" defaultValue="25" /></label>
              <label>Precio exclusiva<input className="field" name="exclusive_price_credits" type="number" min="1" placeholder="Opcional" /></label>
              <label>Estado<select className="field" name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Publicado</option></select></label>
            </div>
            <label>Artwork privado<input className="field file-field" name="artwork" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <label>Audio de escucha limpio<input className="field file-field" name="stream" type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav" required /></label>
            <label>Master entregable<input className="field file-field" name="master" type="file" accept="audio/wav,audio/flac,audio/mpeg" /></label>
            <p className="privacy-note">Los archivos se guardan en R2 privado. El catálogo público nunca recibe las claves internas ni una URL permanente.</p>
            <button className="primary-button full">Crear y proteger beat</button>
          </form>
          <AdminCatalog
            items={data.beats}
            render={(item) => (
              <><span className="tag">{item.status}</span><h3>{item.title}</h3><p>PROD. {item.producer_name} · {item.sale_mode}</p><small>{item.stream_object_key ? "Escucha lista" : "Falta audio"} · {item.master_object_key ? "Master listo" : "Falta master"} · {item.listen_sessions} sesiones · {item.licenses} licencias</small><div className="action-row">{item.status !== "published" && <button className="primary-button" disabled={!item.stream_object_key} onClick={() => void run(() => adminService.updateBeatStatus(item.id, "published"), `${item.title} publicado.`)}>Publicar</button>}{item.status === "published" && <button onClick={() => void run(() => adminService.updateBeatStatus(item.id, "paused"), `${item.title} pausado.`)}>Pausar</button>}</div></>
            )}
          />
        </section>
      )}
    </>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return <article className="card admin-metric"><small>{label}</small><strong>{Number(value || 0).toLocaleString()}{suffix}</strong></article>;
}

function AdminCatalog({ items, render }: { items: any[]; render: (item: any) => React.ReactNode }) {
  return (
    <div className="admin-catalog">
      {items.map((item) => <article className="card admin-row" key={item.id}><div>{render(item)}</div></article>)}
    </div>
  );
}
