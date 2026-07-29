"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { adminApi, ADMIN_API } from "@/lib/api";
import {
  Users, CalendarDays, CheckCircle2, BarChart3,
  TrendingUp, Activity, Clock,
} from "lucide-react";

interface Stats {
  totalEvents: number;
  publishedEvents: number;
  totalStudents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  recentRegistrations: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [statsRes, meRes] = await Promise.all([
        adminApi<Stats>(ADMIN_API.stats),
        adminApi<any>(ADMIN_API.me),
      ]);
      if (statsRes.success) setStats(statsRes.data!);
      if (meRes.success) setAdmin(meRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = stats ? [
    { label: "Total Events", value: stats.totalEvents, sub: `${stats.publishedEvents} published`, icon: CalendarDays, color: "#818cf8" },
    { label: "Registered Students", value: stats.totalStudents, icon: Users, color: "#34d399" },
    { label: "Total Registrations", value: stats.totalRegistrations, sub: `${stats.confirmedRegistrations} confirmed`, icon: CheckCircle2, color: "#fbbf24" },
    { label: "Conversion Rate", value: stats.totalRegistrations > 0 ? Math.round((stats.confirmedRegistrations / stats.totalRegistrations) * 100) + "%" : "0%", icon: TrendingUp, color: "#f87171" },
  ] : [];

  return (
    <div style={{ display: "flex", background: "#080810", minHeight: "100vh" }}>
      <Sidebar adminName={admin?.display_name} role={admin?.role} />

      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.25rem" }}>
            Welcome back, <span className="gradient-text">{admin?.display_name ?? "Admin"}</span> 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 120, borderRadius: "1rem", background: "#0d0d1a" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {statCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "10px",
                    background: `${card.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <card.icon size={20} color={card.color} />
                  </div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.25rem" }}>
                  {card.value}
                </div>
                <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{card.label}</div>
                {card.sub && <div style={{ color: card.color, fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: 600 }}>{card.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Recent registrations */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Activity size={20} color="#6366f1" />
            <h2 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1rem" }}>Recent Registrations</h2>
          </div>

          {stats?.recentRegistrations?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Event</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.map((reg: any) => (
                  <tr key={reg.id}>
                    <td>
                      <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{reg.user?.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{reg.user?.email}</div>
                    </td>
                    <td style={{ color: "#818cf8" }}>{reg.event?.title}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                        <Clock size={12} />
                        {new Date(reg.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No registrations yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
