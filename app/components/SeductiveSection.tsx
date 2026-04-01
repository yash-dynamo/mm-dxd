"use client";

import AsciiImage from "./AsciiImage";
import { Iconify } from "@/components/ui/iconify";

const features = [
  {
    icon: "mingcute:chart-line-line",
    title: "Strategy Engine",
    desc: "Compose maker and taker runs per symbol with shared controls.",
    color: "var(--gold)",
    stat: "MAKE",
  },
  {
    icon: "mingcute:target-line",
    title: "Delta Manager",
    desc: "Inventory skew and tier logic keep exposure aligned.",
    color: "var(--red)",
    stat: "DELTA",
  },
  {
    icon: "mingcute:flash-line",
    title: "Execution Loop",
    desc: "Event-driven requotes with controlled cadence.",
    color: "var(--gold)",
    stat: "EXEC",
  },
  {
    icon: "mingcute:shield-check-line",
    title: "Risk Guardrails",
    desc: "Loss caps and cooldown rules stop runaway sessions.",
    color: "var(--red)",
    stat: "GUARD",
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
          {/* Image frame with static glow */}
          <div 
            className="seductive-image-frame"
            style={{
              boxShadow: "0 0 60px rgba(204,51,51,0.3), 0 0 120px rgba(204,51,51,0.15)",
            }}
          >
            <AsciiImage
              src="/seductive/5.png"
              alt="Sacred Power"
              aspectRatio="750/422"
              resolution={150}
              contrast={1.8}
              skinToneBoost={true}
              showImageOnHover={true}
              imageOpacity={0.12}
              imageHoverOpacity={0.72}
              style={{
                width: "100%",
                display: "block",
              }}
            >
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
            </AsciiImage>
          </div>

          {/* Floating stat badge - bottom right (outside frame) */}
          <div
            className="animate-float-slow seductive-float-badge"
            style={{
              bottom: "-24px",
              right: "-24px",
              border: "1px solid var(--border-gold-strong)",
              padding: "var(--space-7) var(--space-9)",
              zIndex: 10,
              boxShadow: "0 8px 32px rgba(201,162,39,0.25), 0 0 0 1px rgba(201,162,39,0.1)",
            }}
          >
            <div
              className="stat-value"
              style={{ fontSize: "var(--text-6xl)", color: "var(--gold)", marginBottom: "var(--space-1)" }}
            >
              200ms
            </div>
            <div className="stat-label" style={{ color: "var(--text-dim)", fontSize: "var(--text-2xs)" }}>
              REQUOTE FLOOR
            </div>
          </div>

          {/* Floating stat badge - top right (outside frame) */}
          <div
            className="animate-float-medium seductive-float-badge"
            style={{
              top: "24px",
              right: "-28px",
              border: "1px solid var(--border-red-strong)",
              padding: "var(--space-5) var(--space-7)",
              boxShadow: "0 8px 32px rgba(204,51,51,0.2), 0 0 0 1px rgba(204,51,51,0.1)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-3xl)",
                fontWeight: "700",
                color: "var(--red)",
                lineHeight: 1,
                marginBottom: "var(--space-1)",
              }}
            >
              5-10s
            </div>
            <div className="stat-label" style={{ fontSize: "var(--text-2xs)" }}>METRICS LOOP</div>
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
              style={{
                display: "block",
                fontSize: "clamp(38px, 4.5vw, 60px)",
              }}
            >
              <span className="heading-display-italic">Strategy</span>{" "}
              <span className="heading-display-bold">Stack.</span>
            </span>
            <span
              className="animate-glow-gold heading-display-gold"
              style={{
                display: "block",
                fontSize: "clamp(38px, 4.5vw, 60px)",
              }}
            >
              Execution Control.
            </span>
          </h2>

          <p className="text-body" style={{ marginBottom: "var(--space-14)", maxWidth: "440px" }}>
            Build, run, and tune live market-making workflows from one control surface.
          </p>

          {/* ── Sacred Arsenal — infinite vertical scroll ── */}
          <div
            className="seductive-arsenal-scroll"
            style={{
              position: "relative",
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
                    <Iconify icon={f.icon} width={16} height={16} style={{ color: f.color }} />
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
