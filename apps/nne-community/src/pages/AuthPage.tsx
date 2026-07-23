import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login(String(data.get("identifier") || ""), String(data.get("password") || ""));
      } else {
        await signup({
          name: String(data.get("name") || ""),
          username: String(data.get("username") || ""),
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
          referral_code: String(data.get("referral_code") || ""),
          company_website: String(data.get("company_website") || "")
        });
      }
      const from = (location.state as { from?: string } | null)?.from || "/";
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos continuar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark">NN</div>
        <div className="eyebrow">NNE Community</div>
        <h1>Move different.</h1>
        <p>Acciones reales. Progreso visible. Acceso que se gana.</p>
      </section>
      <section className="card auth-card">
        <div className="eyebrow">{mode === "login" ? "Bienvenido de vuelta" : "Entra al movimiento"}</div>
        <h2>{mode === "login" ? "Inicia sesión." : "Crea tu cuenta NNE."}</h2>
        <p className="auth-note">Tu cuenta NNE es independiente de cualquier cuenta BOOSTR.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit} className="form-stack">
          {mode === "signup" && (
            <>
              <label>Nombre o nombre artístico<input name="name" className="field" required autoComplete="name" /></label>
              <label>Username<input name="username" className="field" required minLength={3} autoComplete="username" /></label>
              <input name="company_website" className="honeypot" tabIndex={-1} autoComplete="off" />
            </>
          )}
          <label>{mode === "login" ? "Email o username" : "Email"}
            <input
              name={mode === "login" ? "identifier" : "email"}
              type={mode === "login" ? "text" : "email"}
              className="field"
              required
              autoComplete={mode === "login" ? "username" : "email"}
            />
          </label>
          <label>Contraseña<input name="password" type="password" className="field" required minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "signup" && (
            <label>Código de invitación <span>(opcional)</span>
              <input name="referral_code" className="field" defaultValue={searchParams.get("ref") || ""} />
            </label>
          )}
          <button className="primary-button full" disabled={busy}>
            {busy ? "Conectando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "¿Todavía no tienes cuenta? " : "¿Ya eres parte? "}
          <Link to={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </Link>
        </p>
      </section>
    </main>
  );
}
