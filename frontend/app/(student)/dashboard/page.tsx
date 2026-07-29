"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { apiFetch, API } from "@/lib/api";
import { Calendar, CheckCircle, Clock, XCircle, QrCode, Download, Printer, X, Sparkles, CheckCircle2 } from "lucide-react";

const statusColors: Record<string, { color: string; bg: string }> = {
  confirmed: { color: "#34d399", bg: "rgba(16,185,129,0.15)" },
  pending: { color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
  cancelled: { color: "#f87171", bg: "rgba(239,68,68,0.15)" },
  attended: { color: "#818cf8", bg: "rgba(99,102,241,0.15)" },
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "confirmed") return <CheckCircle size={16} />;
  if (status === "pending") return <Clock size={16} />;
  if (status === "attended") return <QrCode size={16} />;
  return <XCircle size={16} />;
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Downloading Pass
  const [activeRegModal, setActiveRegModal] = useState<any | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const token = await getToken();
        const res = await apiFetch<any[]>(API.myRegistrations, {}, token);
        if (res.success && res.data) setRegistrations(res.data);
      } catch {
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, [getToken]);

  const downloadTicketPass = (reg: any) => {
    if (!reg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
    gradient.addColorStop(0, "#0b0c16");
    gradient.addColorStop(1, "#18192d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 700);

    // Border
    ctx.strokeStyle = "rgba(99,102,241,0.6)";
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, 1140, 640);

    // Top Header Banner
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(30, 30, 1140, 90);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RKDF TECHNICAL CLUB — OFFICIAL EVENT ENTRY PASS", 600, 85);

    // Event Title
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(reg.event?.title || "CODEVED EVENT", 600, 180);

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 220);
    ctx.lineTo(1120, 220);
    ctx.stroke();

    // Details Column 1
    ctx.textAlign = "left";
    
    // Student Name
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("STUDENT NAME", 100, 270);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(reg.name || user?.fullName || "Student", 100, 310);

    // Course & Sem
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("COURSE & SEMESTER", 100, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${reg.course || "—"} (${reg.semester || "—"})`, 100, 410);

    // Email Address
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("EMAIL ADDRESS", 100, 470);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(reg.email || user?.primaryEmailAddress?.emailAddress || "—", 100, 510);

    // Details Column 2
    // Registration No
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("REGISTRATION NO", 650, 270);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 36px monospace";
    ctx.fillText(reg.registration_no || "RKDF/GEN/001", 650, 315);

    // Venue Location
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("VENUE LOCATION", 650, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(reg.event?.venue || "Campus Auditorium", 650, 410);

    // Entry Status Badge
    ctx.fillStyle = "rgba(52,211,153,0.15)";
    ctx.fillRect(650, 460, 300, 60);
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.strokeRect(650, 460, 300, 60);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓ ENTRY APPROVED", 800, 498);

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Present this Pass at the venue entrance. Issued by CodeVed Platform.", 600, 630);

    // Trigger File Download
    const link = document.createElement("a");
    link.download = `Event_Pass_${(reg.registration_no || "PASS").replace(/\//g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const totalCount = registrations.length;
  const approvedCount = registrations.filter(r => r.status === "confirmed" || !!r.registration_no).length;
  const pendingCount = registrations.filter(r => r.status === "pending" && !r.registration_no).length;

  return (
    <div style={{ minHeight: "100vh", background: "#05060d" }}>
      <Navbar />
      <div style={{ paddingTop: "5rem", padding: "5rem 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
        
        {/* Animated Header */}
        <div className="animate-fade-in" style={{ marginBottom: "2.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
            padding: "0.35rem 1rem", borderRadius: "999px", color: "#818cf8", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1rem"
          }}>
            <Sparkles size={14} /> STUDENT DASHBOARD
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#f1f5f9", marginBottom: "0.5rem" }}>
            My Event <span className="gradient-text">Registrations</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Track your approval status and download official event entry passes</p>
        </div>

        {/* ─── SUMMARY STATS CARDS ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div className="glass glass-interactive" style={{ borderRadius: "1.25rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Total Registrations</span>
              <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
                <Calendar size={18} />
              </div>
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "#f1f5f9" }}>{totalCount}</p>
          </div>

          <div className="glass glass-interactive" style={{ borderRadius: "1.25rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Approved Entry Passes</span>
              <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "#34d399" }}>{approvedCount}</p>
          </div>

          <div className="glass glass-interactive" style={{ borderRadius: "1.25rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Pending Approval</span>
              <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24" }}>
                <Clock size={18} />
              </div>
            </div>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: "#fbbf24" }}>{pendingCount}</p>
          </div>
        </div>

        {/* Registrations List / Skeleton Loader */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass" style={{ height: 110, borderRadius: "1rem", padding: "1.25rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <div className="skeleton" style={{ width: 70, height: 70, borderRadius: "0.75rem" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton" style={{ height: 20, width: "40%" }} />
                  <div className="skeleton" style={{ height: 14, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="glass" style={{
            textAlign: "center",
            padding: "4rem 2rem",
            borderRadius: "1.25rem",
          }}>
            <Calendar size={48} color="#6366f1" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h3 style={{ color: "#e2e8f0", fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Registrations Yet</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Browse published events and submit your entry registration form.</p>
            <a href="/events" style={{ textDecoration: "none" }}>
              <button className="btn-primary">Browse Events Catalog →</button>
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {registrations.map((reg) => {
              const statusStyle = statusColors[reg.status] ?? statusColors.pending;
              const isApproved = reg.status === "confirmed" || !!reg.registration_no;
              const isPending = reg.status === "pending" && !reg.registration_no;

              return (
                <div key={reg.id} className="glass glass-interactive" style={{ borderRadius: "1.25rem", padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Event Cover Image */}
                  <div style={{
                    width: 80, height: 80, borderRadius: "0.75rem", flexShrink: 0,
                    background: reg.event?.poster_url
                      ? `url(${reg.event.poster_url}) center/cover`
                      : "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))",
                  }} />

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.35rem" }}>{reg.event?.title}</h3>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ color: reg.event?.amount > 0 ? "#34d399" : "#818cf8", fontSize: "0.825rem", fontWeight: 700 }}>
                        {reg.event?.amount > 0 ? `₹${reg.event.amount}` : "FREE"}
                      </span>
                      {reg.event?.venue && (
                        <span style={{ color: "#64748b", fontSize: "0.825rem" }}>📍 {reg.event.venue}</span>
                      )}
                      {reg.event?.whatsapp_group_link && (
                        <a href={reg.event.whatsapp_group_link} target="_blank" rel="noreferrer" style={{ color: "#25D366", fontSize: "0.825rem", textDecoration: "none", fontWeight: 700 }}>
                          💬 Join WhatsApp Group
                        </a>
                      )}
                      <span style={{
                        color: statusStyle.color,
                        background: statusStyle.bg,
                        border: `1px solid ${statusStyle.color}40`,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}>
                        <StatusIcon status={reg.status} />
                        {isPending ? "Pending Admin Approval" : isApproved ? "Approved" : reg.status}
                      </span>
                    </div>
                  </div>

                  {/* Registration No & Download Pass Trigger */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Registration No</span>
                    {isApproved ? (
                      <>
                        <p style={{ color: "#34d399", fontSize: "1.05rem", fontFamily: "monospace", fontWeight: 900 }}>
                          {reg.registration_no || "RKDF/GEN/001"}
                        </p>
                        <button
                          onClick={() => setActiveRegModal(reg)}
                          className="btn-primary"
                          style={{ padding: "0.45rem 0.95rem", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <Download size={14} /> Download Pass
                        </button>
                      </>
                    ) : (
                      <p style={{ color: "#fbbf24", fontSize: "0.825rem", fontStyle: "italic" }}>
                        Waiting for Approval
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PASS DOWNLOAD MODAL FOR DASHBOARD ─────────────────────────────────── */}
      {activeRegModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 110,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{ width: "100%", maxWidth: 520, background: "linear-gradient(135deg, #121220, #0a0a14)", border: "2px solid rgba(99,102,241,0.4)", borderRadius: "1.25rem", padding: "2rem", color: "#e2e8f0", position: "relative" }}>
            <button onClick={() => setActiveRegModal(null)} style={{ position: "absolute", right: "1.25rem", top: "1.25rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>

            {/* Ticket Header */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.15)", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>RKDF Technical Club</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginTop: "0.25rem" }}>{activeRegModal.event?.title}</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>Official Event Entry Pass</p>
            </div>

            {/* Ticket Info Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name</span>
                <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{activeRegModal.name || user?.fullName || "Student"}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Course & Sem</span>
                <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{activeRegModal.course || "—"} ({activeRegModal.semester || "—"})</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Email Address</span>
                <p style={{ fontWeight: 600, color: "#cbd5e1", fontSize: "0.85rem", wordBreak: "break-all" }}>{activeRegModal.email || user?.primaryEmailAddress?.emailAddress || "—"}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Registration No</span>
                <p style={{ fontWeight: 900, color: "#34d399", fontFamily: "monospace", fontSize: "1.05rem" }}>{activeRegModal.registration_no || "RKDF/GEN/001"}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={() => downloadTicketPass(activeRegModal)}
                className="btn-primary"
                style={{ justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem" }}
              >
                <Download size={16} /> Download Pass Image
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#e2e8f0",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                <Printer size={16} /> Print Pass (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
