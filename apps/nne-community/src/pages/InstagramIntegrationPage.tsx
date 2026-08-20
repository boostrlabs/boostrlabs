import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function InstagramIntegrationPage() {
  const [params] = useSearchParams();
  const connected = params.get("connected") === "1";
  const username = params.get("username") || "";
  const accountType = params.get("account_type") || "Professional";
  const profilePicture = params.get("profile_picture_url") || "";
  const error = params.get("error") || "";

  const errorText = useMemo(() => {
    if (!error) return "";
    if (error === "oauth_state") return "The Instagram authorization session expired or could not be verified. Please try again.";
    if (error === "not_configured") return "Instagram Business Login is not configured yet.";
    if (error === "token_exchange") return "Instagram could not complete the authorization. Please try again.";
    if (error === "profile_fetch") return "The account connected, but its professional profile information could not be loaded.";
    return "Instagram authorization could not be completed. Please try again.";
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", background: "#090909", color: "#f5f5f5", padding: "32px 18px", fontFamily: "Inter, Arial, sans-serif" }}>
      <section style={{ width: "min(720px, 100%)", margin: "0 auto" }}>
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", opacity: .65, marginBottom: 10 }}>NNE × WESTDETRO</div>
        <h1 style={{ fontSize: "clamp(32px, 7vw, 56px)", lineHeight: .98, margin: "0 0 16px", letterSpacing: "-.04em" }}>Instagram Business Integration</h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, opacity: .78, marginBottom: 30 }}>
          Connect an Instagram professional account to enable authorized messaging and comment-management features inside NNE × WESTDETRO.
        </p>

        {errorText && (
          <div style={{ border: "1px solid #633", background: "#1b1010", padding: 16, borderRadius: 14, marginBottom: 20 }}>
            {errorText}
          </div>
        )}

        {!connected ? (
          <div style={{ border: "1px solid #2c2c2c", borderRadius: 20, padding: 22, background: "#111" }}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Connect a professional account</h2>
            <p style={{ opacity: .72, lineHeight: 1.55 }}>
              You will be redirected to Instagram to authorize access. NNE × WESTDETRO never asks for or stores your Instagram password.
            </p>
            <a
              href="/api/nne/integrations/instagram/start"
              style={{ display: "inline-block", marginTop: 8, background: "#fff", color: "#000", textDecoration: "none", fontWeight: 800, padding: "14px 20px", borderRadius: 999 }}
            >
              Connect Instagram
            </a>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #242424", fontSize: 14, lineHeight: 1.6, opacity: .62 }}>
              Requested permissions: basic professional profile information, messages, and comments. Access is only granted after the Instagram professional account explicitly authorizes the connection.
            </div>
          </div>
        ) : (
          <div style={{ border: "1px solid #2f4b38", borderRadius: 20, padding: 22, background: "#101713" }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 18 }}>Connected successfully</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {profilePicture ? (
                <img src={profilePicture} alt="Instagram professional profile" style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", border: "1px solid #444" }} />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center", background: "#222", fontSize: 28 }}>IG</div>
              )}
              <div>
                <div style={{ fontSize: 24, fontWeight: 850 }}>@{username || "instagram"}</div>
                <div style={{ opacity: .65, marginTop: 4 }}>{accountType} Instagram account</div>
              </div>
            </div>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #294031", lineHeight: 1.55, opacity: .76 }}>
              The authorized professional profile is now connected. NNE × WESTDETRO can use the approved Instagram permissions to support account identification, incoming messaging, and comment management.
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 13, opacity: .5 }}>
          Privacy: <a href="/privacy.html" style={{ color: "inherit" }}>nne.westdetro.com/privacy.html</a>
        </div>
      </section>
    </main>
  );
}
