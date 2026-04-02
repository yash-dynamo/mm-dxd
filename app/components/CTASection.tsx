"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const stats = [
  { label: "$50k+", sub: "Daily Volume" },
  { label: "99.9%", sub: "Uptime" },
  { label: "0.001%", sub: "Avg Spread" },
  { label: "2+", sub: "Live DEXes" },
];

export default function CTASection() {
  useScrollReveal();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "160px 32px 180px",
        overflow: "hidden",
        textAlign: "center",
        background: "var(--bg-base)",
        borderTop: "1px solid rgba(200,16,46,0.15)",
      }}
    >
      {/* Large background letter */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(320px, 40vw, 520px)",
          fontWeight: 700,
          color: "transparent",
          WebkitTextStroke: "1px rgba(200,16,46,0.07)",
          letterSpacing: "-12px",
          pointerEvents: "none",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        DXD
      </div>

      {/* Horizontal rule top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(200,16,46,0.4), transparent)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
        {/* Badge */}
        <div
          className="reveal"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
            padding: "6px 16px",
            border: "1px solid rgba(200,16,46,0.3)",
            background: "rgba(200,16,46,0.05)",
            fontFamily: "var(--font-sans)",
            fontSize: 9,
            letterSpacing: "3px",
            color: "var(--red)",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--red)",
              display: "inline-block",
            }}
          />
          READY TO TRADE
        </div>

        {/* Giant headline */}
        <div
          className="reveal reveal-delay-1"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(60px, 10vw, 140px)",
            fontWeight: 700,
            lineHeight: 0.88,
            letterSpacing: "-4px",
            marginBottom: 40,
            color: "var(--text-primary)",
          }}
        >
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--red-muted)" }}>
            Go
          </span>
          <br />
          <span>with DXD</span>
        </div>

        {/* Sub */}
        <p
          className="reveal reveal-delay-2"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-lg)",
            color: "var(--text-muted)",
            marginBottom: 52,
            lineHeight: 1.7,
          }}
        >
          Sacred algorithms. Live liquidity. Zero compromise.
        </p>

        {/* CTA buttons */}
        <div
          className="reveal reveal-delay-3"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 80,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-cube"
            aria-label="Launch App"
          >
            <span className="btn-cube-inner">LAUNCH APP →</span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-outline-red"
            style={{ height: 44 }}
          >
            JOIN THE PROTOCOL
          </button>
        </div>

        {/* Stats bar */}
        <div
          className="reveal reveal-delay-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "32px 0",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                padding: "0 16px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  color: "var(--red-light)",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  letterSpacing: "2px",
                  color: "var(--text-ghost)",
                  textTransform: "uppercase",
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
