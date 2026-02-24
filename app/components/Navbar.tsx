"use client";

import { useState } from "react";

const links = ["MARKETS", "STACK", "JOIN", "DOCS"];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar animate-slide-down">
        <div className="navbar-inner">
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <div className="logo-text" style={{ fontSize: "28px" }}>
              XD
            </div>
            <div className="logo-subtitle">LIQUIDITY</div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a key={link} href="#" className="nav-link">
                {link}
              </a>
            ))}
          </div>

          {/* Right side: CTA + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
            {/* Desktop CTA */}
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex btn btn-outline-red"
            >
              JOIN XD
            </a>

            {/* Hamburger button — visible on mobile only */}
            <button
              className="flex md:hidden hamburger-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <span style={{ color: "var(--red)", fontSize: "18px", lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <span className="hamburger-line hamburger-line-long" />
                  <span className="hamburger-line hamburger-line-short" />
                  <span className="hamburger-line hamburger-line-long" />
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden mobile-drawer ${menuOpen ? "mobile-drawer-visible" : "mobile-drawer-hidden"}`}
      >
        {/* Mobile nav links */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0",
            marginBottom: "var(--space-10)",
          }}
        >
          {links.map((link, i) => (
            <a
              key={link}
              href="#"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                fontSize: "var(--text-md)",
                letterSpacing: "var(--tracking-label-wider)",
                padding: "var(--space-7) 0",
                borderBottom: "1px solid var(--border-subtle)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Mobile CTA */}
        <a
          href=""
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-solid-red"
          style={{
            width: "100%",
            padding: "var(--space-6)",
          }}
        >
          JOIN XD
        </a>
      </div>

      {/* Backdrop when menu open */}
      {menuOpen && (
        <div
          className="md:hidden mobile-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
