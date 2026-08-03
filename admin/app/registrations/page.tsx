"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { adminApi, ADMIN_API } from "@/lib/api";
import { Download, CheckCircle2, Search, ExternalLink, Image as ImageIcon, XCircle, Trash2, Edit, Check, Clock, X, Printer, Ticket } from "lucide-react";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [previewProof, setPreviewProof] = useState<string | null>(null);

  // Admin Pass Download Modal State
  const [activePassModal, setActivePassModal] = useState<any | null>(null);

  // Edit Registration Modal State
  const [editReg, setEditReg] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    course: "",
    semester: "",
    email: "",
    phone: "",
    transaction_id: "",
    registration_no: "",
    status: "pending",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [repairingNumbers, setRepairingNumbers] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (selectedEvent) params.set("event_id", selectedEvent);
    if (selectedStatus) params.set("status", selectedStatus);
    const res = await adminApi<any>(`${ADMIN_API.registrations}?${params}`);
    const list = res.success ? res.data?.registrations ?? [] : [];
    if (res.success) setRegistrations(list);
    setLoading(false);
    return list;
  };

  const fetchEvents = async () => {
    const res = await adminApi<any>(ADMIN_API.events + "?limit=100");
    if (res.success) setEvents(res.data?.events ?? []);
  };

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { fetchRegistrations(); }, [selectedEvent, selectedStatus]);

  // Admin Approve (Generates Registration No e.g. RKDF/BTCSE/001)
  const handleApprove = async (id: string) => {
    const res = await adminApi(`/registrations/${id}/approve`, { method: "PATCH" });
    if (res.success) fetchRegistrations();
    else alert(res.error ?? "Failed to approve registration.");
  };

  // Admin Reject (Marks cancelled)
  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this registration?")) return;
    const res = await adminApi(`/registrations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.success) fetchRegistrations();
    else alert(res.error ?? "Failed to reject registration.");
  };

  // Admin Delete Registration
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration entry?")) return;
    const res = await adminApi(`/registrations/${id}`, { method: "DELETE" });
    if (res.success) fetchRegistrations();
    else alert(res.error ?? "Failed to delete registration.");
  };

  // Open Edit Modal
  const handleOpenEdit = (reg: any) => {
    setEditReg(reg);
    setEditForm({
      name: reg.name || reg.user?.name || "",
      course: reg.course || "",
      semester: reg.semester || "",
      email: reg.email || reg.user?.email || "",
      phone: reg.phone || reg.user?.phone || "",
      transaction_id: reg.transaction_id || "",
      registration_no: reg.registration_no || "",
      status: reg.status || "pending",
    });
  };

  // Save Edit Registration
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReg) return;

    setSubmittingEdit(true);
    const res = await adminApi(`/registrations/${editReg.id}`, {
      method: "PATCH",
      body: JSON.stringify(editForm),
    });

    if (res.success) {
      setEditReg(null);
      fetchRegistrations();
    } else {
      alert(res.error ?? "Failed to update registration.");
    }
    setSubmittingEdit(false);
  };

  const handleExport = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}${ADMIN_API.exportRegistrations}${selectedEvent ? "?event_id=" + selectedEvent : ""}`;
    window.open(url, "_blank");
  };

  const handleRepairRegistrationNumbers = async () => {
    if (!confirm("Reassign all approved registration numbers using BTCSE, DCSE, and BCA formats? This fixes duplicates.")) return;

    setRepairingNumbers(true);
    const res = await adminApi<{ updated: number; events: number }>("/registrations/repair-numbers", { method: "POST" });
    setRepairingNumbers(false);

    if (res.success) {
      alert(`Updated ${res.data?.updated ?? 0} registration number(s) across ${res.data?.events ?? 0} event(s).`);
      fetchRegistrations();
    } else {
      alert(res.error ?? "Failed to repair registration numbers.");
    }
  };

  const downloadTicketPass = async (reg: any) => {
    if (!reg) return;

    let latest = reg;
    const freshList = await fetchRegistrations();
    const fresh = freshList.find((r: any) => r.id === reg.id);
    if (fresh) {
      latest = fresh;
      if (activePassModal?.id === fresh.id) setActivePassModal(fresh);
    }

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
    ctx.fillText(latest.event?.title || "CODEVED EVENT", 600, 180);

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
    ctx.fillText(latest.name || latest.user?.name || "Student", 100, 310);

    // Course & Sem
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("COURSE & SEMESTER", 100, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${latest.course || "—"} (${latest.semester || "—"})`, 100, 410);

    // Email Address
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("EMAIL ADDRESS", 100, 470);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(latest.email || latest.user?.email || "—", 100, 510);

    // Details Column 2
    // Registration No
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("REGISTRATION NO", 650, 270);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 36px monospace";
    ctx.fillText(latest.registration_no || "—", 650, 315);

    // Venue Location
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("VENUE LOCATION", 650, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(latest.event?.venue || "Campus Auditorium", 650, 410);

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
    ctx.fillText("Present this Pass at the venue entrance. Verified by Admin.", 600, 630);

    // Trigger File Download
    const link = document.createElement("a");
    link.download = `Student_Pass_${(latest.registration_no || "PASS").replace(/\//g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const filtered = registrations.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
    r.event?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    if (status === "confirmed") return "badge-green";
    if (status === "attended") return "badge-purple";
    if (status === "pending") return "badge-yellow";
    return "badge-red";
  };

  return (
    <div style={{ display: "flex", background: "#080810", minHeight: "100vh" }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0" }}>Registrations Management</h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{filtered.length} student entries • Approve, edit, delete or download passes</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn btn-outline" onClick={handleRepairRegistrationNumbers} disabled={repairingNumbers}>
              <Check size={16} /> {repairingNumbers ? "Repairing..." : "Fix Registration Nos"}
            </button>
            <button className="btn btn-outline" onClick={handleExport}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={14} color="#6366f1" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
            <input className="input" placeholder="Search name, email, Registration No, Txn ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "2.5rem" }} />
          </div>

          <select className="input" style={{ maxWidth: 220 }} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>

          <select className="input" style={{ maxWidth: 180 }} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="confirmed">Approved</option>
            <option value="cancelled">Rejected</option>
          </select>
        </div>

        <div className="card">
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "3rem" }}>Loading registrations...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student Details</th>
                  <th>Course & Sem</th>
                  <th>Registration No</th>
                  <th>Event</th>
                  <th>UTR / Txn ID</th>
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => {
                  const studentName = reg.name || reg.user?.name || "Student";
                  const studentEmail = reg.email || reg.user?.email || "—";
                  const studentPhone = reg.phone || reg.user?.phone || "—";

                  return (
                    <tr key={reg.id}>
                      <td>
                        <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{studentName}</div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{studentEmail} • {studentPhone}</div>
                      </td>
                      <td>
                        <div style={{ color: "#cbd5e1", fontWeight: 500, fontSize: "0.85rem" }}>{reg.course || "—"}</div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Sem: {reg.semester || "—"}</div>
                      </td>
                      <td>
                        {reg.registration_no ? (
                          <span style={{ color: "#34d399", fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem" }}>
                            {reg.registration_no}
                          </span>
                        ) : (
                          <span style={{ color: "#fbbf24", fontSize: "0.75rem", fontStyle: "italic" }}>
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td style={{ color: "#818cf8", fontWeight: 600, fontSize: "0.85rem" }}>{reg.event?.title}</td>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "#cbd5e1" }}>
                        {reg.transaction_id || "—"}
                      </td>
                      <td>
                        {reg.payment_proof_url ? (
                          <button
                            onClick={() => setPreviewProof(reg.payment_proof_url)}
                            className="btn btn-outline"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          >
                            <ImageIcon size={13} color="#818cf8" /> View
                          </button>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(reg.status)}`}>
                          {reg.status === "pending" ? "Waiting Approval" : reg.status === "confirmed" ? "Approved" : reg.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          {/* Pass Download Button */}
                          <button
                            className="btn btn-outline"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "#818cf8", borderColor: "rgba(129,140,248,0.3)" }}
                            onClick={() => setActivePassModal(reg)}
                            title="Download Student Entry Pass"
                          >
                            <Ticket size={13} /> Pass
                          </button>

                          {/* Approve Button */}
                          {reg.status !== "confirmed" && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "#10b981" }}
                              onClick={() => handleApprove(reg.id)}
                              title="Approve & Generate Registration No"
                            >
                              <Check size={13} /> Approve
                            </button>
                          )}

                          {/* Reject Button */}
                          {reg.status === "pending" && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                              onClick={() => handleReject(reg.id)}
                              title="Reject Registration"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            className="btn btn-outline"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            onClick={() => handleOpenEdit(reg)}
                            title="Edit Student Info"
                          >
                            <Edit size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            className="btn btn-outline"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                            onClick={() => handleDelete(reg.id)}
                            title="Delete Registration Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No student registrations found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ADMIN PASS DOWNLOAD MODAL */}
        {activePassModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 110,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
          }}>
            <div style={{ width: "100%", maxWidth: 520, background: "linear-gradient(135deg, #121220, #0a0a14)", border: "2px solid rgba(99,102,241,0.4)", borderRadius: "1.25rem", padding: "2rem", color: "#e2e8f0", position: "relative" }}>
              <button onClick={() => setActivePassModal(null)} style={{ position: "absolute", right: "1.25rem", top: "1.25rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>

              {/* Ticket Header */}
              <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.15)", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>RKDF Technical Club</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginTop: "0.25rem" }}>{activePassModal.event?.title}</h2>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>Official Student Entry Pass</p>
              </div>

              {/* Ticket Info Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name</span>
                  <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{activePassModal.name || activePassModal.user?.name || "Student"}</p>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Course & Sem</span>
                  <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{activePassModal.course || "—"} ({activePassModal.semester || "—"})</p>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Email Address</span>
                  <p style={{ fontWeight: 600, color: "#cbd5e1", fontSize: "0.85rem", wordBreak: "break-all" }}>{activePassModal.email || activePassModal.user?.email || "—"}</p>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Registration No</span>
                  <p style={{ fontWeight: 900, color: "#34d399", fontFamily: "monospace", fontSize: "1.05rem" }}>{activePassModal.registration_no || "RKDF/GEN/001"}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={() => downloadTicketPass(activePassModal)}
                  className="btn btn-primary"
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

        {/* Edit Registration Modal */}
        {editReg && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
          }}>
            <div className="card" style={{ maxWidth: 540, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ color: "#e2e8f0" }}>Edit Student Registration</h3>
                <button onClick={() => setEditReg(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Student Full Name</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Course / Branch</label>
                    <input className="input" value={editForm.course} onChange={e => setEditForm(f => ({ ...f, course: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Semester</label>
                    <input className="input" value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Email Address</label>
                    <input className="input" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Registration No</label>
                    <input className="input" placeholder="e.g. RKDF/BTCSE/001" value={editForm.registration_no} onChange={e => setEditForm(f => ({ ...f, registration_no: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="pending">Pending Approval</option>
                      <option value="confirmed">Approved (Confirmed)</option>
                      <option value="cancelled">Rejected (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">UTR / Transaction ID</label>
                  <input className="input" value={editForm.transaction_id} onChange={e => setEditForm(f => ({ ...f, transaction_id: e.target.value }))} />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditReg(null)}>Cancel</button>
                  <button type="submit" disabled={submittingEdit} className="btn btn-primary">
                    {submittingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Proof Preview Modal */}
        {previewProof && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 110,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
          }}>
            <div className="card" style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ color: "#e2e8f0" }}>Payment Proof Screenshot</h3>
                <button onClick={() => setPreviewProof(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <img src={previewProof} alt="Payment Proof" style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "0.5rem" }} />
              <div style={{ marginTop: "1rem" }}>
                <a href={previewProof} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  Open Full Resolution <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
