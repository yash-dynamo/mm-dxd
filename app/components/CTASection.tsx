"use client";

import Particles from "./Particles";
import { SparklesCore } from "../../components/ui/sparkles";

export default function CTASection() {
  return (
    <section className="cta-section">
      {/* Aceternity Sparkles Background - subtle gold */}
      <div className="absolute inset-0 w-full h-full opacity-40">
        <SparklesCore
          id="cta-sparkles"
          background="transparent"
          minSize={0.3}
          maxSize={1}
          particleDensity={25}
          particleColor="#C9A227"
          speed={0.8}
        />
      </div>

      <Particles count={15} />

      {/* Decorative rings */}
      <div className="cta-ring cta-ring-outer" />
      <div className="cta-ring cta-ring-inner" />

      <div className="container-sm" style={{ position: "relative", zIndex: 1 }}>
        {/* Label badge - gold like hero */}
        <div 
          className="animate-fade-in-up" 
          style={{ 
            marginBottom: "var(--space-12)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
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
          GET STARTED
        </div>

        {/* Heading - single line like hero */}
        <h2 
          className="animate-fade-in-up delay-100 heading-display" 
          style={{ 
            marginBottom: "var(--space-10)",
            fontSize: "clamp(48px, 7vw, 88px)",
            letterSpacing: "var(--tracking-normal)",
          }}
        >
          <span className="heading-display-italic">Go</span>{" "}
          <span className="heading-display-bold">with</span>{" "}
          <span className="animate-glow-gold logo-text" style={{ color: "var(--gold)", letterSpacing: "6px" }}>
            DXD
          </span>
        </h2>

        <p
          className="animate-fade-in-up delay-200 text-body"
          style={{
            marginBottom: "var(--space-15)",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Live liquidity. Minimal friction.
        </p>

        {/* Stats — responsive grid; borders via .cta-stat-cell */}
        <div className="animate-fade-in-up delay-400 cta-stats-grid">
          {[
            { label: "$50k+", sub: "Volume" },
            { label: "99.9%", sub: "Uptime" },
            { label: "0.001%", sub: "Spread" },
            { label: "2+", sub: "DEXes" },
          ].map((item, i) => (
            <div 
              key={i} 
              className="cta-stat-cell"
              style={{
                textAlign: "center",
              }}
            >
              <div 
                style={{ 
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "clamp(28px, 3.5vw, 36px)",
                  color: "var(--gold)",
                  marginBottom: "6px",
                }}
              >
                {item.label}
              </div>
              <div 
                style={{ 
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
