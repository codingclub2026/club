"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, CalendarDays, Users, UserCog,
  ScrollText, LogOut, Code2, Menu, X,
} from "lucide-react";
import { adminApi, ADMIN_API } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/registrations", label: "Registrations", icon: Users },
  { href: "/admins", label: "Admin Accounts", icon: UserCog },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export default function Sidebar({ adminName, role }: { adminName?: string; role?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await adminApi(ADMIN_API.logout, { method: "POST" });
    } finally {
      // Clear localStorage tokens and session indicator cookie
      if (typeof window !== "undefined") {
        localStorage.removeItem("cv_admin_token");
        localStorage.removeItem("cv_admin_refresh_token");
      }
      document.cookie = "cv_admin_session=; path=/; SameSite=Lax; max-age=0";
      window.location.href = "/login";
    }
  };

  const roleColors: Record<string, string> = {
    super_admin: "#f87171",
    event_manager: "#fbbf24",
    volunteer: "#34d399",
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "8px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Code2 size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.1 }}>CodeVed</div>
            <div style={{ fontSize: "0.65rem", color: "#6366f1", fontWeight: 600 }}>Admin Panel</div>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation Menu"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#e2e8f0",
            borderRadius: "8px",
            padding: "0.45rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "1.25rem 1.25rem", borderBottom: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Code2 size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "0.95rem" }}>CodeVed</div>
              <div style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 600 }}>Admin Panel</div>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="mobile-close-btn"
            aria-label="Close Sidebar"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0.3rem",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin info */}
        {adminName && (
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#818cf8", fontWeight: 700, fontSize: "0.9rem",
              }}>
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.875rem" }}>{adminName}</div>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 600,
                  color: roleColors[role ?? ""] ?? "#94a3b8",
                }}>
                  {role?.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
          <div style={{ padding: "0.5rem 1.25rem 0.25rem", color: "#64748b", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Navigation
          </div>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`nav-item ${pathname === href ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(99,102,241,0.15)" }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="nav-item"
            style={{ width: "100%", border: "none", background: "none", color: loggingOut ? "#64748b" : "#f87171" }}
          >
            <LogOut size={18} />
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
