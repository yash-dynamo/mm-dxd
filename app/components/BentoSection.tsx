"use client";

import { useState } from "react";
import AsciiImage from "./AsciiImage";

/* ─────────────────────────── data ─────────────────────────── */
const cards = [
  {
    img: "/cards/1.png",
    name: "Rias Gremory",
    role: "Chief Liquidity Architect",
    tag: "CORE",
    power: 100,
    desc: "Deep books. Clean fills.",
  },
  {
    img: "/cards/2.png",
    name: "Akeno Himejima",
    role: "Head of Execution",
    tag: "EXEC",
    power: 97,
    desc: "Low latency. High hit rate.",
  },
  {
    img: "/cards/3.png",
    name: "Koneko Toujou",
    role: "Risk & Defense Lead",
    tag: "RISK",
    power: 88,
    desc: "Risk first. Always on.",
  },
  {
    img: "/cards/4.png",
    name: "Asia Argento",
    role: "Portfolio Recovery",
    tag: "HEAL",
    power: 92,
    desc: "Recovery engine online.",
  },
];

/* ─────────────────────────── sub-components ─────────────────────────── */
function PowerBar({ power }: { power: number }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "8px",
            letterSpacing: "2px",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          POWER
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: "700",
            color: "rgba(255, 255, 255, 0.9)",
          }}
        >
          {power}
        </span>
      </div>
      <div
        style={{
          height: "2px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "1px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${power}%`,
            background: "linear-gradient(to right, rgba(255,47,79,0.6), var(--red-light))",
            borderRadius: "1px",
            boxShadow: "0 0 6px rgba(255,47,79,0.5)",
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

  return (
    <div
      className={`core-stack-card reveal reveal-delay-${Math.min(index + 1, 5)} ${hovered ? "core-stack-card--hover" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="core-stack-card__hover-tint" aria-hidden />
      <div className="core-stack-card__bar" aria-hidden />
      <div className="core-stack-card__focus-badge" aria-hidden>
        In focus
      </div>
      {/* ── ASCII Image ── */}
      <AsciiImage
        src={card.img}
        alt={card.name}
        aspectRatio="3/4"
        resolution={140}
        contrast={2.1}
        skinToneBoost={true}
        showImageOnHover={true}
        imageOpacity={0.55}
        imageHoverOpacity={0.88}
        isHovered={hovered}
        style={{ 
          position: "absolute",
          inset: 0,
          width: "100%", 
          height: "100%",
          pointerEvents: "none",
        }}
      />
      
      {/* Dark gradient for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Dark gradient overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            transparent 40%,
            rgba(6,0,14,0.7) 65%,
            rgba(6,0,14,0.95) 85%,
            rgba(6,0,14,1) 100%
          )`,
          zIndex: 1,
        }}
      />

      {/* ── Tag pill ── */}
      <div
        className="core-stack-card__tag"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(6,0,14,0.85)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(200, 16, 46,0.3)",
          padding: "4px 10px",
          fontSize: "8px",
          letterSpacing: "2px",
          fontFamily: "var(--font-sans)",
          color: "var(--red)",
          fontWeight: "700",
          zIndex: 6,
          transition: "all 0.3s",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {card.tag}
      </div>

      {/* ── Bottom content ── */}
      <div className="core-stack-card__bottom">
        {/* Description — reveals on hover; CSS handles visibility */}
        <p className="core-stack-card__desc">{card.desc}</p>

        <div className="core-stack-card__name">{card.name}</div>

        <div className="core-stack-card__role">{card.role.toUpperCase()}</div>

        {/* Power bar */}
        <PowerBar power={card.power} />
      </div>

      {/* ── Corner accents - unified red ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: hovered ? "40px" : "24px",
          height: "1px",
          background: "linear-gradient(to left, rgba(200, 16, 46,0.5), transparent)",
          transition: "width 0.4s",
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "1px",
          height: hovered ? "40px" : "24px",
          background: "linear-gradient(to top, rgba(200, 16, 46,0.5), transparent)",
          transition: "height 0.4s",
          zIndex: 5,
        }}
      />
    </div>
  );
}

/* ─────────────────────────── section ─────────────────────────── */
export default function BentoSection() {
  return (
    <section
      id="platforms"
      className="bento-section-home"
      style={{
        position: "relative",
        background:
          "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(120,30,30,0.07) 0%, transparent 60%), var(--bg-base)",
        overflow: "visible",
      }}
    >
      {/* Vertical divider from top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "1px",
          height: "100px",
          background: "linear-gradient(to bottom, transparent, rgba(200, 16, 46,0.5), transparent)",
        }}
      />

      <div className="bento-section-inner">
        {/* Section header */}
        <div className="reveal" style={{ marginBottom: "64px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              fontFamily: "var(--font-sans)",
              fontSize: "9px",
              letterSpacing: "3px",
              color: "var(--red)",
              fontWeight: "700",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--red)",
                boxShadow: "0 0 10px rgba(200, 16, 46, 0.7)",
                display: "inline-block",
              }}
            />
            CORE TEAM
          </div>

          <h2 className="heading-display" style={{ lineHeight: 0.92, margin: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(52px, 7vw, 96px)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              <span className="heading-display-bold">Sacred</span>{" "}
              <span className="heading-display-italic" style={{ color: "var(--red-muted)" }}>Arsenal</span>
            </span>
          </h2>

          <p
            className="text-body"
            style={{
              marginTop: "20px",
              maxWidth: "460px",
              fontSize: "var(--text-lg)",
            }}
          >
            Four roles. One unified liquidity engine.
          </p>
        </div>

        {/* Bento grid — responsive: see .home-bento-grid in globals.css */}
        <div className="home-bento-grid">
          {cards.map((card, i) => (
            <BentoCard key={i} card={card} index={i} />
          ))}
        </div>

        {/* Footer quote */}
        <div
          className="animate-fade-in-up delay-500"
          style={{
            marginTop: "48px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              height: "1px",
              width: "60px",
              background: "linear-gradient(to right, transparent, rgba(200, 16, 46,0.3))",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "18px",
              color: "var(--text-secondary)",
              letterSpacing: "0.5px",
            }}
          >
            Built for speed.
          </span>
          <div
            style={{
              height: "1px",
              width: "60px",
              background: "linear-gradient(to left, transparent, rgba(200, 16, 46,0.3))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
