"use client";

import Image from "next/image";

const features = [
  {
    icon: "◈",
    title: "Risk Guard",
    desc: "Limits downside fast.",
    color: "var(--green-muted)",
    stat: "99.9%",
  },
  {
    icon: "🔥",
    title: "Fast Execution",
    desc: "Low-latency order routing.",
    color: "var(--orange)",
    stat: "<1ms",
  },
  {
    icon: "⬡",
    title: "Cross-Venue Sync",
    desc: "One strategy, many venues.",
    color: "var(--blue)",
    stat: "7 Venues",
  },
  {
    icon: "✕",
    title: "Adaptive Engine",
    desc: "Auto-tunes to market flow.",
    color: "var(--red)",
    stat: "∞ Power",
  },
];

export default function SeductiveSection() {
  return (
    <section className="seductive-section">
      {/* Separator */}
      <div className="divider-red-gold" />

      <div className="seductive-grid">
        {/* ====== LEFT: Image ====== */}
        <div className="animate-fade-in-left" style={{ position: "relative" }}>
          {/* Outer glow frame */}
          <div className="animate-glow-red seductive-image-frame">
            <Image
              src="/seductive/5.png"
              alt="Sacred Power"
              width={600}
              height={750}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
              }}
              priority
            />

            {/* Image overlay gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, transparent 60%, rgba(7,0,13,0.5) 100%), linear-gradient(to top, rgba(7,0,13,0.3) 0%, transparent 30%)",
                pointerEvents: "none",
              }}
            />

            {/* Red top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(to right, var(--red), var(--gold), transparent)",
              }}
            />
          </div>

          {/* Floating stat badge - bottom */}
          <div
            className="animate-float-slow seductive-float-badge"
            style={{
              bottom: "-20px",
              right: "-20px",
              border: "1px solid var(--border-gold-strong)",
              padding: "var(--space-9) var(--space-10)",
            }}
          >
            <div
              className="animate-glow-gold stat-value"
              style={{ fontSize: "var(--text-8xl)" }}
            >
              ∞
            </div>
            <div className="stat-label" style={{ color: "var(--text-dim)" }}>
              POWER LEVEL
            </div>
          </div>

          {/* Floating stat badge - top */}
          <div
            className="animate-float-medium seductive-float-badge"
            style={{
              top: "30px",
              right: "-30px",
              border: "1px solid var(--border-red-strong)",
              padding: "var(--space-6) var(--space-8)",
              boxShadow: "0 10px 40px rgba(204,0,0,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-4xl)",
                fontWeight: "700",
                color: "var(--red)",
                lineHeight: 1,
              }}
            >
              99.9%
            </div>
            <div className="stat-label">UPTIME</div>
          </div>
        </div>

        {/* ====== RIGHT: Content ====== */}
        <div className="animate-fade-in-right delay-200">
          {/* Section label */}
          <div className="section-label section-label-gold">
            <span className="dot dot-sm dot-gold" />
            TOOLSET
          </div>

          {/* Heading */}
          <h2 className="heading-display" style={{ marginBottom: "var(--space-9)" }}>
            <span
              className="heading-display-italic"
              style={{
                display: "block",
                fontSize: "clamp(38px, 4.5vw, 60px)",
              }}
            >
              Clean
            </span>
            <span
              className="heading-display-bold"
              style={{
                display: "block",
                fontSize: "clamp(38px, 4.5vw, 60px)",
              }}
            >
              Design.
            </span>
            <span
              className="animate-glow-gold heading-display-gold"
              style={{
                display: "block",
                fontSize: "clamp(38px, 4.5vw, 60px)",
              }}
            >
              Real Edge.
            </span>
          </h2>

          <p className="text-body" style={{ marginBottom: "var(--space-14)", maxWidth: "440px" }}>
            Minimal surface. Maximum execution.
          </p>

          {/* ── Sacred Arsenal — infinite vertical scroll ── */}
          <div
            style={{
              position: "relative",
              height: "340px",
              overflow: "hidden",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
            }}
          >
            <div
              className="arsenal-track"
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
            >
              {/* Render items TWICE for seamless loop */}
              {[...features, ...features].map((f, i) => (
                <div
                  key={i}
                  className="feature-row"
                  style={{ borderLeft: `2px solid ${f.color}` }}
                >
                  {/* Icon */}
                  <div
                    className="icon-circle icon-circle-lg"
                    style={{
                      background: `color-mix(in srgb, ${f.color} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${f.color} 20%, transparent)`,
                    }}
                  >
                    {f.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--text-lg)",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--text-md)",
                        color: "var(--text-faint)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>

                  {/* Stat badge */}
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      fontWeight: "700",
                      color: f.color,
                      flexShrink: 0,
                      paddingLeft: "var(--space-4)",
                      letterSpacing: "var(--tracking-wider)",
                      alignSelf: "center",
                      opacity: 0.8,
                    }}
                  >
                    {f.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="divider-gold-red" />
    </section>
  );
}
