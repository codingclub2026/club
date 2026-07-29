import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EventCard from "@/components/ui/EventCard";
import { Code2, Zap, Shield, Trophy, ChevronRight, Star, Users, Calendar, ArrowRight } from "lucide-react";

async function getFeaturedEvents() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events?status=published&limit=6`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data.data?.events ?? [];
  } catch {
    return [];
  }
}

const stats = [
  { label: "Events", value: "50+", icon: Calendar },
  { label: "Participants", value: "10K+", icon: Users },
  { label: "Prize Pool", value: "₹5L+", icon: Trophy },
  { label: "Colleges", value: "200+", icon: Star },
];

const categories = [
  { name: "Technical", color: "#818cf8", bg: "rgba(99,102,241,0.1)", emoji: "💻" },
  { name: "Hackathon", color: "#f87171", bg: "rgba(239,68,68,0.1)", emoji: "⚡" },
  { name: "Gaming", color: "#34d399", bg: "rgba(16,185,129,0.1)", emoji: "🎮" },
  { name: "Workshop", color: "#fbbf24", bg: "rgba(245,158,11,0.1)", emoji: "🛠️" },
  { name: "Cultural", color: "#f472b6", bg: "rgba(236,72,153,0.1)", emoji: "🎭" },
];

export default async function HomePage() {
  const events = await getFeaturedEvents();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "8rem 2rem 4rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div style={{
          position: "absolute", top: "20%", left: "10%", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "999px", padding: "0.4rem 1rem", marginBottom: "2rem",
          fontSize: "0.8rem", color: "#818cf8", fontWeight: 600,
        }}>
          <Zap size={14} />
          Q3 2026 Edition — Registrations Now Open
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
          <span style={{ color: "#e2e8f0" }}>Unleash Your</span>
          <br />
          <span className="gradient-text">Inner Coder</span>
          <br />
          <span style={{ color: "#e2e8f0" }}>at </span>
          <span style={{ color: "#6366f1" }}>CodeVed</span>
        </h1>

        <p style={{ fontSize: "1.15rem", color: "#94a3b8", maxWidth: 560, lineHeight: 1.7, marginBottom: "2.5rem" }}>
          India&apos;s premier technical festival. Compete in hackathons, coding contests, gaming tournaments, and workshops. Win prizes, network, and level up.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "4rem" }}>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              Explore Events <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/sign-up" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              Get Started
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <Icon size={18} color="#6366f1" />
                <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0" }}>{value}</span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.75rem" }}>
            Event <span className="gradient-text">Categories</span>
          </h2>
          <p style={{ color: "#94a3b8" }}>Something for every skill and passion</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          {categories.map((cat) => (
            <Link key={cat.name} href={`/events?category=${cat.name.toLowerCase()}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: cat.bg,
                border: `1px solid ${cat.color}30`,
                borderRadius: "1rem",
                padding: "1.5rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                minWidth: 140,
              }}
                className="glass-hover"
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cat.emoji}</div>
                <div style={{ color: cat.color, fontWeight: 600, fontSize: "0.9rem" }}>{cat.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED EVENTS ──────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
              Featured <span className="gradient-text">Events</span>
            </h2>
            <p style={{ color: "#94a3b8" }}>Don&apos;t miss these highlights</p>
          </div>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              View All <ChevronRight size={18} />
            </button>
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="events-grid">
            {events.map((event: any) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                description={event.description}
                category={event.category}
                event_date={event.event_date}
                venue={event.venue}
                cover_image_url={event.cover_image_url}
                registration_count={event._count?.registrations}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: "center", padding: "4rem",
            background: "rgba(99,102,241,0.05)",
            border: "1px dashed rgba(99,102,241,0.3)",
            borderRadius: "1rem", color: "#64748b",
          }}>
            <Code2 size={48} color="#6366f1" style={{ margin: "0 auto 1rem", display: "block", opacity: 0.5 }} />
            <p style={{ fontSize: "1.1rem" }}>Events coming soon. Stay tuned!</p>
          </div>
        )}
      </section>

      {/* ── WHY CODEVID ──────────────────────────────────────────────────── */}
      <section style={{
        padding: "5rem 2rem",
        background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.05), transparent)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "1rem" }}>
            Why <span className="gradient-text">CodeVed?</span>
          </h2>
          <p style={{ color: "#94a3b8", marginBottom: "3rem", maxWidth: 500, margin: "0 auto 3rem" }}>
            Built for students, by students — with enterprise-grade security.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "⚡", title: "Lightning Fast Registration", desc: "One-click solo or team-based event registration. Confirmation in seconds." },
              { icon: "🔒", title: "Bank-Grade Security", desc: "Clerk auth for students, separate admin system. Your data is safe." },
              { icon: "🎫", title: "Digital E-Tickets", desc: "QR-coded e-tickets emailed instantly. Scan at the door." },
              { icon: "📊", title: "Real-time Dashboard", desc: "Track all your registrations, teams, and event updates in one place." },
            ].map((feat) => (
              <div key={feat.title} className="glass glass-hover" style={{ padding: "2rem", borderRadius: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{feat.icon}</div>
                <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "0.75rem" }}>{feat.title}</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(99,102,241,0.15)",
        padding: "2rem",
        textAlign: "center",
        color: "#64748b",
        fontSize: "0.85rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Code2 size={16} color="#6366f1" />
          <span style={{ fontWeight: 700, color: "#e2e8f0" }}>CodeVed</span>
        </div>
        <p>© 2026 CodeVed Organizing Committee. All rights reserved.</p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/login" style={{ color: "#6366f1", textDecoration: "none", fontSize: "0.8rem" }}>
            Admin Panel
          </Link>
        </p>
      </footer>
    </div>
  );
}
