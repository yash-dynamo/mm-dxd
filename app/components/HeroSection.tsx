"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Particles from "./Particles";
import { BackgroundBeams } from "../../components/ui/background-beams";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-card";
import { useAccount } from "wagmi";
import { useActionStore, useAuthStore } from "@/stores";

/* ─────────────────────────── data ─────────────────────────── */
const platforms = [
  {
    name: "HotStuff",
    type: "PERP DEX · LIVE",
    volume: "$142M",
    pairs: "234 pairs",
    logo: "/logos/hotstuff.svg",
    bars: [0.5, 0.75, 0.55, 0.9, 0.65, 0.8, 1.0],
  },
  {
    name: "Hyperliquid",
    type: "PERP DEX · LIVE",
    volume: "$198M",
    pairs: "189 pairs",
    logo: "/logos/hyperliquid.svg",
    bars: [0.4, 0.65, 0.85, 0.6, 0.9, 0.7, 0.95],
  },
  {
    name: "More DEXes",
    type: "COMING Q2 2026",
    volume: "Soon™",
    pairs: "∞ pairs",
    logo: null,
    icon: "◎",
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
function MiniBarChart({ bars, delay = 0, muted = false }: { bars: number[]; delay?: number; muted?: boolean }) {
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
              background: muted ? "var(--text-dim)" : "var(--gold)",
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
    <div style={{ textAlign: "center", padding: "0 var(--space-2)" }}>
      <div
        className="stat-value"
        style={{
          fontSize: "clamp(20px, 2.2vw, 28px)",
          transform: show ? "translateY(0)" : "translateY(12px)",
          opacity: show ? 1 : 0,
          transition: "all var(--duration-slower) var(--ease-out)",
          marginBottom: "var(--space-2)",
        }}
      >
        {value}
      </div>
      <div 
        className="text-label-xs" 
        style={{ 
          color: "var(--text-dim)",
          letterSpacing: "var(--tracking-label)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const vol = useAnimatedNumber(420, 1800, 800);
  const uptime = useAnimatedNumber(999, 1600, 1000);

  const { isConnected } = useAccount();
  const { setModal } = useActionStore();
  const status = useAuthStore((s) => s.status);

  const handleStart = useCallback(() => {
    if (!isConnected) {
      setModal("connect-wallet");
    } else {
      // connected at any stage — open setup modal
      // (shows progress if still setting up, or "ready" state if trading-enabled)
      setModal("wallet-setup");
    }
  }, [isConnected, status, setModal]);

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
          background: "radial-gradient(circle, rgba(204,51,51,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Particles count={28} />
      
      {/* Aceternity Background Beams */}
      <BackgroundBeams className="opacity-40" />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="hero-grid">

          {/* ══════════════ LEFT ══════════════ */}
          <div>
            {/* Protocol badge */}
            <div className="animate-fade-in-left badge badge-red" style={{ marginBottom: "var(--space-12)" }}>
              <span className="animate-spark" style={{ fontSize: "var(--text-xs)" }}>✦</span>
              XD · LIVE
            </div>

            {/* Heading — two words per line */}
            <h1 className="heading-display" style={{ marginBottom: "var(--space-11)" }}>
              <span
                className="animate-fade-in-left delay-100"
                style={{
                  display: "block",
                  fontSize: "clamp(44px, 5.5vw, 72px)",
                  letterSpacing: "var(--tracking-normal)",
                }}
              >
                <span className="heading-display-italic">Pure</span>{" "}
                <span className="heading-display-bold">Deep</span>
              </span>
              <span
                className="animate-fade-in-left delay-200"
                style={{
                  display: "block",
                  fontSize: "clamp(44px, 5.5vw, 72px)",
                  letterSpacing: "var(--tracking-normal)",
                }}
              >
                <span className="animate-glow-gold heading-display-gold">Market</span>{" "}
                <span className="heading-display-bold">Liquidity</span>
              </span>
            </h1>

            {/* Description */}
            <p className="animate-fade-in-left delay-500 text-body" style={{ marginBottom: "var(--space-14)", maxWidth: "420px" }}>
              Fast routing. Tight spreads. Live on every major venue.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-left delay-600 hero-cta-row" style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleStart}
                className="btn btn-primary animate-glow-red"
              >
                {status === "trading-enabled" ? "TRADING ACTIVE" : "START"}
              </button>
              <a href="#platforms" className="btn btn-secondary">
                STACK
              </a>
            </div>
          </div>

          {/* ══════════════ RIGHT — Aceternity 3D Card ══════════════ */}
          <div className="animate-fade-in-right delay-300">
            <CardContainer containerClassName="py-0">
              <CardBody className="hero-card relative h-auto w-auto group/card">
                {/* Scan line */}
                <div className="hero-scan-line" />

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-10)" }}>
                  <CardItem translateZ="50" className="w-auto">
                    <div 
                      className="text-label-xs" 
                      style={{ 
                        color: "rgba(255, 255, 255, 0.7)", 
                        marginBottom: "var(--space-3)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "var(--space-3)",
                      }}
                    >
                      <span 
                        style={{ 
                          width: "5px", 
                          height: "5px", 
                          borderRadius: "50%", 
                          background: "rgba(255, 255, 255, 0.7)",
                          boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                        }} 
                      />
                      ACTIVE PROTOCOL
                    </div>
                    <div 
                      className="animate-glow-red logo-text" 
                      style={{ 
                        fontSize: "clamp(36px, 4vw, 48px)", 
                        color: "var(--red)", 
                        letterSpacing: "8px",
                        textShadow: "0 0 30px rgba(204, 51, 51, 0.3)"
                      }}
                    >
                      XD
                    </div>
                  </CardItem>
                  <CardItem translateZ="70" className="w-auto">
                    <div 
                      className="badge badge-red"
                      style={{
                        padding: "var(--space-2) var(--space-5)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <span 
                        style={{ 
                          width: "6px", 
                          height: "6px", 
                          borderRadius: "50%", 
                          background: "var(--red)",
                          boxShadow: "0 0 8px rgba(204, 51, 51, 0.6)"
                        }} 
                      />
                      LIVE
                    </div>
                  </CardItem>
                </div>

                {/* Platform rows - no 3D translate, stays flat with card */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-10)" }}>
                  {platforms.map((p, i) => (
                    <div
                      key={i}
                      className={`platform-row ${p.soon ? "platform-row-disabled" : ""}`}
                      style={{ 
                        borderLeft: p.soon ? "none" : "2px solid rgba(201, 162, 39, 0.25)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                        <span
                          className="icon-circle"
                          style={{
                            width: "32px",
                            height: "32px",
                            fontSize: "var(--text-lg)",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {p.logo ? (
                            <Image 
                              src={p.logo} 
                              alt={p.name} 
                              width={20} 
                              height={20} 
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            p.icon
                          )}
                        </span>
                        <div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-2xl)", fontWeight: "600", color: "var(--text-primary)", letterSpacing: "0.3px" }}>
                            {p.name}
                          </div>
                          <div className="text-label-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                            {p.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
                        <MiniBarChart bars={p.bars} delay={i * 120} muted={p.soon} />
                        <div style={{ textAlign: "right", minWidth: "70px" }}>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-2xl)", fontWeight: "700", color: p.soon ? "var(--text-dim)" : "var(--gold)" }}>
                            {p.volume}
                          </div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-dim)", marginTop: "2px", letterSpacing: "var(--tracking-wide)" }}>
                            {p.pairs}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <CardItem translateZ="60" className="w-full">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "var(--space-9)",
                      marginTop: "var(--space-2)",
                      gap: "var(--space-4)",
                    }}
                  >
                    <StatBlock value={`$${vol}M+`} label="DAILY VOLUME" delay={1000} />
                    <StatBlock value="0.008%" label="AVG SPREAD" delay={1100} />
                    <StatBlock value={`${Math.floor(uptime / 10)}.${uptime % 10}%`} label="UPTIME" delay={1200} />
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>

        </div>
      </div>
    </section>
  );
}
