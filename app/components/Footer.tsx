"use client";

const AIRTABLE_LINK = ""; // TODO: Add Airtable link

const footerLinks = {
  Protocol: ["Markets", "Stack", "Docs"],
  Community: ["Join", "X", "Discord"],
  Legal: ["Terms", "Privacy", "Risk"],
};

export default function Footer() {
  return (
    <footer className="footer">
      {/* Top accent line */}
      <div className="divider-gradient" />

      <div className="footer-inner">
        {/* Main footer grid */}
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ marginBottom: "var(--space-7)" }}>
              <div className="logo-text" style={{ fontSize: "var(--text-7xl)" }}>
                XD
              </div>
              <div className="logo-subtitle">LIQUIDITY</div>
            </div>

            <p className="text-body-sm" style={{ maxWidth: "260px", marginBottom: "var(--space-10)" }}>
              Deep liquidity for modern markets.
            </p>

            {/* Social-style badges */}
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              {["✕", "◎", "⬡"].map((icon, i) => (
                <a key={i} href="#" className="social-btn">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="section-label" style={{ marginBottom: "var(--space-9)" }}>
                {category.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {links.map((link) => (
                  <a key={link} href="#" className="footer-link">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA mini banner */}
        <div className="footer-cta-banner">
          <div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--text-5xl)",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}
            >
              Ready?
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-lg)",
                color: "var(--text-dim)",
                marginTop: "var(--space-1)",
              }}
            >
              Join XD.
            </div>
          </div>
          <a
            href={AIRTABLE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-red"
            style={{ whiteSpace: "nowrap" }}
          >
            JOIN XD
          </a>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-bar">
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-md)",
              color: "var(--text-ghost)",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            © 2026 XD Protocol.
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              color: "var(--text-ghost)",
            }}
          >
            Real-time liquidity.
          </div>
          <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
            {["★", "★", "★", "★", "★"].map((s, i) => (
              <span
                key={i}
                style={{ color: "var(--gold)", fontSize: "var(--text-base)", opacity: 0.6 }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
