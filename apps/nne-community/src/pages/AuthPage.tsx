import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/users";
import type { ReferralPreview } from "../types";
import { CollabBrand } from "../components/CollabBrand";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [referralPreview, setReferralPreview] = useState<ReferralPreview | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const referralCode = mode === "signup" ? String(searchParams.get("ref") || "").trim() : "";

  useEffect(() => {
    let active = true;
    if (!referralCode) {
      setReferralPreview(null);
      setReferralError("");
      setReferralLoading(false);
      return () => { active = false; };
    }

    setReferralLoading(true);
    setReferralError("");
    usersService.referralPreview(referralCode)
      .then((preview) => {
        if (active) setReferralPreview(preview);
      })
      .catch((caught) => {
        if (!active) return;
        setReferralPreview(null);
        setReferralError(caught instanceof Error ? caught.message : "Esta invitación no está disponible.");
      })
      .finally(() => {
        if (active) setReferralLoading(false);
      });

    return () => { active = false; };
  }, [referralCode]);

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
        const result = await signup({
          name: String(data.get("name") || ""),
          username: String(data.get("username") || ""),
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
          artist_role: String(data.get("artist_role") || "") as any,
          country: String(data.get("country") || ""),
          city: String(data.get("city") || ""),
          instagram_handle: String(data.get("instagram_handle") || ""),
          whatsapp_contact: String(data.get("whatsapp_contact") || ""),
          telegram_handle: String(data.get("telegram_handle") || ""),
          primary_contact: String(data.get("primary_contact") || "") as any,
          bio: String(data.get("bio") || ""),
          promo_code: String(data.get("promo_code") || ""),
          referral_code: referralPreview?.code || "",
          company_website: String(data.get("company_website") || "")
        });
        setApplicationMessage(result.message);
        event.currentTarget.reset();
        return;
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
        <CollabBrand />
        <div className="eyebrow">NNE × WESTDETRO Community</div>
        <h1>Hazlo real.</h1>
        <p>Cumple tareas cortas, farmea NNE Credits y cámbialos por ropa, beats, producciones y otros rewards sin sacar dinero de tu bolsillo.</p>
        <p className="auth-brand-secondary">También hacemos sorteos para los miembros que se mantienen activos.</p>
        <strong className="auth-manifesto">De artistas haciéndolo real, para artistas que quieren hacerlo real.</strong>
      </section>
      <section className="card auth-card">
        <div className="eyebrow">{mode === "login" ? "Bienvenido de vuelta" : "Entra al movimiento"}</div>
        <h2>{mode === "login" ? "Inicia sesión." : "Crea tu cuenta NNE × WESTDETRO."}</h2>
        <p className="auth-note">Tu cuenta NNE es independiente de cualquier cuenta BOOSTR.</p>
        {applicationMessage && (
          <div className="application-success">
            <div className="eyebrow">Solicitud recibida</div>
            <h3>Ahora la revisamos nosotros.</h3>
            <p>{applicationMessage}</p>
            <Link className="primary-button full button-link" to="/login">Volver al inicio</Link>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        {mode === "signup" && referralCode && (
          <aside className={`referral-invite ${referralError ? "invalid" : ""}`}>
            {referralLoading ? (
              <>
                <div className="eyebrow">Validando invitación</div>
                <strong>Conectando la señal…</strong>
              </>
            ) : referralPreview ? (
              <>
                <div className="eyebrow">Invitación activa</div>
                <strong>Referido por {referralPreview.referrer.handle}</strong>
                <p>Al crear tu cuenta, ambos reciben:</p>
                <div className="referral-benefits">
                  <span>+{referralPreview.reward.credits.toLocaleString()} NNE Credits</span>
                  <span>+{referralPreview.reward.xp.toLocaleString()} XP</span>
                </div>
                <small>Tu progreso empieza con ventaja. El suyo crece contigo.</small>
              </>
            ) : (
              <>
                <div className="eyebrow">Invitación no disponible</div>
                <strong>{referralError}</strong>
                <Link to="/signup">Continuar sin invitación</Link>
              </>
            )}
          </aside>
        )}
        {!applicationMessage && <form onSubmit={submit} className="form-stack">
          {mode === "signup" && (
            <>
              <label>Nombre o nombre artístico<input name="name" className="field" required autoComplete="name" /></label>
              <label>Username<input name="username" className="field" required minLength={3} autoComplete="username" /></label>
              <div className="form-grid">
                <label>¿Qué haces?<select name="artist_role" className="field" required defaultValue="">
                  <option value="" disabled>Selecciona</option><option value="artist">Artista</option><option value="producer">Productor/a</option><option value="engineer">Ingeniero/a</option><option value="designer">Diseñador/a</option><option value="manager">Manager</option><option value="fan">Fan / comunidad</option><option value="other">Otro</option>
                </select></label>
                <label>País<input name="country" className="field" required autoComplete="country-name" /></label>
              </div>
              <label>Ciudad <span>(opcional)</span><input name="city" className="field" autoComplete="address-level2" /></label>
              <div className="application-contact-grid">
                <label>Instagram<input name="instagram_handle" className="field" placeholder="@usuario" /></label>
                <label>WhatsApp<input name="whatsapp_contact" className="field" placeholder="+1 000 000 0000" inputMode="tel" /></label>
                <label>Telegram<input name="telegram_handle" className="field" placeholder="@usuario" /></label>
              </div>
              <label>¿Dónde te contactamos?<select name="primary_contact" className="field" required defaultValue="instagram">
                <option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option>
              </select></label>
              <label>Cuéntanos brevemente quién eres<textarea name="bio" className="field" required minLength={20} maxLength={800} placeholder="Tu proyecto, lo que haces y qué buscas dentro de la comunidad." /></label>
              <label>Código promocional <span>(opcional)</span><input name="promo_code" className="field" placeholder="PRIMEROS50" /></label>
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
          {mode === "login" && <Link className="forgot-password-link" to="/forgot-password">¿Olvidaste tu contraseña?</Link>}
          <button
            className="primary-button full"
            disabled={busy || Boolean(referralCode && (referralLoading || !referralPreview))}
          >
            {busy ? "Enviando…" : mode === "login" ? "Entrar" : "Enviar solicitud"}
          </button>
        </form>}
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
