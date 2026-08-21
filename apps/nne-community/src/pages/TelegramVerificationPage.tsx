import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface TelegramVerificationStatus {
  channel: "telegram";
  status: "pending" | "challenge_sent" | "verified" | "failed" | "revoked";
  external_identifier?: string | null;
  challenge_expires_at?: string | null;
  verified_at?: string | null;
}

interface TelegramChallenge extends TelegramVerificationStatus {
  code: string;
  expires_at: string;
  instruction: string;
  bot_username?: string | null;
  bot_url?: string | null;
}

export function TelegramVerificationPage() {
  const [status, setStatus] = useState<TelegramVerificationStatus | null>(null);
  const [challenge, setChallenge] = useState<TelegramChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    try {
      const result = await apiRequest<TelegramVerificationStatus>("/integrations/telegram/verify/start");
      setStatus(result);
      if (result.status === "verified") setChallenge(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos consultar Telegram.");
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => {
    if (!challenge || status?.status === "verified") return;
    const timer = window.setInterval(() => void loadStatus(), 2500);
    return () => window.clearInterval(timer);
  }, [challenge, status?.status]);

  const startVerification = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<TelegramChallenge>("/integrations/telegram/verify/start", { method: "POST" });
      setChallenge(result);
      setStatus(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos iniciar la verificación.");
    } finally {
      setBusy(false);
    }
  };

  const openTelegram = () => {
    if (!challenge?.bot_url) return;
    window.location.href = challenge.bot_url;
  };

  const verified = status?.status === "verified";

  return (
    <>
      <article className="card" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Identidad NNE</div>
        <h2>Verifica tu Telegram.</h2>
        <p>Conecta tu cuenta de Telegram con tu usuario NNE para consultar saldo, chambas y rewards directamente desde el bot.</p>
      </article>

      <article className="card" style={{ display: "grid", gap: 18 }}>
        {error && <div className="form-error">{error}</div>}

        {verified ? (
          <div>
            <div className="eyebrow">Telegram verificado</div>
            <h2 style={{ marginBottom: 8 }}>Conectado.</h2>
            <p>
              {status?.external_identifier && status.external_identifier !== "pending"
                ? `Tu Telegram (${status.external_identifier}) ya está vinculado a esta cuenta NNE.`
                : "Tu Telegram ya está vinculado a esta cuenta NNE."}
            </p>
            <p>Ya puedes escribirle al bot: <strong>SALDO</strong>, <strong>CHAMBAS</strong> o <strong>REWARDS</strong>.</p>
          </div>
        ) : challenge ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="eyebrow">Código temporal · 10 minutos</div>
              <div style={{ fontSize: "clamp(42px, 10vw, 72px)", fontWeight: 900, letterSpacing: ".12em", lineHeight: 1.1 }}>
                {challenge.code}
              </div>
            </div>

            {challenge.bot_url ? (
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ marginBottom: 0 }}>
                  Abre {challenge.bot_username || "el bot oficial de NNE"}. El enlace lleva tu verificación preparada.
                </p>
                <button className="primary-button" onClick={openTelegram}>
                  Abrir Telegram y verificar
                </button>
                <small>En Telegram solo pulsa <strong>Start / Iniciar</strong>. NNE verificará automáticamente este código.</small>
              </div>
            ) : (
              <div>
                <p>Abre el bot oficial de NNE en Telegram y envía exactamente:</p>
                <code style={{ display: "block", padding: 14, border: "1px solid #333", borderRadius: 12, fontSize: 18 }}>
                  VERIFY {challenge.code}
                </code>
              </div>
            )}

            <details>
              <summary style={{ cursor: "pointer", opacity: .8 }}>Ver método manual</summary>
              <code style={{ display: "block", marginTop: 10, padding: 14, border: "1px solid #333", borderRadius: 12, fontSize: 18 }}>
                VERIFY {challenge.code}
              </code>
            </details>

            <small>Esta pantalla detectará automáticamente cuando Telegram quede verificado.</small>
            <button className="text-button" onClick={() => void loadStatus()}>Comprobar ahora</button>
          </div>
        ) : (
          <div>
            <p>Generaremos un código de un solo uso. No compartas ese código con otra persona.</p>
            <button className="primary-button" disabled={busy} onClick={() => void startVerification()}>
              {busy ? "Generando…" : "Verificar Telegram"}
            </button>
          </div>
        )}
      </article>
    </>
  );
}
