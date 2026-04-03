"use client";

import { useState, useEffect } from "react";

const SPLASH_SEEN_KEY = "dxd_splash_seen_this_tab";
type Phase = "checking" | "in" | "out" | "gone";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") {
      setPhase("gone");
      return;
    }
    sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    setPhase("in");
  }, []);

  useEffect(() => {
    if (phase !== "in") return;
    const barTimer = setTimeout(() => setBarWidth(100), 80);
    const outTimer = setTimeout(() => setPhase("out"), 3000);
    const goneTimer = setTimeout(() => setPhase("gone"), 3700);
    return () => {
      clearTimeout(barTimer);
      clearTimeout(outTimer);
      clearTimeout(goneTimer);
    };
  }, [phase]);

  const dismiss = () => {
    if (phase === "gone" || phase === "checking") return;
    setPhase("out");
    setTimeout(() => setPhase("gone"), 700);
  };

  if (phase === "checking" || phase === "gone") return null;

  const leaving = phase === "out";

  return (
    <div
      onClick={dismiss}
      className="splash-simple"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.02)" : "scale(1)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      <div className="splash-simple__glow" aria-hidden />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          textAlign: "center",
          padding: "0 24px",
          maxWidth: "420px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(52px, 10vw, 96px)",
            lineHeight: 1,
            letterSpacing: "-2px",
            margin: 0,
            userSelect: "none",
            color: "var(--red)",
          }}
        >
          DXD{" "}
          <span style={{ fontStyle: "normal", color: "var(--text-primary)" }}>BOT</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(14px, 1.5vw, 17px)",
            fontWeight: 500,
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          One stop solution for bot trading
        </p>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--text-ghost)",
            margin: 0,
          }}
        >
          Let&apos;s do it
        </p>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            color: "var(--text-dim)",
            margin: "8px 0 0",
            letterSpacing: "0.06em",
          }}
        >
          Tap anywhere to continue
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "var(--red)",
            width: `${barWidth}%`,
            transition: "width 2.8s linear",
            opacity: 0.75,
          }}
        />
      </div>
    </div>
  );
}
