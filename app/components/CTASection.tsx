"use client";

import Particles from "./Particles";

const AIRTABLE_LINK = ""; // TODO: Add Airtable link

export default function CTASection() {
  return (
    <section className="cta-section">
      <Particles count={25} />

      {/* Decorative rings */}
      <div className="cta-ring cta-ring-outer" />
      <div className="cta-ring cta-ring-inner" />

      <div className="container-sm" style={{ position: "relative", zIndex: 1 }}>
        {/* Label */}
        <div className="animate-fade-in-up badge badge-red" style={{ marginBottom: "var(--space-12)" }}>
          <span className="animate-spark" style={{ fontSize: "12px" }}>✦</span>
          START NOW
        </div>

        {/* Heading */}
        <h2 className="animate-fade-in-up delay-100 heading-display" style={{ marginBottom: "var(--space-10)" }}>
          <span
            className="heading-display-italic"
            style={{
              display: "block",
              fontSize: "clamp(44px, 6vw, 80px)",
            }}
          >
            Go
          </span>
          <span
            className="heading-display-bold"
            style={{
              display: "block",
              fontSize: "clamp(44px, 6vw, 80px)",
            }}
          >
            with{" "}
            <span className="animate-glow-gold" style={{ color: "var(--gold)" }}>
              XD
            </span>
          </span>
        </h2>

        <p
          className="animate-fade-in-up delay-200 text-body"
          style={{
            marginBottom: "var(--space-15)",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Live liquidity. Minimal friction.
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-in-up delay-300"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-7)",
            flexWrap: "wrap",
          }}
        >
          <a
            href={AIRTABLE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid-red animate-glow-red"
          >
            JOIN XD
          </a>

          <a href="#platforms" className="btn btn-outline-gold">
            STACK
          </a>
        </div>

        {/* Trust badges */}
        <div className="animate-fade-in-up delay-400 cta-stats">
          {[
            { label: "$420M+", sub: "Volume" },
            { label: "99.9%", sub: "Uptime" },
            { label: "0.008%", sub: "Spread" },
            { label: "2+", sub: "DEXes" },
          ].map((item, i) => (
            <div key={i} className={`cta-stat ${i > 0 ? "cta-stat-divider" : ""}`}>
              <div className="stat-value" style={{ fontSize: "var(--text-6xl)" }}>
                {item.label}
              </div>
              <div className="stat-label">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
