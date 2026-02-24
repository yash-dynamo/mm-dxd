"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Particles from "./Particles";

/* ─────────────────────────── data ─────────────────────────── */
const platforms = [
  {
    name: "HotStuff",
    type: "PERP DEX · LIVE",
    volume: "$142M",
    pairs: "234 pairs",
    icon: "🔥",
    color: "var(--red)",
    bars: [0.5, 0.75, 0.55, 0.9, 0.65, 0.8, 1.0],
  },
  {
    name: "Hyperliquid",
    type: "PERP DEX · LIVE",
    volume: "$198M",
    pairs: "189 pairs",
    icon: "⚡",
    color: "var(--purple)",
    bars: [0.4, 0.65, 0.85, 0.6, 0.9, 0.7, 0.95],
  },
  {
    name: "More DEXes",
    type: "COMING Q2 2026",
    volume: "Soon™",
    pairs: "∞ pairs",
    icon: "◎",
    color: "var(--blue)",
    bars: [0.2, 0.25, 0.2, 0.3, 0.2, 0.28, 0.32],
    soon: true,
  },
];

/* ─────────────────────────── hooks ─────────────────────────── */
function useAnimatedNumber(target: number, duration = 1800, delay = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.floor(eased * target));
        if (p < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

/* ─────────────────────────── sub-components ─────────────────────────── */
function MiniBarChart({ bars, color, delay = 0 }: { bars: number[]; color: string; delay?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 900 + delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "22px", opacity: 0.85 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: "100%",
            position: "relative",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "var(--radius-xs)",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: "var(--radius-xs)",
              background: color,
              transformOrigin: "bottom",
              transform: ready ? `scaleY(${h})` : "scaleY(0)",
              height: "100%",
              transition: `transform 0.7s var(--ease-out) ${i * 55 + delay}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function StatBlock({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="stat-value"
        style={{
          fontSize: "clamp(18px, 2vw, 26px)",
          transform: show ? "translateY(0)" : "translateY(12px)",
          opacity: show ? 1 : 0,
          transition: "all var(--duration-slower) var(--ease-out)",
        }}
      >
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const vol = useAnimatedNumber(420, 1800, 800);
  const uptime = useAnimatedNumber(999, 1600, 1000);

  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    cardRef.current.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${y}deg) translateZ(16px)`;
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <section ref={sectionRef} className="hero-section">
      {/* Animated grid background */}
      <div className="hero-bg-grid" />

      {/* Radial glow overlays */}
      <div className="glow-overlay-red" />
      <div className="glow-overlay-purple" />

      {/* Bottom left warm glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-80px",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle, rgba(204,0,0,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Particles count={28} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="hero-grid">

          {/* ══════════════ LEFT ══════════════ */}
          <div>
            {/* Protocol badge */}
            <div className="animate-fade-in-left badge badge-red" style={{ marginBottom: "var(--space-12)" }}>
              <span className="animate-spark" style={{ fontSize: "10px" }}>✦</span>
              XD · LIVE
            </div>

            {/* Heading — each line staggered */}
            <h1 className="heading-display" style={{ marginBottom: "var(--space-11)" }}>
              <span
                className="animate-fade-in-left delay-100 heading-display-italic"
                style={{
                  display: "block",
                  fontSize: "clamp(50px, 6vw, 84px)",
                  letterSpacing: "var(--tracking-normal)",
                }}
              >
                Pure
              </span>
              <span
                className="animate-fade-in-left delay-200 heading-display-bold"
                style={{
                  display: "block",
                  fontSize: "clamp(50px, 6vw, 84px)",
                  letterSpacing: "var(--tracking-snug)",
                }}
              >
                Deep
              </span>
              <span
                className="animate-fade-in-left delay-300 animate-glow-gold heading-display-gold"
                style={{
                  display: "block",
                  fontSize: "clamp(46px, 5.5vw, 78px)",
                  letterSpacing: "var(--tracking-normal)",
                }}
              >
                Market
              </span>
              <span
                className="animate-fade-in-left delay-400 heading-display-bold"
                style={{
                  display: "block",
                  fontSize: "clamp(50px, 6vw, 84px)",
                  letterSpacing: "var(--tracking-snug)",
                }}
              >
                Liquidity
              </span>
            </h1>

            {/* Description */}
            <p className="animate-fade-in-left delay-500 text-body" style={{ marginBottom: "var(--space-14)", maxWidth: "420px" }}>
              Fast routing. Tight spreads. Live on every major venue.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-left delay-600 hero-cta-row" style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary animate-glow-red"
              >
                START
              </a>
              <a href="#platforms" className="btn btn-secondary">
                STACK
              </a>
            </div>
          </div>

          {/* ══════════════ RIGHT — tilt card ══════════════ */}
          <div
            className="animate-fade-in-right delay-300"
            style={{ perspective: "1200px" }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <div
              ref={cardRef}
              style={{
                transition: "transform 0.15s var(--ease-out)",
                transformStyle: "preserve-3d",
                position: "relative",
              }}
            >
              {/* Outer glow halo */}
              <div className="hero-card-glow" />

              {/* Card body */}
              <div className="hero-card">
                {/* Scan line */}
                <div className="hero-scan-line" />

                {/* Corner accents */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "80px", height: "2px", background: "linear-gradient(to right, var(--red), transparent)" }} />
                <div style={{ position: "absolute", top: 0, left: 0, width: "2px", height: "80px", background: "linear-gradient(to bottom, var(--red), transparent)" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "1px", background: "linear-gradient(to left, rgba(201,162,39,0.4), transparent)" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "1px", height: "60px", background: "linear-gradient(to top, rgba(201,162,39,0.4), transparent)" }} />

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-9)" }}>
                  <div>
                    <div className="text-label-sm" style={{ color: "var(--red)", marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)", opacity: 0.9 }}>
                      <span className="live-dot dot dot-sm dot-red" />
                      ACTIVE PROTOCOL
                    </div>
                    <div className="animate-glow-gold logo-text" style={{ fontSize: "var(--text-8xl)", color: "var(--gold)", letterSpacing: "5px" }}>
                      XD
                    </div>
                  </div>
                  <div className="badge badge-live">
                    <span className="live-dot dot dot-sm dot-green" />
                    LIVE
                  </div>
                </div>

                {/* Platform rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-9)" }}>
                  {platforms.map((p, i) => (
                    <div
                      key={i}
                      className={`platform-row ${p.soon ? "platform-row-disabled" : ""}`}
                      style={{ borderLeft: `2px solid ${p.color}` }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                        <span
                          className="icon-circle icon-circle-sm"
                          style={{
                            background: `color-mix(in srgb, ${p.color} 12%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${p.color} 20%, transparent)`,
                          }}
                        >
                          {p.icon}
                        </span>
                        <div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-lg)", fontWeight: "600", color: "var(--text-primary)" }}>
                            {p.name}
                          </div>
                          <div className="text-label-xs" style={{ color: "var(--text-faint)", marginTop: "1px" }}>
                            {p.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                        <MiniBarChart bars={p.bars} color={p.color} delay={i * 120} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-lg)", fontWeight: "700", color: p.soon ? "var(--text-ghost)" : "var(--gold)" }}>
                            {p.volume}
                          </div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-ghost)", marginTop: "1px", letterSpacing: "var(--tracking-wide)" }}>
                            {p.pairs}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    borderTop: "1px solid var(--border-red-light)",
                    paddingTop: "var(--space-8)",
                    gap: "var(--space-1)",
                  }}
                >
                  <StatBlock value={`$${vol}M+`} label="DAILY VOLUME" delay={1000} />
                  <StatBlock value="0.008%" label="AVG SPREAD" delay={1100} />
                  <StatBlock value={`${Math.floor(uptime / 10)}.${uptime % 10}%`} label="UPTIME" delay={1200} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
