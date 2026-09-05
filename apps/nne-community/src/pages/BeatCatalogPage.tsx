import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { beatsService } from "../services/beats";
import { formatNne } from "../services/api";
import type { Beat } from "../types";

export function BeatCatalogPage() {
  const { dashboard, refreshDashboard, showToast } = useOutletContext<AppOutletContext>();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [activeId, setActiveId] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => setBeats(await beatsService.list());
  useEffect(() => {
    load().catch((error) => showToast(error instanceof Error ? error.message : "No pudimos abrir el catálogo."))
      .finally(() => setLoading(false));
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeAttribute("src");
    };
  }, []);

  const listen = async (beat: Beat) => {
    if (activeId === beat.id && audioRef.current) {
      audioRef.current.paused ? await audioRef.current.play() : audioRef.current.pause();
      setActiveId(audioRef.current.paused ? "" : beat.id);
      return;
    }
    setBusyId(beat.id);
    try {
      audioRef.current?.pause();
      const session = await beatsService.createListenSession(beat.id);
      const audio = new Audio(session.stream_url);
      audio.preload = "metadata";
      audio.setAttribute("controlsList", "nodownload noremoteplayback");
      audio.disableRemotePlayback = true;
      audio.addEventListener("ended", () => setActiveId(""), { once: true });
      audio.addEventListener("error", () => {
        setActiveId("");
        showToast("La sesión segura terminó. Presiona escuchar para renovarla.");
      }, { once: true });
      audioRef.current = audio;
      await audio.play();
      setActiveId(beat.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No pudimos abrir la sesión segura.");
    } finally {
      setBusyId("");
    }
  };

  const purchase = async (beat: Beat, licenseType: "lease" | "exclusive") => {
    const price = licenseType === "exclusive" ? beat.exclusivePriceCredits : beat.leasePriceCredits;
    if (!window.confirm(`Comprar licencia ${licenseType === "exclusive" ? "exclusiva" : "regular"} de ${beat.title} por ${formatNne(price || 0)} NNE?`)) return;
    setBusyId(beat.id);
    try {
      await beatsService.purchase(beat.id, licenseType);
      await Promise.all([load(), refreshDashboard()]);
      showToast("Licencia creada. El master ya pertenece a tu cuenta.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No pudimos completar la compra.");
    } finally {
      setBusyId("");
    }
  };

  const download = async (beat: Beat) => {
    setBusyId(beat.id);
    try {
      const session = await beatsService.createDownloadSession(beat.id);
      window.location.assign(session.download_url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No pudimos preparar el master.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <article className="card secure-listening-intro">
        <div>
          <div className="eyebrow">WESTDETRO SECURE LISTENING · BETA</div>
          <h2>El beat completo. Limpio. Protegido.</h2>
          <p>Escuchas desde una sesión privada conectada a tu cuenta. El archivo original nunca se publica y solo se desbloquea al comprar una licencia.</p>
        </div>
        <div className="secure-signals" aria-label="Protecciones activas">
          <span><b>01</b>R2 privado</span>
          <span><b>02</b>Sesión temporal</span>
          <span><b>03</b>Master bloqueado</span>
        </div>
      </article>

      <div className="section-heading">
        <h2>Beat Vault</h2>
        <span className="balance-pill">{formatNne(dashboard.user.credits)} NNE</span>
      </div>
      {loading && <div className="empty-state">Abriendo el vault seguro…</div>}
      <section className="beat-grid">
        {beats.map((beat) => (
          <article className={`card beat-card ${!beat.available ? "sold" : ""}`} key={beat.id}>
            <div className="beat-art">
              {beat.artworkUrl ? <img src={beat.artworkUrl} alt={beat.title} draggable={false} /> : <span>WD</span>}
              <button
                className={activeId === beat.id ? "beat-play active" : "beat-play"}
                disabled={!beat.streamReady || busyId === beat.id}
                onClick={() => void listen(beat)}
                aria-label={activeId === beat.id ? `Pausar ${beat.title}` : `Escuchar ${beat.title}`}
              >{busyId === beat.id ? "···" : activeId === beat.id ? "Ⅱ" : "▶"}</button>
            </div>
            <div className="beat-copy">
              <div className="beat-topline"><span>PROD. {beat.producerName}</span><span>{beat.bpm || "—"} BPM · {beat.musicalKey || "—"}</span></div>
              <h3>{beat.title}</h3>
              <p>{beat.description || "Escucha completa dentro de WESTDETRO Secure Listening."}</p>
              {beat.license ? (
                <div className="owned-license">
                  <div><small>Tu licencia</small><strong>{beat.license.licenseNumber}</strong></div>
                  <button className="primary-button" disabled={busyId === beat.id} onClick={() => void download(beat)}>Descargar master</button>
                </div>
              ) : (
                <div className="beat-actions">
                  {(beat.saleMode === "lease" || beat.saleMode === "both") && (
                    <button disabled={!beat.available || busyId === beat.id} onClick={() => void purchase(beat, "lease")}>
                      Licencia · {formatNne(beat.leasePriceCredits || 0)} NNE
                    </button>
                  )}
                  {(beat.saleMode === "exclusive" || beat.saleMode === "both") && (
                    <button className="exclusive" disabled={!beat.available || busyId === beat.id} onClick={() => void purchase(beat, "exclusive")}>
                      Exclusiva · {formatNne(beat.exclusivePriceCredits || 0)} NNE
                    </button>
                  )}
                  {!beat.available && <strong className="sold-label">VENDIDO</strong>}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
      {!loading && beats.length === 0 && (
        <div className="empty-state secure-empty"><strong>El Beat Vault está listo.</strong><span>Los primeros beats protegidos se están cargando desde Command Center.</span></div>
      )}
    </>
  );
}
