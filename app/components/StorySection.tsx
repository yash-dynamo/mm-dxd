"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const STORY_CARDS = [
  {
    img: "/cards/1.png",
    title: "Sacred Spread",
    sub: "Rias Gremory",
    line: "The market bends to her will.",
    tag: "CORE",
  },
  {
    img: "/cards/2.png",
    title: "Thunder Execution",
    sub: "Akeno Himejima",
    line: "Every fill is a lightning strike.",
    tag: "EXEC",
  },
  {
    img: "/cards/3.png",
    title: "Iron Defense",
    sub: "Koneko Toujou",
    line: "Loss caps. Zero exceptions.",
    tag: "RISK",
  },
  {
    img: "/cards/4.png",
    title: "Eternal Recovery",
    sub: "Asia Argento",
    line: "Drawdown healed. Engine reborn.",
    tag: "HEAL",
  },
];

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [revealed, setRevealed] = useState<boolean[]>(STORY_CARDS.map(() => false));
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger reveal
            STORY_CARDS.forEach((_, i) => {
              setTimeout(() => {
                setRevealed((prev) => {
                  const next = [...prev];
                  next[i] = true;
                  return next;
                });
              }, i * 160);
            });
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setActiveIdx(null)}
      style={{
        position: "relative",
        padding: "120px 0 140px",
        overflow: "hidden",
      }}
    >
      {/* Ambient cursor-follow gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 55% 45% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(200,16,46,0.07) 0%, transparent 65%)`,
          transition: "background 0.4s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 64,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "9px",
                letterSpacing: "3px",
                color: "var(--red)",
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--red)",
                }}
              />
              SACRED ARSENAL
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(52px, 7vw, 96px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 0.92,
                letterSpacing: "-2px",
                margin: 0,
              }}
            >
              <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--red-muted)" }}>
                Meet
              </span>{" "}
              the{" "}
              <span style={{ fontWeight: 700 }}>Engine</span>
            </h2>
          </div>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-lg)",
              color: "var(--text-muted)",
              maxWidth: 360,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Four roles. One unified liquidity machine. Hover to meet your next trade partner.
          </p>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {STORY_CARDS.map((card, i) => (
            <StoryCard
              key={i}
              card={card}
              revealed={revealed[i]}
              isActive={activeIdx === i}
              isSiblingActive={activeIdx !== null && activeIdx !== i}
              onEnter={() => setActiveIdx(i)}
              onLeave={() => setActiveIdx(null)}
              mouseX={mousePos.x}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryCard({
  card,
  revealed,
  isActive,
  isSiblingActive,
  onEnter,
  onLeave,
  mouseX,
}: {
  card: (typeof STORY_CARDS)[0];
  revealed: boolean;
  isActive: boolean;
  isSiblingActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  mouseX: number;
}) {
  const tilt = isActive ? (mouseX - 0.5) * 14 : 0;

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        borderRadius: 6,
        overflow: "hidden",
        aspectRatio: "3/4",
        border: isActive
          ? "1px solid var(--red)"
          : "1px solid rgba(255,255,255,0.06)",
        background: "#06000e",
        cursor: "default",
        opacity: revealed ? (isSiblingActive ? 0.45 : 1) : 0,
        transform: revealed
          ? isActive
            ? `translateY(-10px) rotateY(${tilt}deg) scale(1.04)`
            : "translateY(0) scale(1)"
          : "translateY(40px) scale(0.96)",
        transition:
          "opacity 0.6s var(--ease-out), transform 0.45s cubic-bezier(0.23,1,0.32,1), border-color 0.2s",
        transformStyle: "preserve-3d",
        perspective: "800px",
      }}
    >
      {/* Actual image */}
      <Image
        src={card.img}
        alt={card.sub}
        fill
        style={{
          objectFit: "cover",
          objectPosition: "top center",
          opacity: isActive ? 0.82 : 0.42,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,0,14,0.1) 0%, rgba(6,0,14,0.65) 60%, rgba(6,0,14,0.98) 100%)",
          zIndex: 1,
        }}
      />

      {/* Red bar on active */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "var(--red)",
            zIndex: 4,
          }}
        />
      )}

      {/* Tag */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "4px 10px",
          background: isActive ? "var(--red)" : "rgba(6,0,14,0.88)",
          border: "1px solid rgba(200,16,46,0.4)",
          fontFamily: "var(--font-sans)",
          fontSize: 8,
          letterSpacing: "2.5px",
          fontWeight: 700,
          color: isActive ? "#fff" : "var(--red-light)",
          borderRadius: 2,
          zIndex: 3,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {card.tag}
      </div>

      {/* Bottom content */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "20px 16px 16px",
          zIndex: 3,
        }}
      >
        {/* Quote line — slides up on hover */}
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "var(--text-lg)",
            color: "var(--text-secondary)",
            margin: "0 0 8px",
            lineHeight: 1.4,
            opacity: isActive ? 1 : 0,
            transform: isActive ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.3s, transform 0.3s",
          }}
        >
          {card.line}
        </p>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.3px",
          }}
        >
          {card.sub}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            letterSpacing: "2px",
            color: "var(--red)",
            fontWeight: 600,
            marginTop: 3,
          }}
        >
          {card.title.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
