"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useActionStore } from "@/stores";
import { Iconify } from "@/components/ui/iconify";

const links = ["MARKETS", "STACK", "JOIN", "DOCS"];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { setModal } = useActionStore();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const walletLabel = useMemo(() => {
    if (!isConnected || !address) return "CONNECT WALLET";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [isConnected, address]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  // The wallet button: opens connect modal when disconnected, dropdown when connected
  const WalletButton = ({ fullWidth }: { fullWidth?: boolean }) =>
    isConnected && address ? (
      <div ref={fullWidth ? undefined : dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className={`btn btn-outline-gold${fullWidth ? "" : " hidden md:flex"}`}
          style={fullWidth ? { width: "100%", padding: "var(--space-6)" } : undefined}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              flexShrink: 0,
              boxShadow: "0 0 6px var(--green)",
            }}
          />
          {walletLabel}
          <Iconify
            icon="mingcute:down-line"
            width={12}
            height={12}
            style={{
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: fullWidth ? undefined : 0,
              left: fullWidth ? 0 : undefined,
              minWidth: fullWidth ? "100%" : 180,
              background: "var(--bg-card)",
              border: "1px solid var(--border-red-medium)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            {/* Address badge */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
                color: "var(--text-dim)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              {address.slice(0, 10)}…{address.slice(-8)}
            </div>

            {/* Copy */}
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                letterSpacing: "var(--tracking-label)",
                color: copied ? "var(--green)" : "var(--text-primary)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Iconify
                icon={copied ? "mingcute:check-line" : "mingcute:copy-2-line"}
                width={14}
                height={14}
              />
              {copied ? "COPIED" : "COPY ADDRESS"}
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderTop: "1px solid var(--border-subtle)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                letterSpacing: "var(--tracking-label)",
                color: "var(--red-light)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(204,51,51,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Iconify icon="mingcute:exit-line" width={14} height={14} />
              DISCONNECT
            </button>
          </div>
        )}
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setModal("connect-wallet")}
        className={`btn btn-outline-gold${fullWidth ? "" : " hidden md:flex"}`}
        style={fullWidth ? { width: "100%", padding: "var(--space-6)" } : undefined}
      >
        {walletLabel}
      </button>
    );

  return (
    <>
      <nav className="navbar animate-slide-down">
        {/* Gradient accent line at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: "linear-gradient(to right, transparent, var(--red), var(--gold), var(--red), transparent)",
            opacity: 0.5,
            borderRadius: "1px",
          }}
        />
        <div className="navbar-inner">
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <div
              className="logo-text"
              style={{
                fontSize: "28px",
                textShadow: "0 0 20px rgba(204, 51, 51, 0.4)",
              }}
            >
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

          {/* Right side: CTA + Wallet + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex btn btn-outline-red"
            >
              JOIN XD
            </a>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden mobile-drawer ${menuOpen ? "mobile-drawer-visible" : "mobile-drawer-hidden"}`}
      >
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

        <a
          href=""
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-solid-red"
          style={{ width: "100%", padding: "var(--space-6)" }}
        >
          JOIN XD
        </a>
        {/* Mobile wallet button with its own dropdown ref */}
        <div ref={dropdownRef} style={{ marginTop: "var(--space-4)" }}>
          <WalletButton fullWidth />
        </div>
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
