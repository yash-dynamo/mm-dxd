"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  type: "dot" | "cross";
}

export default function Particles({ count = 30 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      type: Math.random() > 0.7 ? "cross" : "dot",
    }));
    setParticles(generated);
  }, [count]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.type === "cross" ? "8px" : `${p.size}px`,
            height: p.type === "cross" ? "8px" : `${p.size}px`,
            opacity: p.opacity,
            animation: `float-slow ${p.duration}s ease-in-out ${p.delay}s infinite`,
            color: Math.random() > 0.5 ? "#ff2f4f" : "#ff5a72",
            fontSize: p.type === "cross" ? "8px" : undefined,
            borderRadius: p.type === "dot" ? "50%" : undefined,
            background:
              p.type === "dot"
                ? Math.random() > 0.5
                  ? "#ff2f4f"
                  : "#ff5a72"
                : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {p.type === "cross" && "✦"}
        </div>
      ))}
    </div>
  );
}
