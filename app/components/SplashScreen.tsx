"use client";

import { useState, useEffect } from "react";

const DRIP_POSITIONS = [8, 22, 37, 51, 64, 78, 91];
const DRIP_DELAYS = [0.2, 0.8, 0.4, 1.1, 0.6, 1.4, 0.3];
const DRIP_DURATIONS = [2.4, 1.8, 2.9, 2.1, 2.6, 1.9, 2.3];

export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "gone">("in");
  const [barWidth, setBarWidth] = useState(0);

  // Auto-progress timeline
  useEffect(() => {
    // Seal + first elements appear at 0
    // Bar starts filling at 400ms
    const barTimer = setTimeout(() => {
      setBarWidth(100);
    }, 400);

    // Auto-dismiss after 4.2s (bar fills in ~3.5s)
    const holdTimer = setTimeout(() => setPhase("hold"), 500);
    const outTimer = setTimeout(() => setPhase("out"), 4200);
    const goneTimer = setTimeout(() => setPhase("gone"), 5100);

    return () => {
      clearTimeout(barTimer);
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  const dismiss = () => {
    if (phase === "gone") return;
    setPhase("out");
    setTimeout(() => setPhase("gone"), 900);
  };

  if (phase === "gone") return null;

  const leaving = phase === "out";

  return (
    <div
      onClick={dismiss}
      className="splash-screen"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.04)" : "scale(1)",
        transition: "opacity var(--duration-slowest) var(--ease-out), transform var(--duration-slowest) var(--ease-out)",
      }}
    >
      {/* ── Blood drips along top edge ── */}
      {DRIP_POSITIONS.map((left, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${left}%`,
            width: "2px",
            height: `${20 + Math.floor(i * 7) % 40}px`,
            background: "linear-gradient(to bottom, var(--red), var(--red-darker))",
            borderRadius: "0 0 3px 3px",
            animation: `splash-drip ${DRIP_DURATIONS[i]}s ease-in ${DRIP_DELAYS[i]}s infinite`,
            opacity: 0.7,
          }}
        />
      ))}

      {/* ── Large background seals ── */}
      <div className="splash-seal splash-seal-outer" />
      <div className="splash-seal splash-seal-inner" />

      {/* ── Centre cross-hair ── */}
      <div className="splash-crosshair-v" />
      <div className="splash-crosshair-h" />

      {/* ── Ambient red glow ── */}
      <div className="splash-glow" />

      {/* ── Content ── */}
      <div className="splash-content" onClick={(e) => e.stopPropagation()}>
        {/* Eye-of-DXD top label */}
        <div
          className="splash-line"
          style={{
            animationDelay: "0.2s",
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(8px, 1vw, 10px)",
            letterSpacing: "var(--tracking-caps-wide)",
            color: "var(--red)",
            marginBottom: "var(--space-12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-6)",
          }}
        >
          <span style={{ display: "inline-block", width: "40px", height: "1px", background: "linear-gradient(to right, transparent, var(--red))" }} />
          ✦ XD PROTOCOL · SACRED BLOOD CONTRACT ✦
          <span style={{ display: "inline-block", width: "40px", height: "1px", background: "linear-gradient(to left, transparent, var(--red))" }} />
        </div>

        {/* Scare quote — line 1 */}
        <div
          className="splash-line"
          style={{
            animationDelay: "0.45s",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: "300",
            fontSize: "clamp(28px, 5vw, 68px)",
            color: "var(--red-muted)",
            lineHeight: 1.1,
            marginBottom: "var(--space-3)",
            letterSpacing: "var(--tracking-normal)",
          }}
        >
          Die on our first date,
        </div>

        {/* Scare quote — line 2 (GLITCH) */}
        <div
          className="splash-line splash-glitch-text"
          style={{
            animationDelay: "0.7s",
            fontFamily: "var(--font-serif)",
            fontWeight: "700",
            fontSize: "clamp(32px, 6vw, 84px)",
            color: "var(--text-primary)",
            lineHeight: 1.0,
            marginBottom: "var(--space-11)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          let&apos;s make market, baby.
        </div>

        {/* Sub-lines */}
        <div
          className="splash-line"
          style={{
            animationDelay: "1.0s",
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(10px, 1.2vw, 13px)",
            color: "var(--text-muted)",
            letterSpacing: "var(--tracking-label-wider)",
            marginBottom: "var(--space-3)",
          }}
        >
          YOUR SOUL FOR SACRED SPREADS
        </div>
        <div
          className="splash-line"
          style={{
            animationDelay: "1.15s",
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(9px, 1vw, 11px)",
            color: "var(--text-dim)",
            letterSpacing: "var(--tracking-caps)",
            marginBottom: "var(--space-16)",
          }}
        >
          EVERY TRADE · A BLOOD CONTRACT
        </div>

        {/* ENTER button */}
        <div
          className="splash-line"
          style={{
            animationDelay: "1.5s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-9)",
          }}
        >
          <button
            onClick={dismiss}
            className="splash-enter-btn"
            style={{
              background: "transparent",
              border: "1px solid rgba(204,51,51,0.5)",
              color: "var(--red)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-base)",
              letterSpacing: "var(--tracking-caps-wide)",
              fontWeight: "700",
              padding: "var(--space-6) var(--space-15)",
              cursor: "pointer",
              transition: "all var(--duration-normal)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(204,51,51,0.1)";
              el.style.borderColor = "var(--red)";
              el.style.color = "var(--red-bright)";
              el.style.boxShadow = "0 0 30px rgba(204,51,51,0.3)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "transparent";
              el.style.borderColor = "rgba(204,51,51,0.5)";
              el.style.color = "var(--red)";
              el.style.boxShadow = "";
            }}
          >
            ✦ ENTER THE MARKET
          </button>

          <div style={{ fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-label)", color: "var(--text-ghost)", fontFamily: "var(--font-sans)" }}>
            or wait · auto-entering soon
          </div>
        </div>
      </div>

      {/* ── Progress bar at bottom ── */}
      <div className="splash-progress">
        <div
          className="splash-progress-bar"
          style={{
            width: `${barWidth}%`,
            transition: "width 3.8s linear",
          }}
        />
      </div>

      {/* ── Bottom DXD stamp ── */}
      <div className="splash-stamp" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
        XD
      </div>

      {/* ── Corner runes ── */}
      {[
        { top: "20px", left: "24px", text: "✦ XD" },
        { top: "20px", right: "24px", text: "XD ✦" },
        { bottom: "24px", left: "24px", text: "✦ XD" },
        { bottom: "24px", right: "24px", text: "XD ✦" },
      ].map((pos, i) => (
        <div
          key={i}
          className="splash-corner-rune"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            bottom: pos.bottom,
          }}
        >
          {pos.text}
        </div>
      ))}
    </div>
  );
}
