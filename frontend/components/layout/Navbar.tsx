"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "My Registrations" },
];

export default function Navbar() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(10, 10, 15, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "8px",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Code2 size={20} color="white" />
        </div>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0" }}>
          Code<span style={{ color: "#6366f1" }}>Ved</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden-mobile">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: pathname === link.href ? "#818cf8" : "#94a3b8",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "color 0.2s",
              borderBottom: pathname === link.href ? "2px solid #6366f1" : "2px solid transparent",
              paddingBottom: "2px",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {isSignedIn ? (
          <UserButton />
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                Sign Up
              </button>
            </SignUpButton>
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
          className="show-mobile"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: "absolute",
          top: "64px",
          left: 0,
          right: 0,
          background: "#0a0a0f",
          borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
          padding: "1rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: "#94a3b8", textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
