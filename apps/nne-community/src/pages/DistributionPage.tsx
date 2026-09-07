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

const storeOptions = [
  ["spotify", "Spotify"], ["apple_music", "Apple Music"], ["youtube_music", "YouTube Music"],
  ["amazon_music", "Amazon Music"], ["deezer", "Deezer"], ["tidal", "TIDAL"],
  ["tiktok", "TikTok"], ["meta", "Instagram / Facebook"]
] as const;

const contributorsText = (track: DistributionTrack, role: DistributionContributor["role"]) =>
  track.contributors.filter((item) => item.role === role).map((item) => item.name).join(", ");

const contributorDetailsText = (track: DistributionTrack, role: DistributionContributor["role"]) =>
  track.contributors.filter((item) => item.role === role)
    .map((item) => `${item.name} | ${item.ipi_cae || ""} | ${item.pro_name || ""} | ${item.publisher_name || ""}`)
    .join("\n");

const parseContributorDetails = (value: string, role: DistributionContributor["role"]): DistributionContributor[] =>
  value.split("\n").map((line) => {
    const [name, ipiCae, proName, publisherName] = line.split("|").map((item) => item.trim());
    return { name, role, ipi_cae: ipiCae || null, pro_name: proName || null, publisher_name: publisherName || null };
  }).filter((item) => item.name);

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

const statementColumns = ["artist_slug", "release_id", "track_id", "dsp", "territory", "usage_type", "quantity", "gross", "fee", "net", "occurred_at"];

const parseCsv = (source: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const decimalToMicros = (value: string, rowNumber: number, column: string) => {
  const normalized = value.replace(/[$\s]/g, "");
  const number = Number(normalized || 0);
  if (!Number.isFinite(number)) throw new Error(`Fila ${rowNumber}: ${column} no es un monto válido.`);
  return Math.round(number * 1_000_000);
};

const validateMasterFile = (file: File) => {
  const extension = file.name.toLowerCase().split(".").pop();
  if (!file.size) throw new Error(`${file.name}: el archivo está vacío.`);
  if (extension !== "wav" && extension !== "flac") throw new Error(`${file.name}: usa un master WAV o FLAC sin pérdida.`);
  if (file.size > 600 * 1024 * 1024) throw new Error(`${file.name}: supera el máximo de 600 MB.`);
};

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
  const [uploadProgress, setUploadProgress] = useState("");

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

  const createArtist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setError("");
    try {
      const result = await distributionService.createArtist({
        name: String(values.get("name") || ""),
        instagram_handle: String(values.get("instagram_handle") || "").replace(/^@/, ""),
        country_code: String(values.get("country_code") || ""),
        primary_genre: String(values.get("primary_genre") || "Latin Urban")
      });
      const refreshed = await distributionService.list();
      setIndex(refreshed);
      setNotice(`${result.artist.name} ya tiene catálogo privado. Ahora crea su acceso.`);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos crear el artista.");
    } finally {
      setSaving(false);
    }
  };

  const updateArtist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const result = await distributionService.updateArtist({
        artist_id: String(values.get("artist_id") || ""),
        name: String(values.get("name") || ""),
        instagram_handle: String(values.get("instagram_handle") || "").replace(/^@/, ""),
        country_code: String(values.get("country_code") || ""),
        primary_genre: String(values.get("primary_genre") || ""),
        spotify_artist_id: String(values.get("spotify_artist_id") || ""),
        apple_music_artist_id: String(values.get("apple_music_artist_id") || "")
      });
      setIndex(await distributionService.list());
      setNotice(`${result.artist.name}: identidad DSP actualizada.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar el perfil artístico.");
    } finally {
      setSaving(false);
    }
  };

  const requestPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const amount = Number(values.get("amount") || 0);
    setSaving(true);
    setError("");
    try {
      await distributionService.requestPayout({
        artist_id: String(values.get("artist_id")),
        currency: String(values.get("currency") || "USD"),
        amount_micros: Math.round(amount * 1_000_000),
        method: String(values.get("method") || "manual"),
        destination_hint: String(values.get("destination_hint") || "")
      });
      setFinance(await distributionService.finance());
      setNotice("Solicitud de pago enviada a NNE Finance.");
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos solicitar el pago.");
    } finally {
      setSaving(false);
    }
  };

  const updatePayout = async (payoutId: string, status: "approved" | "processing" | "paid" | "failed" | "cancelled") => {
    setSaving(true);
    setError("");
    try {
      await distributionService.updatePayout(payoutId, status);
      setFinance(await distributionService.finance());
      setNotice(`Payout actualizado: ${status}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar el pago.");
    } finally {
      setSaving(false);
    }
  };

  const downloadStatementTemplate = () => {
    const exampleArtist = index?.artists[0]?.slug || "nombre-artista";
    const csv = `${statementColumns.join(",")}\n${exampleArtist},,,spotify,US,stream,1000,4.25,0.64,3.61,2026-08-31\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nne-statement-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importStatement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("statement_csv");
    if (!(file instanceof File) || !file.size) return setError("Selecciona el statement CSV normalizado.");
    setSaving(true);
    setError("");
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("El CSV no contiene líneas de regalías.");
      const headers = rows[0].map((value) => value.toLowerCase().replace(/^\uFEFF/, ""));
      const missing = statementColumns.filter((column) => !headers.includes(column));
      if (missing.length) throw new Error(`Faltan columnas: ${missing.join(", ")}.`);
      if (rows.length - 1 > 200) throw new Error("Este piloto acepta hasta 200 líneas por importación. Divide el archivo en partes.");
      const artistsBySlug = new Map((index?.artists || []).map((artist) => [artist.slug.toLowerCase(), artist]));
      const lines = rows.slice(1).map((cells, offset) => {
        const record = Object.fromEntries(headers.map((header, position) => [header, cells[position] || ""]));
        const artist = artistsBySlug.get(record.artist_slug.toLowerCase());
        const rowNumber = offset + 2;
        if (!artist) throw new Error(`Fila ${rowNumber}: artista “${record.artist_slug}” no existe.`);
        if (!record.dsp) throw new Error(`Fila ${rowNumber}: falta el DSP.`);
        const quantity = Number(record.quantity || 0);
        if (!Number.isFinite(quantity) || quantity < 0) throw new Error(`Fila ${rowNumber}: quantity no es válida.`);
        const grossMicros = decimalToMicros(record.gross, rowNumber, "gross");
        const feeMicros = decimalToMicros(record.fee, rowNumber, "fee");
        const netMicros = decimalToMicros(record.net, rowNumber, "net");
        if (grossMicros - feeMicros !== netMicros) throw new Error(`Fila ${rowNumber}: gross - fee debe ser igual a net.`);
        return {
          artist_id: artist.id,
          release_id: record.release_id || null,
          track_id: record.track_id || null,
          dsp: record.dsp,
          territory: record.territory || null,
          usage_type: record.usage_type || null,
          quantity: Math.trunc(quantity),
          gross_micros: grossMicros,
          fee_micros: feeMicros,
          net_micros: netMicros,
          occurred_at: record.occurred_at || null,
          currency: String(formData.get("currency") || "USD").toUpperCase()
        };
      });
      const result = await distributionService.importStatement({
        provider_key: String(formData.get("provider_key") || ""),
        external_statement_id: String(formData.get("external_statement_id") || ""),
        period_start: String(formData.get("period_start") || ""),
        period_end: String(formData.get("period_end") || ""),
        currency: String(formData.get("currency") || "USD").toUpperCase(),
        lines
      });
      setFinance(await distributionService.finance());
      setNotice(`${result.line_count} líneas importadas al ledger. NNE Credits permanecen separados.`);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos importar el statement.");
    } finally {
      setSaving(false);
    }
  };

  const uploadAlbumMasters = async (files: FileList | null) => {
    if (!release || !files?.length) return;
    const orderedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const orderedTracks = [...release.tracks].sort((a, b) => a.disc_number - b.disc_number || a.track_number - b.track_number);
    if (orderedFiles.length > orderedTracks.length) {
      setError(`Elegiste ${orderedFiles.length} archivos para ${orderedTracks.length} tracks.`);
      return;
    }
    try {
      orderedFiles.forEach(validateMasterFile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Uno de los masters no es válido.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let latest = release;
      for (const [index, file] of orderedFiles.entries()) {
        const track = orderedTracks[index];
        setUploadProgress(`${index + 1}/${orderedFiles.length} · ${track.title}`);
        const result = await distributionService.uploadMasterMultipart(release.id, track.id, file, (percent) => setUploadProgress(`${index + 1}/${orderedFiles.length} · ${track.title} · ${percent}%`));
        latest = result.release;
      }
      replaceRelease(latest, `${orderedFiles.length} masters protegidos y enlazados al tracklist.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La carga múltiple se detuvo.");
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  const uploadSingleMaster = async (track: DistributionTrack, file: File) => {
    try {
      validateMasterFile(file);
      await run(() => distributionService.uploadMasterMultipart(release!.id, track.id, file, (percent) => setUploadProgress(`${track.title} · ${percent}%`)), `${track.title}: master protegido.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "El master no es válido.");
    } finally {
      setUploadProgress("");
    }
  };

  const uploadArtwork = async (file: File) => {
    setSaving(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (width !== height) throw new Error(`La portada mide ${width}×${height}. Debe ser cuadrada.`);
      if (width < 3000) throw new Error(`La portada mide ${width}×${height}. El mínimo entregable es 3000×3000.`);
      const result = await distributionService.uploadAsset(release!.id, "artwork", file);
      replaceRelease(result.release, `Portada ${width}×${height} protegida en R2.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos validar la portada.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRelease = async () => {
    if (!release || !window.confirm(`¿Eliminar definitivamente el borrador “${release.title}”?`)) return;
    setSaving(true);
    setError("");
    try {
      await distributionService.deleteRelease(release.id);
      setRelease(null);
      setSelectedId("");
      await loadIndex();
      setNotice("Borrador eliminado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos eliminar el borrador.");
    } finally {
      setSaving(false);
    }
  };

  const patchRelease = (field: keyof DistributionRelease, value: unknown) => {
    setRelease((current) => current ? { ...current, [field]: value } : current);
  };

  const toggleStore = (store: string) => {
    setRelease((current) => current ? {
      ...current,
      stores: current.stores.includes(store) ? current.stores.filter((item) => item !== store) : [...current.stores, store]
    } : current);
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

  const patchDetailedContributors = (trackId: string, role: DistributionContributor["role"], value: string) => {
    setRelease((current) => current ? {
      ...current,
      tracks: current.tracks.map((track) => track.id === trackId ? {
        ...track,
        contributors: [...track.contributors.filter((item) => item.role !== role), ...parseContributorDetails(value, role)]
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
        <div className="provider-signal"><span className={`provider-dot ${index.provider.ready ? "ready" : ""}`} /><div><small>DELIVERY RAIL</small><strong>{index.provider.name}</strong><em>{index.provider.status === "configuration_required" ? "Faltan credenciales del partner" : index.provider.mode === "sandbox" ? "Simulación segura activa" : "Conexión server-to-server activa"}</em></div></div>
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

      {(user?.role === "admin" || finance?.statements.length || finance?.payouts.length || Number(finance?.balances[0]?.available_micros || 0) > 0) ? (
        <section className="distribution-finance-grid">
          {user?.role === "admin" && <article className="card distribution-statement-import">
            <div className="eyebrow">NNE FINANCE · INGESTA NORMALIZADA</div>
            <h3>Importar regalías por CSV</h3>
            <p>Convierte primero el reporte del partner a este formato. El ledger guarda dinero real en micros y nunca entrega NNE Credits.</p>
            <button type="button" className="secondary-button" onClick={downloadStatementTemplate}>Descargar plantilla CSV</button>
            <form onSubmit={importStatement}>
              <input className="field" name="provider_key" required placeholder="Proveedor · ej. partner_x" />
              <input className="field" name="external_statement_id" required placeholder="ID único del reporte" />
              <label>Desde<input className="field" name="period_start" type="date" required /></label>
              <label>Hasta<input className="field" name="period_end" type="date" required /></label>
              <input className="field" name="currency" defaultValue="USD" maxLength={3} required aria-label="Moneda" />
              <label className="statement-file">CSV normalizado<input name="statement_csv" type="file" accept=".csv,text/csv" required /></label>
              <button className="primary-button" disabled={saving}>{saving ? "Importando…" : "Importar al ledger"}</button>
            </form>
          </article>}
          <article className="card distribution-ledger">
            <div className="eyebrow">STATEMENTS DSP</div>
            <h3>Reportes recibidos</h3>
            {finance?.statements.map((statement) => <div key={statement.id}><span><strong>{statement.provider_key}</strong><small>{statement.period_start} → {statement.period_end} · {statement.line_count} líneas</small></span><b>{formatMoney(statement.net_micros, statement.currency)}</b></div>)}
            {!finance?.statements.length && <p>Todavía no hay reportes importados.</p>}
          </article>
          <article className="card distribution-payouts">
            <div className="eyebrow">PAYOUTS</div>
            <h3>Solicitar retiro</h3>
            {user?.role !== "admin" && Number(finance?.balances[0]?.available_micros || 0) > 0 && <form onSubmit={requestPayout}>
              <select className="field" name="artist_id" required>{index.artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select>
              <input name="amount" className="field" type="number" min="0.01" step="0.01" required placeholder="Monto" />
              <input name="currency" type="hidden" value={finance?.balances[0]?.currency || "USD"} />
              <select className="field" name="method"><option value="manual">Método acordado con NNE</option><option value="paypal">PayPal</option><option value="wire">Transferencia</option></select>
              <input name="destination_hint" className="field" placeholder="Alias o referencia; nunca contraseña" />
              <button className="primary-button" disabled={saving}>Enviar solicitud</button>
            </form>}
            {finance?.payouts.map((payout) => <div className="payout-row" key={payout.id}><span><strong>{payout.artist_name}</strong><small>{payout.status} · {formatRelativeDate(payout.requested_at)}</small></span><b>{formatMoney(payout.amount_micros, payout.currency)}</b>{user?.role === "admin" && <span className="payout-actions">
              {payout.status === "requested" && <><button disabled={saving} onClick={() => void updatePayout(payout.id, "approved")}>Aprobar</button><button disabled={saving} onClick={() => void updatePayout(payout.id, "cancelled")}>Cancelar</button></>}
              {payout.status === "approved" && <button disabled={saving} onClick={() => void updatePayout(payout.id, "processing")}>Procesar</button>}
              {payout.status === "processing" && <><button disabled={saving} onClick={() => void updatePayout(payout.id, "paid")}>Marcar pagado</button><button disabled={saving} onClick={() => void updatePayout(payout.id, "failed")}>Falló</button></>}
              {payout.status === "failed" && <button disabled={saving} onClick={() => void updatePayout(payout.id, "processing")}>Reintentar</button>}
            </span>}</div>)}
            {!finance?.payouts.length && <p>No hay retiros solicitados.</p>}
          </article>
        </section>
      ) : null}

      {user?.role === "admin" && (
        <section className="card distribution-onboarding">
          <div><div className="eyebrow">ARTIST ACCESS</div><h3>Crea el catálogo. Invita al equipo.</h3><p>Cada artista nace en un espacio separado. El enlace de acceso es de un solo uso y nunca abre catálogos ajenos.</p></div>
          <div className="distribution-onboarding-forms">
            <form onSubmit={createArtist}>
              <strong>1 · Nuevo perfil</strong>
              <input className="field" name="name" required placeholder="Nombre artístico" />
              <input className="field" name="instagram_handle" placeholder="@Instagram" />
              <input className="field" name="country_code" maxLength={2} placeholder="País · VE" />
              <input className="field" name="primary_genre" defaultValue="Latin Urban" placeholder="Género" />
              <button disabled={saving}>Crear catálogo</button>
            </form>
            <form onSubmit={createArtistInvite}>
              <strong>2 · Acceso privado</strong>
              <select className="field" name="artist_id" required>{index.artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select>
              <input className="field" name="email" type="email" placeholder="Correo del artista" />
              <input className="field" name="username" placeholder="@username (opcional)" />
              <select className="field" name="role"><option value="artist">Artista</option><option value="manager">Manager</option></select>
              <button className="primary-button" disabled={saving}>Crear link de acceso</button>
            </form>
          </div>
          {inviteUrl && <div className="distribution-invite-result"><code>{inviteUrl}</code><button onClick={() => void navigator.clipboard.writeText(inviteUrl)}>Copiar link</button></div>}
        </section>
      )}

      <section className="card distribution-artist-identities">
        <div><div className="eyebrow">ARTIST IDENTITY</div><h3>Identidades oficiales en las tiendas</h3><p>Guarda los IDs existentes para evitar que un lanzamiento termine en el perfil equivocado.</p></div>
        <div className="distribution-artist-identity-list">
          {index.artists.map((artist) => <details key={artist.id}>
            <summary><strong>{artist.name}</strong><span>{artist.spotify_artist_id || artist.apple_music_artist_id ? "DSP enlazados" : "Completar IDs"}</span></summary>
            <form onSubmit={updateArtist}>
              <input name="artist_id" type="hidden" value={artist.id} />
              <input className="field" name="name" defaultValue={artist.name} required placeholder="Nombre artístico" />
              <input className="field" name="instagram_handle" defaultValue={artist.instagram_handle || ""} placeholder="@Instagram" />
              <input className="field" name="country_code" defaultValue={artist.country_code || ""} maxLength={2} placeholder="País · VE" />
              <input className="field" name="primary_genre" defaultValue={artist.primary_genre || ""} placeholder="Género principal" />
              <input className="field" name="spotify_artist_id" defaultValue={artist.spotify_artist_id || ""} placeholder="Spotify Artist ID" />
              <input className="field" name="apple_music_artist_id" defaultValue={artist.apple_music_artist_id || ""} placeholder="Apple Music Artist ID" />
              <button className="primary-button" disabled={saving}>Guardar identidad</button>
            </form>
          </details>)}
        </div>
      </section>

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
                {(["draft", "changes_requested"].includes(release.status)) && <label className="cover-upload">Subir portada<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadArtwork(file); }} /></label>}
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
                <label className="wide">Territorios<input className="field" value={release.territories.join(", ")} onChange={(event) => patchRelease("territories", event.target.value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean))} placeholder="WORLDWIDE o US, VE, MX" /></label>
                <fieldset className="wide distribution-store-picker"><legend>Plataformas</legend>{storeOptions.map(([value, label]) => <label key={value}><input type="checkbox" checked={release.stores.includes(value)} onChange={() => toggleStore(value)} />{label}</label>)}</fieldset>
              </div>
            </section>

            <section className="card distribution-section">
              <div className="distribution-section-title"><div><span>02</span><div><h3>Tracklist + masters</h3><p>WAV/FLAC privados. Nunca quedan en una URL pública.</p></div></div><b>{release.tracks.filter((track) => track.master_ready).length}/{release.tracks.length}</b></div>
              {(["draft", "changes_requested"].includes(release.status)) && <div className="bulk-master-upload"><div><strong>Subir masters en lote</strong><small>Nombra los archivos 01, 02, 03… El sistema los ordena y los enlaza con el tracklist.</small></div><label>{uploadProgress || "Elegir WAV/FLAC"}<input type="file" multiple disabled={saving} accept="audio/wav,audio/flac" onChange={(event) => void uploadAlbumMasters(event.target.files)} /></label></div>}
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
                    onDetailedContributors={(role, value) => patchDetailedContributors(track.id, role, value)}
                    onSplits={(value) => patchTrack(track.id, "splits", parseSplits(value))}
                    onUpload={(file) => void uploadSingleMaster(track, file)}
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
                  <details className="distribution-agreement-summary">
                    <summary>Leer autorización operativa del piloto</summary>
                    <div>
                      <p>Autorizas de forma no exclusiva a NOSOTROSNOELLOS NNE LLC a almacenar y entregar este release y su metadata al proveedor de distribución seleccionado.</p>
                      <p>Conservas la propiedad de tus masters. Confirmas que cuentas con permisos para beats, samples, voces, composiciones, portada y colaboradores declarados.</p>
                      <p>Los ingresos DSP se registran como regalías monetarias separadas de NNE Credits. Comisión, plazo de pago y demás términos comerciales deben formalizarse antes de cualquier entrega real.</p>
                      <p>Puedes solicitar un retiro desde esta plataforma. NNE mantiene evidencia de aceptación, cambios, entregas y solicitudes para proteger a todas las partes.</p>
                      <small>Versión operativa: {release.agreement_version || "nne-distribution-pilot-2026-09"} · Requiere acuerdo comercial/legal definitivo antes de producción.</small>
                    </div>
                  </details>
                  <label><input type="checkbox" checked={release.rights_confirmed} onChange={(event) => patchRelease("rights_confirmed", event.target.checked)} /><span><strong>Tengo autorización para distribuir estos masters.</strong><small>No contienen samples, beats o grabaciones sin los permisos correspondientes.</small></span></label>
                  <label><input type="checkbox" checked={release.agreement_accepted} disabled={release.agreement_accepted} onChange={(event) => patchRelease("agreement_accepted", event.target.checked)} /><span><strong>Acepto esta autorización operativa del piloto.</strong><small>La aceptación queda versionada con fecha, usuario, IP y dispositivo.</small></span></label>
                </div>
              )}
              <div className="distribution-actions">
                {(["draft", "changes_requested"].includes(release.status)) && <><button className="primary-button" disabled={saving} onClick={save}>Guardar cambios</button><button disabled={saving || !release.readiness.ready} onClick={() => void run(() => distributionService.submit(release.id), "Enviado al equipo de distribución.")}>Enviar a revisión</button><button className="danger-button" disabled={saving} onClick={() => void deleteRelease()}>Eliminar borrador</button></>}
                {user?.role === "admin" && release.status === "in_review" && <><button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "approve"), "Release aprobado por NNE.")}>Aprobar release</button><button disabled={saving} onClick={() => { const note = window.prompt("Correcciones requeridas:"); if (note) void run(() => distributionService.review(release.id, "request_changes", note), "Correcciones enviadas."); }}>Pedir correcciones</button></>}
                {user?.role === "admin" && release.status === "approved" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "package"), "Paquete de distribución generado.")}>Generar paquete DSP</button>}
                {user?.role === "admin" && release.status === "packaged" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "deliver"), release.provider?.mode === "sandbox" ? "Sandbox aceptó la simulación." : "Proveedor aceptó la entrega.")}>{release.provider?.mode === "sandbox" ? "Simular entrega" : "Entregar al proveedor"}</button>}
                {user?.role === "admin" && release.status === "delivered_demo" && <button className="primary-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "mark_live_demo"), "Release marcado live en la demo.")}>Simular publicación</button>}
                {(["delivered", "live", "delivered_demo", "live_demo"].includes(release.status)) && <button className="danger-button" disabled={saving} onClick={() => { const reason = window.prompt("Motivo del retiro (mínimo 10 caracteres):"); if (reason) void run(() => distributionService.requestTakedown(release.id, reason), "Solicitud de retiro registrada para revisión."); }}>Solicitar retiro</button>}
                {user?.role === "admin" && release.status === "takedown_requested" && <button className="danger-button" disabled={saving} onClick={() => void run(() => distributionService.review(release.id, "send_takedown"), release.provider?.mode === "sandbox" ? "Retiro sandbox completado." : "Solicitud enviada al proveedor.")}>Procesar retiro</button>}
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

function TrackEditor({ track, locked, busy, onField, onContributors, onDetailedContributors, onSplits, onUpload, onDelete }: {
  track: DistributionTrack;
  locked: boolean;
  busy: boolean;
  onField: (field: keyof DistributionTrack, value: unknown) => void;
  onContributors: (role: DistributionContributor["role"], value: string) => void;
  onDetailedContributors: (role: DistributionContributor["role"], value: string) => void;
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
          <label>Artista principal<input className="field" disabled={locked} value={contributorsText(track, "primary_artist")} onChange={(event) => onContributors("primary_artist", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Featuring<input className="field" disabled={locked} value={contributorsText(track, "featured_artist")} onChange={(event) => onContributors("featured_artist", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Productores<input className="field" disabled={locked} value={contributorsText(track, "producer")} onChange={(event) => onContributors("producer", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Ing. de mezcla<input className="field" disabled={locked} value={contributorsText(track, "mix_engineer")} onChange={(event) => onContributors("mix_engineer", event.target.value)} placeholder="Separados por coma" /></label>
          <label>Ing. de mastering<input className="field" disabled={locked} value={contributorsText(track, "mastering_engineer")} onChange={(event) => onContributors("mastering_engineer", event.target.value)} placeholder="Separados por coma" /></label>
          <label className="wide">Compositores · Nombre | IPI/CAE | PRO | Publisher<textarea className="field" disabled={locked} value={contributorDetailsText(track, "songwriter")} onChange={(event) => onDetailedContributors("songwriter", event.target.value)} placeholder={"Nombre legal | IPI/CAE | ASCAP/BMI/SACVEN | Publisher\nOtro compositor | | |"} /></label>
          <label className="distribution-track-flags"><span><input type="checkbox" disabled={locked} checked={track.explicit_content} onChange={(event) => onField("explicit_content", event.target.checked)} /> Explícito</span><span><input type="checkbox" disabled={locked} checked={track.instrumental} onChange={(event) => onField("instrumental", event.target.checked)} /> Instrumental</span></label>
          <label className="wide">Splits del master<textarea className="field" disabled={locked} value={splitsText(track)} onChange={(event) => onSplits(event.target.value)} placeholder={"Nombre | 50 | email opcional\nOtro nombre | 50"} /><small className={Math.abs(splitTotal - 100) < .001 ? "split-valid" : "split-invalid"}>Total: {splitTotal}%</small></label>
        </div>
        <div className="track-file-row"><div><small>MASTER ENTREGABLE</small><strong>{track.master_original_name || "WAV/FLAC pendiente"}</strong></div>{!locked && <><label className="file-button">{track.master_ready ? "Reemplazar" : "Subir master"}<input type="file" disabled={busy} accept="audio/wav,audio/flac" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); }} /></label><button className="danger-button" onClick={onDelete}>Eliminar</button></>}</div>
      </div>}
    </article>
  );
}
