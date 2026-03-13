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
            background: "linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.9))",
            borderRadius: "1px",
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
      className={`animate-fade-in-up delay-${(index + 1) * 100}`}
      style={{
        position: "relative",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: "3/4",
        background: "#06000e",
        transition: "all 0.45s var(--ease-out)",
        border: hovered
          ? "1px solid rgba(204,51,51,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hovered
          ? "0 24px 80px rgba(204,51,51,0.2), 0 0 0 1px rgba(204,51,51,0.15)"
          : "none",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── ASCII Image ── */}
      <AsciiImage
        src={card.img}
        alt={card.name}
        aspectRatio="3/4"
        resolution={120}
        contrast={1.8}
        skinToneBoost={true}
        showImageOnHover={true}
        imageOpacity={0.12}
        imageHoverOpacity={0.68}
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

      {/* ── Top red accent bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: hovered ? "3px" : "2px",
          background: "linear-gradient(to right, var(--red), transparent 70%)",
          transition: "height 0.3s",
          zIndex: 5,
        }}
      />

      {/* ── Tag pill ── */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(6,0,14,0.85)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(204,51,51,0.3)",
          padding: "4px 10px",
          fontSize: "8px",
          letterSpacing: "2px",
          fontFamily: "var(--font-sans)",
          color: "var(--red)",
          fontWeight: "700",
          zIndex: 5,
          transition: "all 0.3s",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {card.tag}
      </div>

      {/* ── Bottom content ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px",
          zIndex: 5,
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "transform 0.4s var(--ease-out)",
        }}
      >
        {/* Description — reveals on hover */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: "10px",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.35s var(--ease-out) 0.05s",
          }}
        >
          {card.desc}
        </p>

        {/* Name */}
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "2px",
            letterSpacing: "0.5px",
          }}
        >
          {card.name}
        </div>

        {/* Role */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "9px",
            letterSpacing: "2px",
            color: "var(--gold)",
            marginBottom: "12px",
            fontWeight: "600",
          }}
        >
          {card.role.toUpperCase()}
        </div>

        {/* Power bar - unified gold */}
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
          background: "linear-gradient(to left, rgba(204,51,51,0.5), transparent)",
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
          background: "linear-gradient(to top, rgba(204,51,51,0.5), transparent)",
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
      style={{
        padding: "100px 0 80px",
        position: "relative",
        background:
          "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(120,30,30,0.07) 0%, transparent 60%), var(--bg-base)",
        overflow: "hidden",
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
          background: "linear-gradient(to bottom, transparent, rgba(204,51,51,0.5), transparent)",
        }}
      />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section header */}
        <div style={{ marginBottom: "56px" }}>
          <div
            className="animate-fade-in-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              fontFamily: "var(--font-sans)",
              fontSize: "9px",
              letterSpacing: "3px",
              color: "var(--gold)",
              fontWeight: "700",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--gold)",
                boxShadow: "0 0 8px rgba(201, 162, 39, 0.5)",
                display: "inline-block",
              }}
            />
            CORE TEAM
          </div>

          <h2 className="animate-fade-in-up delay-100 heading-display" style={{ lineHeight: 1.05, margin: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(44px, 5.5vw, 72px)",
                letterSpacing: "var(--tracking-normal)",
              }}
            >
              <span className="heading-display-bold">Core</span>{" "}
              <span className="heading-display-italic" style={{ color: "var(--red-muted)" }}>Stack</span>
            </span>
          </h2>

          <p
            className="animate-fade-in-up delay-200 text-body"
            style={{
              marginTop: "16px",
              maxWidth: "460px",
            }}
          >
            Four modules. One execution engine.
          </p>
        </div>

        {/* Bento grid - 4 columns, taller cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
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
              background: "linear-gradient(to right, transparent, rgba(204,51,51,0.3))",
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
              background: "linear-gradient(to left, transparent, rgba(204,51,51,0.3))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
