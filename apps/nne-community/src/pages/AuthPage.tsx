import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/users";
import { ApiError } from "../services/api";
import type { ReferralPreview } from "../types";
import { CollabBrand } from "../components/CollabBrand";
import { RegistrationProfileFields } from "../components/RegistrationProfileFields";

const LEGACY_ROLE_BY_PROFESSION: Record<string, "artist" | "producer" | "engineer" | "designer" | "manager" | "fan" | "other"> = {
  nne_fam: "fan",
  artist: "artist",
  producer: "producer",
  composer: "artist",
  beatmaker: "producer",
  engineer: "engineer",
  songwriter: "artist",
  dj: "artist",
  a_and_r: "manager",
  manager: "manager",
  label: "manager",
  publisher: "manager",
  videographer: "designer",
  video_editor: "designer",
  director: "designer",
  photographer: "designer",
  designer: "designer",
  "3d_artist": "designer",
  content_creator: "designer",
  social_media: "manager",
  marketing: "manager",
  pr: "manager",
  playlist_curator: "fan",
  promoter: "manager",
  event_producer: "manager",
  dancer: "artist",
  stylist: "designer",
  makeup: "designer",
  musician: "artist",
  music_business: "manager",
  lawyer: "other",
  other: "other"
};

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [referralPreview, setReferralPreview] = useState<ReferralPreview | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const referralCode = mode === "signup" ? String(searchParams.get("ref") || "").trim() : "";
  const promoCode = mode === "signup" ? String(searchParams.get("promo") || "").trim().toUpperCase() : "";
  const adminInvite = mode === "signup" ? String(searchParams.get("admin_invite") || "").trim() : "";
  const invitedUsername = adminInvite ? String(searchParams.get("username") || "").trim().toLowerCase() : "";

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
      .then((preview) => { if (active) setReferralPreview(preview); })
      .catch((caught) => {
        if (!active) return;
        setReferralPreview(null);
        setReferralError(caught instanceof Error ? caught.message : "Esta invitación no está disponible.");
      })
      .finally(() => { if (active) setReferralLoading(false); });
    return () => { active = false; };
  }, [referralCode]);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setNeedsVerification(false);
    try {
      if (mode === "login") {
        await login(String(data.get("identifier") || ""), String(data.get("password") || ""));
        const from = (location.state as { from?: string } | null)?.from || "/";
        navigate(from, { replace: true });
        return;
      }

      const professions = data.getAll("professions").map((value) => String(value)).filter(Boolean);
      if (!professions.length) {
        setError("Selecciona al menos una profesión o NNE FAM.");
        return;
      }
      const artistRole = LEGACY_ROLE_BY_PROFESSION[professions[0]] || "other";

      const result = await signup({
        name: String(data.get("name") || ""),
        username: String(data.get("username") || ""),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
        artist_role: artistRole,
        professions,
        country: String(data.get("country") || ""),
        origin_country: String(data.get("origin_country") || ""),
        city: String(data.get("city") || ""),
        instagram_handle: String(data.get("instagram_handle") || ""),
        whatsapp_contact: String(data.get("whatsapp_contact") || ""),
        telegram_handle: String(data.get("telegram_handle") || ""),
        primary_contact: String(data.get("primary_contact") || "") as any,
        bio: String(data.get("bio") || ""),
        promo_code: String(data.get("promo_code") || ""),
        referral_code: referralPreview?.code || "",
        company_website: String(data.get("company_website") || ""),
        admin_invite: adminInvite || undefined
      });
      setApplicationMessage(result.message);
      event.currentTarget.reset();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "nne_email_verification_required") setNeedsVerification(true);
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
        <p className="auth-brand-secondary">También habrá drops y oportunidades especiales para los miembros que se mantienen activos.</p>
        <strong className="auth-manifesto">De artistas haciéndolo real, para artistas que quieren hacerlo real.</strong>
      </section>
      <section className="card auth-card">
        <div className="eyebrow">{mode === "login" ? "Bienvenido de vuelta" : "Entra al movimiento"}</div>
        <h2>{mode === "login" ? "Inicia sesión." : "Crea tu cuenta NNE × WESTDETRO."}</h2>
        <p className="auth-note">Tu cuenta NNE es independiente de cualquier cuenta BOOSTR.</p>
        {applicationMessage && (
          <div className="application-success">
            <div className="eyebrow">Confirma que eres tú</div>
            <h3>Revisa tu correo.</h3>
            <p>{applicationMessage}</p>
            <Link className="primary-button full button-link" to="/login">Volver al inicio</Link>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        {needsVerification && <Link className="primary-button full button-link" to="/verify-email">Reenviar correo de verificación</Link>}
        {mode === "signup" && adminInvite && (
          <aside className="referral-invite">
            <div className="eyebrow">Invitación privada</div>
            <strong>Acceso admin para @{invitedUsername || "usuario reservado"}</strong>
            <p>El rol se activa después de verificar el correo. Esta invitación funciona una sola vez.</p>
          </aside>
        )}
        {mode === "signup" && referralCode && (
          <aside className={`referral-invite ${referralError ? "invalid" : ""}`}>
            {referralLoading ? <><div className="eyebrow">Validando invitación</div><strong>Conectando la señal…</strong></> : referralPreview ? (
              <><div className="eyebrow">Invitación activa</div><strong>Referido por {referralPreview.referrer.handle}</strong><p>Cuando aprobemos tu cuenta, quien te invitó recibe:</p><div className="referral-benefits"><span>+{referralPreview.reward.credits.toLocaleString()} NNE Credits</span><span>+{referralPreview.reward.xp.toLocaleString()} XP</span></div><small>Si la promo de lanzamiento sigue disponible, tú recibes tus 3 NNE de bienvenida.</small></>
            ) : <><div className="eyebrow">Invitación no disponible</div><strong>{referralError}</strong><Link to="/signup">Continuar sin invitación</Link></>}
          </aside>
        )}
        {!applicationMessage && <form onSubmit={submit} className="form-stack">
          {mode === "signup" && (
            <>
              <label>Nombre o nombre artístico<input name="name" className="field" required autoComplete="name" /></label>
              <label>Tu @username público <span>(preferiblemente el de Instagram)</span><input name="username" className="field" required minLength={3} autoComplete="username" placeholder="tuusuario" defaultValue={invitedUsername} readOnly={Boolean(adminInvite && invitedUsername)} /></label>
              <RegistrationProfileFields />
              <div className="application-contact-grid">
                <label>Instagram<input name="instagram_handle" className="field" placeholder="@usuario" /></label>
                <label>WhatsApp<input name="whatsapp_contact" className="field" placeholder="+1 000 000 0000" inputMode="tel" /></label>
                <label>Telegram<input name="telegram_handle" className="field" placeholder="@usuario" /></label>
              </div>
              <p className="auth-note">Estas cuentas se registran inicialmente como no verificadas. NNE podrá verificarlas después por código de Instagram, bot de Telegram o API de WhatsApp.</p>
              <label>¿Dónde te contactamos?<select name="primary_contact" className="field" required defaultValue="instagram"><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></label>
              <label>Cuéntanos brevemente quién eres<textarea name="bio" className="field" required minLength={20} maxLength={800} placeholder="Tu proyecto, lo que haces y qué buscas dentro de la comunidad." /></label>
              {promoCode === "PRIMEROS50" ? <><aside className="launch-promo-inline"><strong>Primeros 50</strong><span>Si aprobamos tu solicitud mientras quedan cupos, empiezas con 3 NNE.</span></aside><input name="promo_code" type="hidden" value="PRIMEROS50" /></> : <label>Código promocional <span>(opcional)</span><input name="promo_code" className="field" placeholder="Código" /></label>}
              <input name="company_website" className="honeypot" tabIndex={-1} autoComplete="off" />
            </>
          )}
          <label>{mode === "login" ? "Email o username" : "Email"}<input name={mode === "login" ? "identifier" : "email"} type={mode === "login" ? "text" : "email"} className="field" required autoComplete={mode === "login" ? "username" : "email"} /></label>
          <label>Contraseña<input name="password" type="password" className="field" required minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "login" && <Link className="forgot-password-link" to="/forgot-password">¿Olvidaste tu contraseña?</Link>}
          {mode === "login" && <Link className="forgot-password-link" to="/verify-email">¿No te llegó la verificación?</Link>}
          <button className="primary-button full" disabled={busy || Boolean(referralCode && (referralLoading || !referralPreview))}>{busy ? "Enviando…" : mode === "login" ? "Entrar" : "Enviar solicitud"}</button>
        </form>}
        <p className="auth-switch">{mode === "login" ? "¿Todavía no tienes cuenta? " : "¿Ya eres parte? "}<Link to={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Regístrate" : "Inicia sesión"}</Link></p>
      </section>
    </main>
  );
}
