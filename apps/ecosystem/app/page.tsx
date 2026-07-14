const sections = [
  "Audit 60s",
  "Lead Pipeline",
  "Partner Profiles",
  "Partner Inventory",
  "Smart Links",
  "Payment Records"
];

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        margin: 0,
        padding: 32,
        color: "#f7f5ef",
        background:
          "radial-gradient(circle at 12% 0, rgba(56,185,255,.18), transparent 28%), #05070b",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gap: 24
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 10px",
              color: "#38b9ff",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: ".18em",
              textTransform: "uppercase"
            }}
          >
            BOOSTR Labs
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: 760,
              fontSize: "clamp(44px, 8vw, 92px)",
              lineHeight: ".9",
              letterSpacing: "-.07em"
            }}
          >
            Ecosystem Engine
          </h1>
        </div>
        <p style={{ maxWidth: 680, margin: 0, color: "rgba(247,245,239,.68)", lineHeight: 1.55 }}>
          Internal manager-first shell for BOOSTR data, partners, leads, payment records and
          module operations. Public routes remain in the Cloudflare Pages static app.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12
          }}
        >
          {sections.map((section) => (
            <div
              key={section}
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 18,
                padding: 16,
                background: "rgba(255,255,255,.045)"
              }}
            >
              <strong>{section}</strong>
              <p style={{ margin: "8px 0 0", color: "rgba(247,245,239,.55)", fontSize: 13 }}>
                Planned internal module.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
