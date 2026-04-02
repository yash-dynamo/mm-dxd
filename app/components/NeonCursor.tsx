"use client";

import { useEffect, useRef } from "react";

export default function NeonCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide on dashboard pages
    const onRouteCheck = () => {
      const isDashboard = document.querySelector(".dashboard-app") !== null;
      dot.style.display = isDashboard ? "none" : "";
      ring.style.display = isDashboard ? "none" : "";
    };
    onRouteCheck();
    const obs = new MutationObserver(onRouteCheck);
    obs.observe(document.body, { childList: true, subtree: false });


    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    };

    const animateRing = () => {
      const { x: tx, y: ty } = posRef.current;
      const { x: rx, y: ry } = ringPosRef.current;
      const nx = rx + (tx - rx) * 0.12;
      const ny = ry + (ty - ry) * 0.12;
      ringPosRef.current = { x: nx, y: ny };
      if (ring) {
        ring.style.left = `${nx}px`;
        ring.style.top = `${ny}px`;
      }
      rafRef.current = requestAnimationFrame(animateRing);
    };
    rafRef.current = requestAnimationFrame(animateRing);

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hoverable = target.closest("a, button, [role='button'], input, select, textarea, label");
      if (hoverable) ring.classList.add("hovering");
    };
    const onLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hoverable = target.closest("a, button, [role='button'], input, select, textarea, label");
      if (hoverable) ring.classList.remove("hovering");
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onEnter, { passive: true });
    document.addEventListener("mouseout", onLeave, { passive: true });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(rafRef.current);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="neon-cursor-dot" aria-hidden />
      <div ref={ringRef} className="neon-cursor-ring" aria-hidden />
    </>
  );
}
