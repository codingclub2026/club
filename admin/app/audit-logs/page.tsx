"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { adminApi, ADMIN_API } from "@/lib/api";
import { ScrollText, Search } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi<any[]>(ADMIN_API.auditLogs + "?limit=200").then(res => {
      if (res.success) setLogs(res.data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(log =>
    !search ||
    log.action?.includes(search.toLowerCase()) ||
    log.actor_id?.includes(search.toLowerCase())
  );

  const actionColor = (action: string) => {
    if (action.includes("fail") || action.includes("lock")) return "#f87171";
    if (action.includes("success") || action.includes("login.success")) return "#34d399";
    if (action.includes("delete") || action.includes("deactivate")) return "#fbbf24";
    if (action.includes("create")) return "#818cf8";
    return "#94a3b8";
  };

  return (
    <div style={{ display: "flex", background: "#080810", minHeight: "100vh" }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.25rem" }}>Audit Logs</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Security and activity trail — last {logs.length} events</p>
        </div>

        <div style={{ marginBottom: "1.25rem", position: "relative", maxWidth: 360 }}>
          <Search size={14} color="#6366f1" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
          <input className="input" placeholder="Filter by action or actor..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "2.5rem" }} />
        </div>

        <div className="card">
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "3rem" }}>Loading...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Resource</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                    <td>
                      <span style={{ color: actionColor(log.action), fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>
                      <div style={{ color: "#e2e8f0" }}>{log.actor_id?.slice(0, 8)}...</div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{log.actor_type}</div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.78rem", fontFamily: "monospace" }}>
                      {log.resource ?? "—"}
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.78rem" }}>{log.ip ?? "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No audit logs found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
