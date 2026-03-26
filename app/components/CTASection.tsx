"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Particles from "./Particles";
import { SparklesCore } from "../../components/ui/sparkles";
import { useAuthStore } from "@/stores";

export default function CTASection() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  const handleStart = useCallback(() => {
    router.push("/dashboard");
  }, [router]);
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

        {/* CTA Buttons - matching hero style */}
        <div
          className="animate-fade-in-up delay-300"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-6)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleStart}
            className="btn btn-primary animate-glow-red"
          >
            LAUNCH APP
          </button>

          <a href="#platforms" className="btn btn-secondary">
            STACK
          </a>
        </div>

        {/* Stats row - cleaner dividers */}
        <div 
          className="animate-fade-in-up delay-400" 
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0",
            marginTop: "64px",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "$420M+", sub: "Volume" },
            { label: "99.9%", sub: "Uptime" },
            { label: "0.008%", sub: "Spread" },
            { label: "2+", sub: "DEXes" },
          ].map((item, i) => (
            <div 
              key={i} 
              style={{
                textAlign: "center",
                padding: "0 32px",
                borderLeft: i > 0 ? "1px solid rgba(201, 162, 39, 0.15)" : "none",
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
