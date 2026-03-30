"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import Image from "next/image";
import { useActionStore } from "@/stores";
import { Iconify } from "@/components/ui/iconify";

const navLinks = ["JOIN"];
const comingSoonContent = {
  docs: {
    label: "DOCS",
    message: "DXD docs are being prepared with API guides, session flows, and config references.",
  },
  markets: {
    label: "MARKETS",
    message: "Markets board is being tuned for live spreads, depth, and cross-symbol monitoring.",
  },
} as const;
type ComingSoonKey = keyof typeof comingSoonContent;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState<ComingSoonKey | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    if (!comingSoonOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setComingSoonOpen(null);
    };
    document.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [comingSoonOpen]);

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

  const openComingSoon = (kind: ComingSoonKey) => {
    setMenuOpen(false);
    setComingSoonOpen(kind);
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

            {/* Dashboard */}
            <button
              onClick={() => { setDropdownOpen(false); router.push("/dashboard"); }}
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
                color: "var(--text-primary)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Iconify icon="mingcute:dashboard-2-line" width={14} height={14} />
              DASHBOARD
            </button>

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
              DXD
            </div>
            <div className="logo-subtitle">LIQUIDITY</div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              className="nav-link"
              onClick={() => openComingSoon("markets")}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              MARKETS
            </button>
            {navLinks.map((link) => (
              <a key={link} href="#" className="nav-link">
                {link}
              </a>
            ))}
            <button
              type="button"
              className="nav-link"
              onClick={() => openComingSoon("docs")}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              DOCS
            </button>
          </div>

          {/* Right side: CTA + Wallet + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="hidden md:flex btn btn-outline-red"
            >
              LAUNCH APP
            </button>
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
          {navLinks.map((link, i) => (
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
          <button
            type="button"
            onClick={() => openComingSoon("markets")}
            className="nav-link"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              marginTop: "var(--space-6)",
              textAlign: "left",
              fontSize: "var(--text-md)",
              letterSpacing: "var(--tracking-label-wider)",
            }}
          >
            MARKETS
          </button>
          <button
            type="button"
            onClick={() => openComingSoon("docs")}
            className="nav-link"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              marginTop: "var(--space-6)",
              textAlign: "left",
              fontSize: "var(--text-md)",
              letterSpacing: "var(--tracking-label-wider)",
            }}
          >
            DOCS
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
          className="btn btn-solid-red"
          style={{ width: "100%", padding: "var(--space-6)" }}
        >
          LAUNCH APP
        </button>
        {/* Mobile wallet button with its own dropdown ref */}
        <div ref={dropdownRef} style={{ marginTop: "var(--space-4)" }}>
          <WalletButton fullWidth />
        </div>
      </div>

      {comingSoonOpen && (
        <div
          onClick={() => setComingSoonOpen(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            background: "rgba(8, 7, 12, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "var(--bg-card)",
              border: "1px solid var(--border-red-medium)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "0 18px 60px rgba(0,0,0,0.65)",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: 220 }}>
              <Image src="/seductive/5.png" alt="Coming soon" fill style={{ objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(6, 2, 10, 0.78), rgba(6, 2, 10, 0.16))",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(201,162,39,0.35)",
                  background: "rgba(9, 6, 16, 0.72)",
                  color: "var(--gold)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                {comingSoonContent[comingSoonOpen].label}
              </div>
              <button
                type="button"
                onClick={() => setComingSoonOpen(null)}
                aria-label="Close coming soon modal"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.5)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px 20px 22px" }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  fontWeight: 700,
                }}
              >
                Coming soon
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.05rem, 2.6vw, 1.35rem)",
                  fontStyle: "italic",
                  color: "var(--text-primary)",
                  lineHeight: 1.45,
                }}
              >
                {comingSoonContent[comingSoonOpen].message}
              </p>
            </div>
          </div>
        </div>
      )}

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
