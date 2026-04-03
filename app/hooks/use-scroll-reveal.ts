"use client";

import { useEffect } from "react";

const DEFAULT_SELECTOR = ".reveal, .reveal-left, .reveal-right, .reveal-scale";

/**
 * Observes reveal elements and adds `revealed` when they enter the viewport.
 * Re-scans the DOM when nodes are added (needed for `next/dynamic` sections that mount after first paint).
 */
export function useScrollReveal(selector = DEFAULT_SELECTOR) {
  useEffect(() => {
    const observed = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
    };

    scan();

    const mo = new MutationObserver(() => {
      scan();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [selector]);
}
