"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import EventCard from "@/components/ui/EventCard";
import { Search, Filter, Calendar, Sparkles, RefreshCw } from "lucide-react";

const MEMBERSHIPS = ["all", "Open to All", "Club Members Only", "RKDF Students Only"];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [membership, setMembership] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (membership !== "all") params.set("status", "published");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events?${params}`);
      const data = await res.json();
      if (data.success && data.data) {
        let list = data.data.events || [];
        if (membership !== "all") {
          list = list.filter((e: any) => e.membership === membership);
        }
        setEvents(list);
        setTotal(list.length);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [membership, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060d" }}>
      <Navbar />

      <div style={{ paddingTop: "5rem", padding: "5rem 2rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
        {/* Animated Page Title Header */}
        <div className="animate-fade-in" style={{ marginBottom: "3rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
            padding: "0.35rem 1rem", borderRadius: "999px", color: "#818cf8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem"
          }}>
            <Sparkles size={14} /> EXPLORE CODEVED 2026 EVENTS
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#f1f5f9", marginBottom: "0.75rem" }}>
            Official Event <span className="gradient-text">Catalog</span>
          </h1>
          <p style={{ color: "#94a3b8", maxWidth: 500, margin: "0 auto", fontSize: "1rem" }}>
            Browse workshops, hackathons, and tournaments. Register in seconds and download your digital event entry pass.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="glass" style={{ borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 260, display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} color="#818cf8" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search by event title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem 0.75rem 2.75rem",
                    color: "#f1f5f9",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
              <button className="btn-primary" type="submit" style={{ whiteSpace: "nowrap" }}>
                Search
              </button>
            </form>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {MEMBERSHIPS.map((item) => (
                <button
                  key={item}
                  onClick={() => { setMembership(item); setPage(1); }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: membership === item ? "#6366f1" : "rgba(255,255,255,0.08)",
                    background: membership === item ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))" : "rgba(255,255,255,0.02)",
                    color: membership === item ? "#ffffff" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {item === "all" ? "All Requirements" : item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <p style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600 }}>
            {loading ? "Searching events database..." : `${events.length} event${events.length === 1 ? "" : "s"} available`}
          </p>
        </div>

        {/* Events Grid / Skeleton Loading */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass" style={{ height: 380, borderRadius: "1.25rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="skeleton" style={{ height: 180, width: "100%", borderRadius: "0.75rem" }} />
                <div className="skeleton" style={{ height: 24, width: "70%" }} />
                <div className="skeleton" style={{ height: 16, width: "90%" }} />
                <div className="skeleton" style={{ height: 16, width: "50%" }} />
                <div className="skeleton" style={{ height: 42, width: "100%", marginTop: "auto", borderRadius: "0.75rem" }} />
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                id={ev.id}
                title={ev.title}
                description={ev.description}
                amount={ev.amount}
                membership={ev.membership}
                venue={ev.venue}
                cover_image_url={ev.poster_url}
                registration_count={ev._count?.registrations}
              />
            ))}
          </div>
        ) : (
          <div className="glass" style={{ textAlign: "center", padding: "5rem 2rem", borderRadius: "1.25rem" }}>
            <Calendar size={48} color="#6366f1" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h3 style={{ color: "#e2e8f0", fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Events Found</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>No published events match your search filters right now.</p>
            <button className="btn-secondary" onClick={() => { setSearch(""); setMembership("all"); }}>
              <RefreshCw size={14} /> Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
