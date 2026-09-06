import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError, formatRelativeDate } from "../services/api";
import { distributionService, type DistributionIndex } from "../services/distribution";
import type { DistributionContributor, DistributionFinance, DistributionRelease, DistributionSplit, DistributionTrack } from "../types";

const statusCopy: Record<string, string> = {
  draft: "Borrador",
  in_review: "En revisión",
  changes_requested: "Correcciones",
  approved: "Aprobado",
  packaged: "Paquete listo",
  delivered: "Entregado al proveedor",
  live: "Publicado",
  delivered_demo: "Aceptado · Sandbox",
  live_demo: "Live · Demo",
  takedown_requested: "Takedown solicitado",
  taken_down: "Retirado"
};

const contributorLabels: Record<string, string> = {
  primary_artist: "Artista principal",
  featured_artist: "Featuring",
  producer: "Producción",
  songwriter: "Composición",
  composer: "Composición musical",
  publisher: "Publisher",
  mix_engineer: "Mezcla",
  mastering_engineer: "Mastering"
};

const contributorsText = (track: DistributionTrack, role: DistributionContributor["role"]) =>
  track.contributors.filter((item) => item.role === role).map((item) => item.name).join(", ");

const splitsText = (track: DistributionTrack) => track.splits
  .map((split) => `${split.participant_name} | ${split.percentage}${split.participant_email ? ` | ${split.participant_email}` : ""}`)
  .join("\n");

const parseSplits = (value: string): DistributionSplit[] => value.split("\n").map((line) => {
  const [name, percentage, email] = line.split("|").map((item) => item.trim());
  return {
    participant_name: name,
    participant_email: email || null,
    role: "master_owner",
    percentage: Number(percentage || 0),
    status: "pending" as const
  };
}).filter((item) => item.participant_name && item.percentage > 0);

export function DistributionPage() {
  const { user } = useAuth();
  const [index, setIndex] = useState<DistributionIndex | null>(null);
  const [release, setRelease] = useState<DistributionRelease | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [batchSplits, setBatchSplits] = useState("");
  const [finance, setFinance] = useState<DistributionFinance | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");

  const loadIndex = useCallback(async () => {
    const [data, financeData] = await Promise.all([distributionService.list(), distributionService.finance()]);
    setIndex(data);
    setFinance(financeData);
    const target = selectedId || data.releases[0]?.id || "";
    if (target) {
      setSelectedId(target);
      const detail = await distributionService.get(target);
      setRelease(detail.release);
    }
  }, [selectedId]);

  useEffect(() => {
    loadIndex().catch((caught) => setError(caught instanceof Error ? caught.message : "No pudimos abrir Distribution OS."))
      .finally(() => setBusy(false));
  }, []);

  const openRelease = async (id: string) => {
    setSelectedId(id);
    setSaving(true);
    try {
      const detail = await distributionService.get(id);
      setRelease(detail.release);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos abrir el lanzamiento.");
    } finally {
      setSaving(false);
    }
  };

  const replaceRelease = (next: DistributionRelease, message?: string) => {
    setRelease(next);
    setSelectedId(next.id);
    if (message) setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
    distributionService.list().then(setIndex).catch(() => undefined);
  };

  const run = async (action: () => Promise<{ release: DistributionRelease }>, message: string) => {
    setSaving(true);
    setError("");
    try {
      const result = await action();
      replaceRelease(result.release, message);
    } catch (caught) {
      if (caught instanceof ApiError && caught.details.readiness) {
        const readiness = caught.details.readiness as DistributionRelease["readiness"];
        setRelease((current) => current ? { ...current, readiness } : current);
      }
      setError(caught instanceof Error ? caught.message : "No pudimos completar la acción.");
    } finally {
      setSaving(false);
    }
  };

  const createRelease = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void run(
      () => distributionService.create({ artist_id: String(values.get("artist_id")), title: String(values.get("title")), release_type: String(values.get("release_type")) }),
      "Lanzamiento creado."
    ).then(() => { form.reset(); setCreateOpen(false); });
  };

  const createArtistInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const result = await distributionService.createInvite({
        artist_id: String(values.get("artist_id")),
        email: String(values.get("email") || ""),
        username: String(values.get("username") || "").replace(/^@/, ""),
        role: String(values.get("role") || "artist") as "artist" | "manager"
      });
      setInviteUrl(result.invite.invite_url);
      setNotice(`Invitación creada para ${result.invite.artist_name}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos crear la invitación.");
    } finally {
      setSaving(false);
    }
  };

  const patchRelease = (field: keyof DistributionRelease, value: unknown) => {
    setRelease((current) => current ? { ...current, [field]: value } : current);
  };

  const patchTrack = (trackId: string, field: keyof DistributionTrack, value: unknown) => {
    setRelease((current) => current ? {
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? { ...track, [field]: value } : track)
    } : current);
  };

  const patchContributors = (trackId: string, role: DistributionContributor["role"], value: string) => {
    setRelease((current) => current ? {
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? {
        ...track,
        contributors: [
          ...track.contributors.filter((item) => item.role !== role),
          ...value.split(",").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, role }))
        ]
      } : track)
    } : current);
  };

  const save = () => {
    if (!release) return;
    const payload = {
      title: release.title,
      release_type: release.release_type,
      version_title: release.version_title,
      label_name: release.label_name,
      catalog_number: release.catalog_number,
      upc: release.upc,
      primary_genre: release.primary_genre,
      secondary_genre: release.secondary_genre,
      language_code: release.language_code,
      original_release_date: release.original_release_date,
      release_date: release.release_date,
      copyright_year: release.copyright_year,
      c_line: release.c_line,
      p_line: release.p_line,
      explicit_content: release.explicit_content,
      rights_confirmed: release.rights_confirmed,
      agreement_accepted: release.agreement_accepted,
      territories: release.territories,
      stores: release.stores,
      tracks: release.tracks
    };
    void run(() => distributionService.update(release.id, payload), "Catálogo guardado y auditado.");
  };

  const applyBatchSplits = () => {
    const splits = parseSplits(batchSplits);
    if (!splits.length) {
      setError("Escribe al menos una línea: Nombre | porcentaje | email opcional.");
      return;
    }
    const total = splits.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(total - 100) > 0.001) {
      setError(`Los splits suman ${total}%. Deben sumar exactamente 100%.`);
      return;
    }
    setRelease((current) => current ? { ...current, tracks: current.tracks.map((track) => ({ ...track, splits: splits.map((item) => ({ ...item })) })) } : current);
    setError("");
    setNotice("Split aplicado localmente a todo el álbum. Presiona Guardar cambios.");
  };

  const progressStyle = useMemo(() => ({ "--release-progress": `${release?.readiness.score || 0}%` } as CSSProperties), [release?.readiness.score]);

  if (busy) return <div className="empty-state">Inicializando NNE Distribution OS…</div>;
  if (!index) return <div className="card distribution-locked"><div className="eyebrow">PILOTO PRIVADO</div><h2>Acceso por invitación.</h2><p>{error || "El equipo NNE habilita cada catálogo individualmente."}</p></div>;

  return (
    <div className="distribution-os">
      <section className="card distribution-hero">
        <div>
          <div className="eyebrow">NNE DISTRIBUTION OS · PRIVATE PILOT</div>
          <h2>Tu música sale desde aquí.</h2>
          <p>Carga masters, captura derechos, pasa el control de calidad y prepara una entrega real sin salir de NNE.</p>
        </div>
        <div className="provider-signal"><span className="provider-dot" /><div><small>DELIVERY RAIL</small><strong>NNE SANDBOX</strong><em>Adaptador listo para partner</em></div></div>
      </section>

      <section className="distribution-metrics">
        <Metric label="Catálogo" value={index.metrics.total} />
        <Metric label="En revisión" value={index.metrics.in_review} />
        <Metric label="Aprobados" value={index.metrics.approved} />
        <Metric label="Entregas demo" value={index.metrics.delivered} />
      </section>

      <section className="card distribution-money">
        <div><div className="eyebrow">REGALÍAS REALES · NO SON NNE CREDITS</div><h3>Contabilidad lista para recibir statements.</h3><p>Cada artista ve únicamente su balance, reportes DSP y pagos. Los importes usan precisión contable y nunca se mezclan con la economía promocional de la comunidad.</p></div>
        <div className="distribution-money-stats">
          <span><small>GENERADO</small><strong>{formatMoney(finance?.balances[0]?.earned_micros || 0, finance?.balances[0]?.currency || "USD")}</strong></span>
          <span><small>DISPONIBLE</small><strong>{formatMoney(finance?.balances[0]?.available_micros || 0, finance?.balances[0]?.currency || "USD")}</strong></span>
          <span><small>STATEMENTS</small><strong>{finance?.statements.length || 0}</strong></span>
        </div>
      </section>

      {user?.role === "admin" && (
        <section className="card distribution-onboarding">
          <div><div className="eyebrow">ARTIST ACCESS</div><h3>Invita al dueño de cada catálogo.</h3><p>El enlace es de un solo uso. El artista entra con su cuenta NNE y solo obtiene acceso al perfil asignado.</p></div>
          <form onSubmit={createArtistInvite}>
            <select className="field" name="artist_id" required>{index.artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select>
            <input className="field" name="email" type="email" placeholder="Correo del artista" />
            <input className="field" name="username" placeholder="@username (opcional)" />
            <select className="field" name="role"><option value="artist">Artista</option><option value="manager">Manager</option></select>
            <button className="primary-button" disabled={saving}>Crear acceso</button>
          </form>
          {inviteUrl && <div className="distribution-invite-result"><code>{inviteUrl}</code><button onClick={() => void navigator.clipboard.writeText(inviteUrl)}>Copiar link</button></div>}
        </section>
      )}

      <div className="distribution-toolbar">
        <div><strong>Mi catálogo</strong><span>Cada artista trabaja únicamente dentro de su acceso.</span></div>
        <button className="primary-button" onClick={() => setCreateOpen((value) => !value)}>+ Nuevo lanzamiento</button>
      </div>

      {createOpen && (
        <form className="card distribution-create" onSubmit={createRelease}>
          <label>Artista<select className="field" name="artist_id" required>{index.artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select></label>
          <label>Título<input className="field" name="title" required placeholder="Nombre del release" /></label>
          <label>Formato<select className="field" name="release_type"><option value="single">Single</option><option value="ep">EP</option><option value="album">Álbum</option></select></label>
          <button className="primary-button" disabled={saving}>Crear borrador</button>
        </form>
      )}

      <section className="distribution-workspace">
        <aside className="release-rail">
          {index.releases.map((item) => (
            <button className={selectedId === item.id ? "release-tile active" : "release-tile"} onClick={() => void openRelease(item.id)} key={item.id}>
              <span className="release-thumb">{item.artwork_url ? <img src={item.artwork_url} alt="" /> : item.artist_name.slice(0, 2)}</span>
              <span><small>{item.artist_name}</small><strong>{item.title}</strong><em>{statusCopy[item.status] || item.status} · {item.track_count} tracks</em></span>
            </button>
          ))}
          {!index.releases.length && <div className="empty-copy">Crea el primer lanzamiento.</div>}
        </aside>

        {release && (
          <div className="release-editor">
            <header className="card release-overview">
              <div className="release-cover">
                {release.artwork_url ? <img src={release.artwork_url} alt={`Portada de ${release.title}`} /> : <span>NNE</span>}
                {(["draft", "changes_requested"].includes(release.status)) && <label className="cover-upload">Subir portada<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(() => distributionService.uploadAsset(release.id, "artwork", file), "Portada protegida en R2."); }} /></label>}
              </div>
              <div className="release-overview-copy">
                <div className="release-status-row"><span className={`release-status ${release.status}`}>{statusCopy[release.status]}</span><small>{release.provider_release_id || "ID pendiente"}</small></div>
                <h2>{release.title}</h2>
                <p>{release.artist_name} · {release.release_type.toUpperCase()} · {release.tracks.length} tracks</p>
                <div className="readiness-bar" style={progressStyle}><span /></div>
                <strong>{release.readiness.score}% listo para entregar</strong>
              </div>
            </header>

            {release.review_note && <div className="distribution-alert"><strong>Nota de revisión</strong><span>{release.review_note}</span></div>}
            {error && <div className="form-error">{error}</div>}
            {notice && <div className="distribution-notice">{notice}</div>}

            <section className="card distribution-section">
              <div className="distribution-section-title"><div><span>01</span><div><h3>Identidad del lanzamiento</h3><p>La metadata que verán las plataformas.</p></div></div><b>{release.readiness.checks.find((item) => item.key === "metadata")?.ready ? "LISTO" : "PENDIENTE"}</b></div>
              <div className="distribution-form-grid">
                <label>Título<input className="field" value={release.title} onChange={(event) => patchRelease("title", event.target.value)} /></label>
                <label>Formato<select className="field" value={release.release_type} onChange={(event) => patchRelease("release_type", event.target.value)}><option value="single">Single</option><option value="ep">EP</option><option value="album">Álbum</option></select></label>
                <label>Sello<input className="field" value={release.label_name || ""} onChange={(event) => patchRelease("label_name", event.target.value)} /></label>
                <label>Fecha de estreno<input className="field" type="date" value={release.release_date || ""} onChange={(event) => patchRelease("release_date", event.target.value)} /></label>
                <label>Género principal<input className="field" value={release.primary_genre || ""} onChange={(event) => patchRelease("primary_genre", event.target.value)} /></label>
                <label>Idioma<input className="field" value={release.language_code || "es"} onChange={(event) => patchRelease("language_code", event.target.value)} /></label>
                <label>UPC existente o reservado<input className="field" inputMode="numeric" value={release.upc || ""} onChange={(event) => patchRelease("upc", event.target.value)} placeholder="Opcional hasta el partner" /></label>
                <label>Número de catálogo<input className="field" value={release.catalog_number || ""} onChange={(event) => patchRelease("catalog_number", event.target.value)} placeholder="NNE-2026-001" /></label>
                <label className="wide">Línea ©<input className="field" value={release.c_line || ""} onChange={(event) => patchRelease("c_line", event.target.value)} /></label>
                <label className="wide">Línea ℗<input className="field" value={release.p_line || ""} onChange={(event) => patchRelease("p_line", event.target.value)} /></label>
              </div>
            </section>

            <section className="card distribution-section">
              <div className="distribution-section-title"><div><span>02</span><div><h3>Tracklist + masters</h3><p>WAV/FLAC privados. Nunca quedan en una URL pública.</p></div></div><b>{release.tracks.filter((track) => track.master_ready).length}/{release.tracks.length}</b></div>
              <div className="batch-split-box">
                <label>Aplicar el mismo split del master a todos los tracks<textarea className="field" value={batchSplits} onChange={(event) => setBatchSplits(event.target.value)} placeholder={"Janko Diorr | 50 | email@ejemplo.com\nColaborador | 50 | otro@ejemplo.com"} /></label>
                <button onClick={applyBatchSplits}>Aplicar a todo el álbum</button>
              </div>
              <div className="distribution-tracklist">
                {release.tracks.map((track) => (
                  <TrackEditor
                    key={track.id}
                    track={track}
                    locked={!(["draft", "changes_requested"].includes(release.status))}
                    busy={saving}
                    onField={(field, value) => patchTrack(track.id, field, value)}
                    onContributors={(role, value) => patchContributors(track.id, role, value)}
                    onSplits={(value) => patchTrack(track.id, "splits", parseSplits(value))}
                    onUpload={(file) => void run(() => distributionService.uploadAsset(release.id, "master", file, track.id), `${track.title}: master protegido.`)}
                    onDelete={() => { if (window.confirm(`¿Eliminar ${track.title} del tracklist?`)) void run(() => distributionService.deleteTrack(track.id), "Track eliminado."); }}
                  />
                ))}
              </div>
              {(["draft", "changes_requested"].includes(release.status)) && <button className="distribution-add-track" onClick={() => { const title = window.prompt("Título del nuevo track:"); if (title) void run(() => distributionService.addTrack(release.id, title), "Track agregado."); }}>+ Agregar track</button>}
            </section>

            <section className="card distribution-section">
              <div className="distribution-section-title"><div><span>03</span><div><h3>Derechos + control de salida</h3><p>El release no avanza mientras exista un bloqueo.</p></div></div><b>{release.readiness.score}%</b></div>
              <div className="readiness-grid">
                {release.readiness.checks.map((check) => <article className={check.ready ? "ready" : ""} key={check.key}><span>{check.ready ? "✓" : "·"}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></article>)}
              </div>
              {(["draft", "changes_requested"].includes(release.status)) && (
                <div className="rights-confirmation">
                  <label><input type="checkbox" checked={release.rights_confirmed} onChange={(event) => patchRelease("rights_confirmed", event.target.checked)} /><span><strong>Tengo autorización para distribuir estos masters.</strong><small>No contienen samples, beats o grabaciones sin los permisos correspondientes.</small></span></label>
                  <label><input type="checkbox" checked={release.agreement_accepted} disabled={release.agreement_accepted} onChange={(event) => patchRelease("agreement_accepted", event.target.checked)} /><span><strong>Acepto el acuerdo piloto de distribución NNE.</strong><small>La aceptación queda versionada con fecha, usuario, IP y dispositivo.</small></span></label>
                </div>
              )}
              <div className="distribution-actions">
                {(["draft", "changes_requested"].includes(release.status)) && <><button className="primary-button" disabled={saving} onClick={save}>Guardar cambios</button><button disabled={saving || !release.readiness.ready} onClick={() => void run(() => distributionService.submit(release.id), "Enviado al equipo de distribución.")}>Enviar a revisión</button></>}
                {user?.role === "admin" && release.status === "in_review" && <><button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "approve"), "Release aprobado por NNE.")}>Aprobar release</button><button disabled={saving} onClick={() => { const note = window.prompt("Correcciones requeridas:"); if (note) void run(() => distributionService.review(release.id, "request_changes", note), "Correcciones enviadas."); }}>Pedir correcciones</button></>}
                {user?.role === "admin" && release.status === "approved" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "package"), "Paquete de distribución generado.")}>Generar paquete DSP</button>}
                {user?.role === "admin" && release.status === "packaged" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "deliver"), release.provider?.mode === "sandbox" ? "Sandbox aceptó la simulación." : "Proveedor aceptó la entrega.")}>{release.provider?.mode === "sandbox" ? "Simular entrega" : "Entregar al proveedor"}</button>}
                {user?.role === "admin" && release.status === "delivered_demo" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "mark_live_demo"), "Release marcado live en la demo.")}>Simular publicación</button>}
              </div>
            </section>

            <section className="distribution-bottom-grid">
              <article className="card distribution-timeline"><div className="eyebrow">AUDIT TRAIL</div><h3>Todo cambio deja huella.</h3>{release.events.slice(0, 8).map((event) => <div key={event.id}><span /><p><strong>{event.event_type.replaceAll("_", " ").replaceAll(".", " · ")}</strong><small>{formatRelativeDate(event.created_at)}</small></p></div>)}</article>
              <article className="card delivery-rail"><div className="eyebrow">DELIVERY ADAPTER</div><h3>{release.provider?.name || (release.provider_key === "nne_sandbox" ? "NNE Sandbox" : release.provider_key)}</h3><p>NNE conserva la data canónica. Al cerrar el acuerdo, conectamos credenciales y mapping del partner sin cambiar el flujo de Janko, Gemese o Xiam.</p><div><span>Conexión</span><strong>{release.provider?.status || "sandbox"}</strong></div><div><span>Paquete</span><strong>{release.delivery_jobs[0]?.status || "Pendiente"}</strong></div><div><span>Provider ID</span><strong>{release.provider_release_id || "—"}</strong></div></article>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="card"><small>{label}</small><strong>{Number(value || 0).toLocaleString()}</strong></article>;
}

function formatMoney(micros: number, currency: string) {
  return new Intl.NumberFormat("es", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(micros || 0) / 1_000_000);
}

function TrackEditor({ track, locked, busy, onField, onContributors, onSplits, onUpload, onDelete }: {
  track: DistributionTrack;
  locked: boolean;
  busy: boolean;
  onField: (field: keyof DistributionTrack, value: unknown) => void;
  onContributors: (role: DistributionContributor["role"], value: string) => void;
  onSplits: (value: string) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const splitTotal = track.splits.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  return (
    <article className={`distribution-track ${open ? "open" : ""}`}>
      <button className="track-summary" onClick={() => setOpen((value) => !value)}>
        <span>{String(track.track_number).padStart(2, "0")}</span>
        <span><strong>{track.title}</strong><small>{track.artist_display}</small></span>
        <em className={track.master_ready ? "ready" : ""}>{track.master_ready ? "MASTER ✓" : "FALTA MASTER"}</em>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && <div className="track-editor-body">
        <div className="distribution-form-grid">
          <label>Título<input className="field" disabled={locked} value={track.title} onChange={(event) => onField("title", event.target.value)} /></label>
          <label>Artist display<input className="field" disabled={locked} value={track.artist_display} onChange={(event) => onField("artist_display", event.target.value)} /></label>
          <label>ISRC<input className="field" disabled={locked} value={track.isrc || ""} onChange={(event) => onField("isrc", event.target.value)} placeholder="Se puede asignar después" /></label>
          <label>Featuring<input className="field" disabled={locked} value={contributorsText(track, "featured_artist")} onChange={(event) => onContributors("featured_artist", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Productores<input className="field" disabled={locked} value={contributorsText(track, "producer")} onChange={(event) => onContributors("producer", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Compositores<input className="field" disabled={locked} value={contributorsText(track, "songwriter")} onChange={(event) => onContributors("songwriter", event.target.value)} placeholder="Separados por coma" /></label>
          <label className="wide">Splits del master<textarea className="field" disabled={locked} value={splitsText(track)} onChange={(event) => onSplits(event.target.value)} placeholder={"Nombre | 50 | email opcional\nOtro nombre | 50"} /><small className={Math.abs(splitTotal - 100) < .001 ? "split-valid" : "split-invalid"}>Total: {splitTotal}%</small></label>
        </div>
        <div className="track-file-row"><div><small>MASTER ENTREGABLE</small><strong>{track.master_original_name || "WAV/FLAC pendiente"}</strong></div>{!locked && <><label className="file-button">{track.master_ready ? "Reemplazar" : "Subir master"}<input type="file" disabled={busy} accept="audio/wav,audio/flac" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); }} /></label><button className="danger-button" onClick={onDelete}>Eliminar</button></>}</div>
      </div>}
    </article>
  );
}
