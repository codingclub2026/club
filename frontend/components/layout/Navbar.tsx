"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Code2, Menu, X, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "My Registrations" },
];

export default function Navbar() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(5, 6, 13, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
        height: "64px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          height: "100%",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo & University Name */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
          }}
        >
          <img
            src="https://ik.imagekit.io/ioyklag3bb/RKDF-LOGO.png?updatedAt=1781854542857"
            alt="RKDF University Ranchi Logo"
            style={{
              height: "38px",
              width: "auto",
              maxHeight: "38px",
              objectFit: "contain",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "2px 4px",
              boxShadow: "0 0 12px rgba(255, 255, 255, 0.2)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-heading, sans-serif)",
                lineHeight: 1.1,
              }}
            >
              Code<span style={{ color: "#818cf8" }}>Ved</span>
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#a855f7",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: "1px",
                whiteSpace: "nowrap",
              }}
            >
              RKDF UNIVERSITY RANCHI
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div
          className="hidden-mobile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? "#818cf8" : "#94a3b8",
                  textDecoration: "none",
                  fontSize: "0.925rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s ease",
                  position: "relative",
                  padding: "0.4rem 0",
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      borderRadius: "2px",
                      background: "linear-gradient(90deg, #6366f1, #a855f7)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop & Mobile Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href="https://aayamtechfest2026.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              color: "#ffffff",
              padding: "0.45rem 0.9rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <span>Aayam Tech Fest</span>
            <ExternalLink size={14} />
          </a>

          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <SignInButton mode="modal">
                <button
                  className="btn-secondary"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="btn-primary"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="show-mobile"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.5rem",
              color: "#e2e8f0",
              cursor: "pointer",
              padding: "0.45rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div
          className="animate-slide-down show-mobile"
          style={{
            position: "absolute",
            top: "64px",
            left: 0,
            right: 0,
            background: "rgba(10, 11, 22, 0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(99, 102, 241, 0.25)",
            padding: "1.25rem 1.5rem 1.75rem 1.5rem",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: isActive ? "#ffffff" : "#94a3b8",
                    background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                    padding: "0.65rem 1rem",
                    borderRadius: "0.375rem",
                    textDecoration: "none",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://aayamtechfest2026.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                color: "#ffffff",
                padding: "0.65rem 1rem",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                marginTop: "0.25rem",
              }}
            >
              <span>Visit Aayam Tech Fest</span>
              <ExternalLink size={16} />
            </a>
          </div>

          {!isSignedIn && (
            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                paddingTop: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <SignInButton mode="modal">
                <button
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.65rem" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.65rem" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
