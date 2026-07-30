import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EventCard from "@/components/ui/EventCard";
import { Code2, Zap, Shield, Trophy, ChevronRight, Star, Users, Calendar, ArrowRight, Target, BookOpen, Award, Cpu, Lock, Rocket } from "lucide-react";

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
  { label: "Members", value: "TBA", icon: Users },
  { label: "Events/Year", value: "TBA", icon: Calendar },
  { label: "Prize Pool", value: "TBA", icon: Trophy },
  { label: "Workshops", value: "TBA", icon: BookOpen },
];

const objectives = [
  { emoji: "💻", text: "Promote coding culture among students" },
  { emoji: "🚀", text: "Improve programming skills through practice" },
  { emoji: "🏆", text: "Conduct workshops and coding contests" },
  { emoji: "💼", text: "Prepare students for placements & internships" },
  { emoji: "🌐", text: "Encourage open-source contributions" },
  { emoji: "⚡", text: "Organize hackathons and innovation events" },
  { emoji: "🛠️", text: "Build real-world software projects" },
  { emoji: "🎟️", text: "Free access to Aayam Tech Fest for all members" },
];

const roles = [
  {
    icon: "🗂️", title: "Club Administration",
    items: ["Prepare annual action plan", "Maintain member & committee records", "Organize regular club meetings", "Document attendance, reports & photos"],
  },
  {
    icon: "⚡", title: "Competitive Programming",
    items: ["Coding practice sessions", "Contests on HackerRank, LeetCode, CodeChef", "Train students in DSA", "Form teams for inter-college competitions"],
  },
  {
    icon: "🔥", title: "Hackathons",
    items: ["Organize internal hackathons", "Mentor teams — problem to product", "Coordinate Smart India Hackathon (SIH)", "Participate in external competitions"],
  },
  {
    icon: "📚", title: "Software Development",
    items: ["C/C++, Python, Java workshops", "Web Dev — HTML, CSS, JS, React", "Android Development", "Git & GitHub, AI/ML basics"],
  },
  {
    icon: "🚀", title: "Project Development",
    items: ["Guide mini & major projects", "Encourage open-source contributions", "Help publish innovative software", "Portfolio & GitHub profile building"],
  },
  {
    icon: "🏭", title: "Industry Interaction",
    items: ["Expert talks from software engineers", "Coding bootcamps & seminars", "Industrial visits to IT companies", "Mock technical interviews"],
  },
];

const technicalEvents = [
  { emoji: "⏱️", name: "Coding Marathon" },
  { emoji: "🐛", name: "Debugging Contest" },
  { emoji: "🏌️", name: "Code Golf" },
  { emoji: "📱", name: "App Dev Challenge" },
  { emoji: "🎨", name: "Web Design Competition" },
  { emoji: "📝", name: "Programming Quiz" },
  { emoji: "🤖", name: "AI Coding Challenge" },
  { emoji: "🛡️", name: "CTF — Cyber Security" },
];

const studentLevels = [
  {
    level: "Beginner",
    color: "#34d399",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(52,211,153,0.25)",
    icon: "🌱",
    topics: ["C Programming", "Python", "HTML"],
  },
  {
    level: "Intermediate",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(251,191,36,0.25)",
    icon: "⚡",
    topics: ["Data Structures & Algorithms", "Object-Oriented Programming", "SQL & Databases"],
  },
  {
    level: "Advanced",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.25)",
    icon: "🚀",
    topics: ["Competitive Programming", "AI / Machine Learning", "Cyber Security", "Full Stack Development"],
  },
];

const rules = [
  { icon: "📅", title: "Attendance", desc: "Minimum 70% attendance required. Three consecutive unnoticed absences may lead to suspension." },
  { icon: "🤝", title: "Discipline", desc: "Respect faculty and fellow members. Follow the Code of Conduct and practice academic integrity." },
  { icon: "🧑‍💻", title: "Active Participation", desc: "At least one coding contest/month, one workshop/semester, and one hackathon annually." },
  { icon: "🌟", title: "Teamwork", desc: "Share knowledge, help beginners, avoid discrimination, and collaborate across skill levels." },
];

const strictNos = [
  "Pirated software usage",
  "Hacking university systems",
  "Illegal activities",
  "Cheating during contests or plagiarism",
];

export default async function HomePage() {
  const events = await getFeaturedEvents();

  const sectionTitle = (title: string, gradient: string) => (
    <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.75rem" }}>
      {title} <span className="gradient-text">{gradient}</span>
    </h2>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "8rem 2rem 4rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "999px", padding: "0.4rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#818cf8", fontWeight: 600 }}>
          <Zap size={14} /> RKDF Coding & Programming Club — 2026
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "999px", padding: "0.35rem 0.9rem", marginBottom: "2rem", fontSize: "0.78rem", color: "#34d399", fontWeight: 600 }}>
          🎟️ Members get FREE access to Aayam Tech Fest — every event!
        </div>

        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          <span style={{ color: "#e2e8f0" }}>Code •</span>{" "}
          <span className="gradient-text">Create</span>
          <br />
          <span style={{ color: "#e2e8f0" }}>Collaborate •</span>{" "}
          <span style={{ color: "#6366f1" }}>Innovate</span>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: 580, lineHeight: 1.7, marginBottom: "2.5rem" }}>
          Develop into a skilled programmer, problem solver, and software developer. Compete in hackathons, build real projects, and prepare for the software industry.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "4rem" }}>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              Explore Events <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/sign-up" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              Join the Club
            </button>
          </Link>
        </div>

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

      {/* ── VISION & MEMBERSHIP ────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* Vision */}
          <div className="glass" style={{ borderRadius: "1.25rem", padding: "2.5rem", borderLeft: "3px solid #6366f1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 40, height: 40, background: "rgba(99,102,241,0.15)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={20} color="#6366f1" />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#e2e8f0" }}>Our Vision</h2>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: "0.95rem" }}>
              To develop students into <strong style={{ color: "#e2e8f0" }}>skilled programmers, problem solvers, and software developers</strong> capable of succeeding in competitive programming, hackathons, internships, and the software industry.
            </p>
            <div style={{ marginTop: "1.5rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.75rem", padding: "0.875rem 1rem" }}>
              <p style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.9rem", textAlign: "center" }}>
                🎯 &quot;Code • Create • Collaborate • Innovate&quot;
              </p>
            </div>
          </div>

          {/* Membership */}
          <div className="glass" style={{ borderRadius: "1.25rem", padding: "2.5rem", borderLeft: "3px solid #34d399" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 40, height: 40, background: "rgba(52,211,153,0.15)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={20} color="#34d399" />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#e2e8f0" }}>Membership</h2>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1rem" }}>Open to all students with a passion for programming.</p>

            <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#34d399" }}>₹200</div>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>One-time Annual Fee (Basic)</div>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fee covers:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["Certificates", "Printing", "Stationery", "Refreshments", "Prizes"].map(item => (
                <span key={item} style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", borderRadius: "999px", padding: "0.25rem 0.75rem", fontSize: "0.78rem", fontWeight: 600 }}>{item}</span>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🎟️</span>
              <span style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 700 }}>FREE access to all Aayam Tech Fest events!</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJECTIVES ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          {sectionTitle("Club", "Objectives")}
          <p style={{ color: "#94a3b8" }}>What we aim to achieve together</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {objectives.map((obj, i) => (
            <div key={i} className="glass" style={{ borderRadius: "1rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem", transition: "transform 0.2s ease" }}>
              <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{obj.emoji}</span>
              <span style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>{obj.text}</span>
            </div>
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
              <EventCard key={event.id} id={event.id} title={event.title} description={event.description} category={event.category} event_date={event.event_date} venue={event.venue} cover_image_url={event.cover_image_url} registration_count={event._count?.registrations} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", background: "rgba(99,102,241,0.05)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: "1rem", color: "#64748b" }}>
            <Code2 size={48} color="#6366f1" style={{ margin: "0 auto 1rem", display: "block", opacity: 0.5 }} />
            <p style={{ fontSize: "1.1rem" }}>Events coming soon. Stay tuned!</p>
          </div>
        )}
      </section>

      {/* ── STUDENT LEVELS ────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.04), transparent)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            {sectionTitle("Your Learning", "Journey")}
            <p style={{ color: "#94a3b8" }}>Progress through structured skill levels</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {studentLevels.map((lvl) => (
              <div key={lvl.level} style={{ background: lvl.bg, border: `1px solid ${lvl.border}`, borderRadius: "1.25rem", padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "2rem" }}>{lvl.icon}</span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: lvl.color }}>{lvl.level}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {lvl.topics.map(topic => (
                    <div key={topic} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: lvl.color, flexShrink: 0 }} />
                      <span style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES & RESPONSIBILITIES ──────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          {sectionTitle("Roles &", "Responsibilities")}
          <p style={{ color: "#94a3b8" }}>What our club actively does for you</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {roles.map((role) => (
            <div key={role.title} className="glass" style={{ borderRadius: "1.25rem", padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "1.75rem" }}>{role.icon}</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>{role.title}</h3>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {role.items.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    <span style={{ color: "#6366f1", marginTop: 2, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECHNICAL EVENTS ──────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.04), transparent)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            {sectionTitle("Technical", "Events")}
            <p style={{ color: "#94a3b8" }}>Exciting competitions and challenges we organize</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
            {technicalEvents.map((ev) => (
              <div key={ev.name} style={{
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "1rem", padding: "1.25rem 1.75rem", display: "flex",
                alignItems: "center", gap: "0.75rem", cursor: "default",
                transition: "all 0.25s ease",
              }}
                className="glass-hover">
                <span style={{ fontSize: "1.5rem" }}>{ev.emoji}</span>
                <span style={{ color: "#cbd5e1", fontWeight: 600, fontSize: "0.9rem" }}>{ev.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RULES & CODE OF ETHICS ────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* Rules */}
          <div>
            <div style={{ textAlign: "left", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
                Rules & <span className="gradient-text">Regulations</span>
              </h2>
              <p style={{ color: "#94a3b8" }}>Standards every member follows</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {rules.map((rule) => (
                <div key={rule.title} className="glass" style={{ borderRadius: "1rem", padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{rule.icon}</span>
                  <div>
                    <p style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.95rem" }}>{rule.title}</p>
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code of Ethics */}
          <div>
            <div style={{ textAlign: "left", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
                Code of <span className="gradient-text">Ethics</span>
              </h2>
              <p style={{ color: "#94a3b8" }}>Integrity is non-negotiable</p>
            </div>
            <div className="glass" style={{ borderRadius: "1.25rem", padding: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <Lock size={18} color="#f87171" />
                <span style={{ color: "#f87171", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Strict No</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {strictNos.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ color: "#f87171", fontSize: "1rem", flexShrink: 0 }}>✗</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aayam Tech Fest Banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: "1.25rem", padding: "1.75rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎟️</div>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>Aayam Tech Fest — Free Access</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
                All club members enjoy <strong style={{ color: "#818cf8" }}>complimentary access</strong> to every event at Aayam Tech Fest — hackathons, workshops, seminars, and competitions.
              </p>
              <Link href="/sign-up" style={{ textDecoration: "none" }}>
                <button className="btn-primary" style={{ marginTop: "1.25rem", fontSize: "0.875rem", padding: "0.625rem 1.5rem" }}>
                  Join & Get Free Access <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(99,102,241,0.15)", padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Code2 size={16} color="#6366f1" />
          <span style={{ fontWeight: 700, color: "#e2e8f0" }}>RKDF Coding & Programming Club</span>
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
