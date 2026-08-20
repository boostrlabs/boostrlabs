import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CollabBrand } from "../components/CollabBrand";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/users";

function RecoveryBrand() {
  return (
    <section className="auth-brand recovery-brand">
      <CollabBrand />
      <div className="eyebrow">NNE × WESTDETRO Community</div>
      <h1>Hazlo real.</h1>
      <p>Cumple tareas cortas, farmea NNE Credits y cámbialos por ropa, beats, producciones y otros rewards sin sacar dinero de tu bolsillo.</p>
      <p className="auth-brand-secondary">También habrá drops y oportunidades especiales para los miembros que se mantienen activos.</p>
      <strong className="auth-manifesto">De artistas haciéndolo real, para artistas que quieren hacerlo real.</strong>
    </section>
  );
}

export function ForgotPasswordPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (channel === "sms") return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setMessage(await usersService.requestPasswordReset(String(data.get("identifier") || ""), channel));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos enviar el enlace.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <RecoveryBrand />
      <section className="card auth-card recovery-card">
        <div className="eyebrow">Recupera tu acceso</div>
        <h2>Vuelve a entrar.</h2>
        <p className="auth-note">Elige cómo quieres recuperar tu cuenta.</p>
        <div className="recovery-methods" role="tablist" aria-label="Método de recuperación">
          <button className={channel === "email" ? "active" : ""} type="button" onClick={() => setChannel("email")}>Correo</button>
          <button className={channel === "sms" ? "active" : ""} type="button" onClick={() => setChannel("sms")}>WhatsApp <small>próximamente</small></button>
        </div>
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
        {channel === "email" ? (
          <form onSubmit={submit} className="form-stack">
            <label>Email o username<input name="identifier" className="field" required autoComplete="username" /></label>
            <button className="primary-button full" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</button>
          </form>
        ) : (
          <div className="sms-coming-soon">
            <strong>Recuperación por WhatsApp</strong>
            <p>La activaremos cuando cada usuario pueda verificar su número con un código de seis dígitos. Así nadie podrá usar un teléfono ajeno para tomar una cuenta.</p>
          </div>
        )}
        <p className="auth-switch"><Link to="/login">Volver a iniciar sesión</Link></p>
      </section>
    </main>
  );
}

export function ResetPasswordPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmation") || "");
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await usersService.resetPassword(token, password);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <RecoveryBrand />
      <section className="card auth-card recovery-card">
        <div className="eyebrow">Nueva contraseña</div>
        <h2>{done ? "Listo." : "Protege tu cuenta."}</h2>
        {done ? (
          <>
            <div className="form-success">Tu contraseña fue actualizada y las sesiones anteriores quedaron cerradas.</div>
            <Link className="primary-button full button-link" to="/login">Iniciar sesión</Link>
          </>
        ) : (
          <>
            {!token && <div className="form-error">Este enlace está incompleto. Solicita uno nuevo.</div>}
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={submit} className="form-stack">
              <label>Nueva contraseña<input name="password" type="password" className="field" required minLength={10} autoComplete="new-password" /></label>
              <label>Confirma la contraseña<input name="confirmation" type="password" className="field" required minLength={10} autoComplete="new-password" /></label>
              <button className="primary-button full" disabled={busy || !token}>{busy ? "Guardando…" : "Cambiar contraseña"}</button>
            </form>
            <p className="auth-switch"><Link to="/forgot-password">Solicitar otro enlace</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
