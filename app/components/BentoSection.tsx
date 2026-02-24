"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

/* ─────────────────────────── data ─────────────────────────── */
const cards = [
  {
    img: "/cards/1.png",
    name: "Rias Gremory",
    role: "Chief Liquidity Architect",
    tag: "XD · INNER CIRCLE",
    ability: "Crimson Depth",
    power: 100,
    color: "var(--red)",
    colorRaw: "#cc0000",
    stars: 5,
    desc: "Deep books. Clean fills.",
    size: "large",
  },
  {
    img: "/cards/2.png",
    name: "Akeno Himejima",
    role: "Head of Execution",
    tag: "XD · THUNDER FILLS",
    ability: "Holy Lightning",
    power: 97,
    color: "var(--purple)",
    colorRaw: "#7b00c8",
    stars: 5,
    desc: "Low latency. High hit rate.",
    size: "small",
  },
  {
    img: "/cards/3.png",
    name: "Koneko Toujou",
    role: "Risk & Defense Lead",
    tag: "XD · IRON SHIELD",
    ability: "Senjutsu Ward",
    power: 88,
    color: "var(--blue)",
    colorRaw: "#2a5aaa",
    stars: 4,
    desc: "Risk first. Always on.",
    size: "small",
  },
  {
    img: "/cards/4.png",
    name: "Asia Argento",
    role: "Portfolio Recovery Lead",
    tag: "XD · TWILIGHT HEAL",
    ability: "Sacred Recovery",
    power: 92,
    color: "var(--green-dark)",
    colorRaw: "#1a8a3a",
    stars: 4,
    desc: "Recovery engine online.",
    size: "large",
  },
];

/* ─────────────────────────── sub-components ─────────────────────────── */
function PowerBar({ power, color }: { power: number; color: string }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <span className="text-label-xs" style={{ color: "var(--text-faint)" }}>
          POWER LEVEL
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", fontWeight: "700", color }}>
          {power}
        </span>
      </div>
      <div style={{ height: "2px", background: "var(--border-light)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${power}%`,
            background: `linear-gradient(to right, color-mix(in srgb, ${color} 50%, transparent), ${color})`,
            borderRadius: "var(--radius-xs)",
            transition: "width 0.8s var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────── card ─────────────────────────── */
function BentoCard({ card, index }: { card: (typeof cards)[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const colorDim = `color-mix(in srgb, ${card.color} 18%, transparent)`;
  const glowColor = `color-mix(in srgb, ${card.color} 35%, transparent)`;

  return (
    <div
      className={`animate-fade-in-up delay-${(index + 1) * 100} bento-card`}
      style={{
        position: "relative",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: card.size === "large" ? "3/4" : "2/3",
        background: "#06000e",
        transition: "all 0.45s var(--ease-out)",
        border: hovered ? `1px solid color-mix(in srgb, ${card.color} 40%, transparent)` : "1px solid var(--border-light)",
        boxShadow: hovered
          ? `0 24px 80px ${glowColor}, 0 0 0 1px color-mix(in srgb, ${card.color} 20%, transparent)`
          : "none",
        transform: hovered ? "translateY(-10px) scale(1.015)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* ── Character image ── */}
      <div
        className="bento-card-inner"
        style={{
          position: "absolute",
          inset: 0,
          transform: hovered ? "scale(1.07)" : "scale(1)",
          transition: "transform var(--duration-slower) var(--ease-out)",
        }}
      >
        <Image
          src={card.img}
          alt={card.name}
          fill
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
      </div>

      {/* ── Mouse-following spotlight ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle 120px at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.07) 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity var(--duration-normal)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Base gradient overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(
              to bottom,
              transparent 0%,
              transparent 30%,
              ${colorDim} 55%,
              rgba(6,0,14,0.88) 72%,
              rgba(6,0,14,0.98) 100%
            )
          `,
          transition: "opacity var(--duration-medium)",
          zIndex: 1,
        }}
      />

      {/* ── Top colored bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: hovered ? "3px" : "2px",
          background: `linear-gradient(to right, ${card.color}, transparent 70%)`,
          transition: "height var(--duration-normal)",
          zIndex: 5,
        }}
      />

      {/* ── Tag pill ── */}
      <div
        style={{
          position: "absolute",
          top: "var(--space-6)",
          left: "var(--space-6)",
          background: "rgba(6,0,14,0.8)",
          backdropFilter: "blur(10px)",
          border: `1px solid color-mix(in srgb, ${card.color} 27%, transparent)`,
          padding: "var(--space-1) var(--space-4)",
          fontSize: "var(--text-2xs)",
          letterSpacing: "var(--tracking-label)",
          fontFamily: "var(--font-sans)",
          color: card.color,
          fontWeight: "700",
          zIndex: 5,
          transition: "all var(--duration-normal)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {card.tag}
      </div>

      {/* ── Ability badge (appears on hover) ── */}
      <div
        style={{
          position: "absolute",
          top: "var(--space-6)",
          right: "var(--space-6)",
          background: `color-mix(in srgb, ${card.color} 13%, transparent)`,
          backdropFilter: "blur(10px)",
          border: `1px solid color-mix(in srgb, ${card.color} 33%, transparent)`,
          padding: "var(--space-1) var(--space-4)",
          fontSize: "var(--text-2xs)",
          letterSpacing: "var(--tracking-widest)",
          fontFamily: "var(--font-sans)",
          color: card.color,
          fontWeight: "600",
          zIndex: 5,
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(-8px)",
          transition: "all 0.35s var(--ease-out)",
        }}
      >
        ⚡ {card.ability}
      </div>

      {/* ── Bottom content ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "var(--space-9)",
          zIndex: 5,
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "transform var(--duration-medium) var(--ease-out)",
        }}
      >
        {/* Description — reveals on hover */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-md)",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            marginBottom: "var(--space-5)",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.35s var(--ease-out) 0.05s",
            maxHeight: "40px",
            overflow: "hidden",
          }}
        >
          {card.desc}
        </p>

        {/* Name */}
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(16px, 1.5vw, 20px)",
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "2px",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {card.name}
        </div>

        {/* Role */}
        <div
          className="text-label-sm"
          style={{
            color: card.color,
            marginBottom: "var(--space-5)",
            opacity: 0.9,
          }}
        >
          {card.role}
        </div>

        {/* Power bar */}
        <PowerBar power={card.power} color={card.color} />
      </div>

      {/* ── Bottom right corner accent ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: hovered ? "50px" : "30px",
          height: "1px",
          background: `linear-gradient(to left, color-mix(in srgb, ${card.color} 53%, transparent), transparent)`,
          transition: "width var(--duration-medium)",
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "1px",
          height: hovered ? "50px" : "30px",
          background: `linear-gradient(to top, color-mix(in srgb, ${card.color} 53%, transparent), transparent)`,
          transition: "height var(--duration-medium)",
          zIndex: 5,
        }}
      />
    </div>
  );
}

/* ─────────────────────────── section ─────────────────────────── */
export default function BentoSection() {
  return (
    <section id="platforms" className="bento-section">
      {/* Vertical divider from top */}
      <div className="bento-divider" />

      <div className="container">
        {/* Section header */}
        <div style={{ marginBottom: "var(--space-16)" }}>
          <div className="animate-fade-in-up section-label">
            <span className="live-dot dot dot-red" />
            CORE TEAM
          </div>

          <h2 className="animate-fade-in-up delay-100 heading-display" style={{ margin: 0 }}>
            <span
              className="heading-display-bold"
              style={{
                display: "block",
                fontSize: "clamp(38px, 5vw, 64px)",
              }}
            >
              Core
            </span>
            <span
              className="heading-display-italic"
              style={{
                display: "block",
                fontSize: "clamp(38px, 5vw, 64px)",
              }}
            >
              Stack
            </span>
          </h2>

          <p
            className="animate-fade-in-up delay-200 text-body-sm"
            style={{
              marginTop: "var(--space-6)",
              maxWidth: "460px",
            }}
          >
            Four modules. One execution engine.
          </p>
        </div>

        {/* Bento grid */}
        <div className="bento-grid">
          {cards.map((card, i) => (
            <BentoCard key={i} card={card} index={i} />
          ))}
        </div>

        {/* Footer quote */}
        <div
          className="animate-fade-in-up delay-500"
          style={{
            marginTop: "var(--space-15)",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-9)",
          }}
        >
          <div style={{ height: "1px", width: "60px", background: "linear-gradient(to right, transparent, var(--border-red-strong))" }} />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "var(--text-4xl)",
              color: "var(--text-ghost)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Built for speed.
          </span>
          <div style={{ height: "1px", width: "60px", background: "linear-gradient(to left, transparent, var(--border-red-strong))" }} />
        </div>
      </div>
    </section>
  );
}
