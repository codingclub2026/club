"use client";

import { useEffect, useState, use } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { apiFetch, API } from "@/lib/api";
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, QrCode, MessageSquare, DollarSign, ShieldCheck, AlertCircle, X, Upload, Loader2, FileCheck, Clock, Download, Printer } from "lucide-react";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationRecord, setRegistrationRecord] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Registration modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  const [regForm, setRegForm] = useState({
    name: "",
    course: "",
    semester: "",
    email: "",
    phone: "",
    payment_proof_url: "",
    transaction_id: "",
  });

  const [uploadingProof, setUploadingProof] = useState(false);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(API.eventById(id));
      if (res.success && res.data) {
        setEvent(res.data);
      }

      // Check if student is already registered
      if (isSignedIn) {
        const token = await getToken();
        const regRes = await apiFetch<any[]>(API.myRegistrations, {}, token);
        if (regRes.success && regRes.data) {
          const existing = regRes.data.find((r) => r.event_id === id || r.event?.id === id);
          if (existing) {
            setRegistrationRecord(existing);
          }
        }
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, isSignedIn, getToken]);

  const openRegistrationModal = () => {
    if (!isSignedIn) {
      window.location.href = `/sign-in?redirect_url=/events/${id}`;
      return;
    }

    setRegForm({
      name: user?.fullName || user?.firstName || "",
      course: "",
      semester: "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      phone: user?.primaryPhoneNumber?.phoneNumber || "",
      payment_proof_url: "",
      transaction_id: "",
    });
    setShowRegModal(true);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const token = await getToken();
        const res = await apiFetch<{ url: string }>("/registrations/upload-proof", {
          method: "POST",
          body: JSON.stringify({ file: base64, fileName: file.name }),
        }, token);

        if (res.success && res.data?.url) {
          setRegForm(p => ({ ...p, payment_proof_url: res.data!.url }));
        } else {
          alert(res.error ?? "Failed to upload payment proof.");
        }
        setUploadingProof(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to read image file.");
      setUploadingProof(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await apiFetch<any>(API.register, {
        method: "POST",
        body: JSON.stringify({
          event_id: event.id,
          name: regForm.name,
          course: regForm.course,
          semester: regForm.semester,
          email: regForm.email,
          phone: regForm.phone,
          payment_proof_url: regForm.payment_proof_url,
          transaction_id: regForm.transaction_id,
        }),
      }, token);

      if (res.success && res.data) {
        setRegistrationRecord(res.data);
        setShowRegModal(false);
        setMessage({ type: "success", text: "Registration submitted! Waiting for Admin Approval." });
      } else {
        setMessage({ type: "error", text: res.error ?? "Registration failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during registration." });
    } finally {
      setRegistering(false);
    }
  };

  const downloadTicketPass = () => {
    if (!registrationRecord) return;
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
    ctx.fillText(event?.title || "CODEVED EVENT", 600, 180);

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
    ctx.fillText(registrationRecord.name || user?.fullName || "Student", 100, 310);

    // Course & Sem
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("COURSE & SEMESTER", 100, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${registrationRecord.course || "—"} (${registrationRecord.semester || "—"})`, 100, 410);

    // Email Address
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("EMAIL ADDRESS", 100, 470);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(registrationRecord.email || user?.primaryEmailAddress?.emailAddress || "—", 100, 510);

    // Details Column 2
    // Registration No
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("REGISTRATION NO", 650, 270);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 36px monospace";
    ctx.fillText(registrationRecord.registration_no || "RKDF/GEN/001", 650, 315);

    // Venue Location
    ctx.fillStyle = "#64748b";
    ctx.font = "18px sans-serif";
    ctx.fillText("VENUE LOCATION", 650, 370);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(event?.venue || "Campus Auditorium", 650, 410);

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
    link.download = `Event_Pass_${(registrationRecord.registration_no || "PASS").replace(/\//g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
        <Navbar />
        <div style={{ paddingTop: "7rem", padding: "2rem", maxWidth: 900, margin: "0 auto", textAlign: "center", color: "#64748b" }}>
          Loading event details...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
        <Navbar />
        <div style={{ paddingTop: "7rem", padding: "4rem 2rem", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ color: "#e2e8f0", fontSize: "1.5rem", marginBottom: "1rem" }}>Event Not Found</h2>
          <p style={{ color: "#64748b", marginBottom: "2rem" }}>The event you are looking for may have been unpublished or removed.</p>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <button className="btn-primary">← Back to All Events</button>
          </Link>
        </div>
      </div>
    );
  }

  const isPending = registrationRecord && (registrationRecord.status === "pending" || !registrationRecord.registration_no);
  const isApproved = registrationRecord && registrationRecord.status === "confirmed" && registrationRecord.registration_no;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <Navbar />

      <div style={{ paddingTop: "5rem", padding: "3rem 2rem 5rem", maxWidth: 960, margin: "0 auto" }}>
        {/* Back Link */}
        <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#818cf8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, marginBottom: "2rem" }}>
          <ArrowLeft size={16} /> Back to Events
        </Link>

        {/* Event Main Banner Card */}
        <div className="glass" style={{ borderRadius: "1.25rem", overflow: "hidden", marginBottom: "2rem" }}>
          {event.poster_url && (
            <div style={{ width: "100%", maxHeight: "360px", overflow: "hidden" }}>
              <img src={event.poster_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ padding: "2rem" }}>
            {/* Title & Badges */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#e2e8f0", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                  {event.title}
                </h1>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{
                    background: event.amount > 0 ? "rgba(52,211,153,0.15)" : "rgba(99,102,241,0.15)",
                    color: event.amount > 0 ? "#34d399" : "#818cf8",
                    border: `1px solid ${event.amount > 0 ? "#34d39940" : "#818cf840"}`,
                    padding: "0.25rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}>
                    {event.amount > 0 ? `Fee: ₹${event.amount}` : "Free Registration"}
                  </span>
                  <span style={{
                    background: "rgba(167,139,250,0.15)",
                    color: "#a78bfa",
                    border: "1px solid rgba(167,139,250,0.3)",
                    padding: "0.25rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}>
                    {event.membership ?? "Open to All"}
                  </span>
                </div>
              </div>

              {/* Registration CTA / Status */}
              <div>
                {isPending && (
                  <div style={{
                    background: "rgba(245,158,11,0.15)",
                    border: "1px solid rgba(245,158,11,0.4)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.75rem",
                    color: "#fbbf24",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}>
                    <Clock size={18} /> Pending Admin Approval
                  </div>
                )}

                {isApproved && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    <div style={{
                      background: "rgba(52,211,153,0.15)",
                      border: "1px solid rgba(52,211,153,0.3)",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      color: "#34d399",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.85rem",
                    }}>
                      <CheckCircle2 size={16} /> Approved
                    </div>
                    <button
                      onClick={() => setShowPassModal(true)}
                      className="btn-primary"
                      style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <Download size={16} /> Download Event Pass
                    </button>
                  </div>
                )}

                {!registrationRecord && (
                  <button
                    onClick={openRegistrationModal}
                    className="btn-primary"
                    style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}
                  >
                    Register Now
                  </button>
                )}
              </div>
            </div>

            {/* Notification alert */}
            {message && (
              <div style={{
                marginTop: "1rem",
                padding: "0.85rem 1.25rem",
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: message.type === "success" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                color: message.type === "success" ? "#34d399" : "#f87171",
                border: `1px solid ${message.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
              }}>
                {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Grid Info Details */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Description & Rules */}
          <div className="glass" style={{ borderRadius: "1rem", padding: "1.75rem" }}>
            <h2 style={{ color: "#e2e8f0", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Overview</h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: "0.95rem", whiteSpace: "pre-line" }}>
              {event.description}
            </p>

            {event.rules && (
              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ color: "#818cf8", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Rules & Guidelines</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {event.rules}
                </p>
              </div>
            )}
          </div>

          {/* Quick Action Links: Payment QR & WhatsApp */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Payment QR section */}
            {event.payment_qr_url && (
              <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#34d399", fontWeight: 700, marginBottom: "0.75rem" }}>
                  <QrCode size={20} /> Payment QR Code
                </div>
                <img src={event.payment_qr_url} alt="Payment QR" style={{ width: 180, height: 180, objectFit: "contain", borderRadius: "0.75rem", background: "white", padding: "0.5rem", margin: "0 auto 1rem", border: "2px solid #34d39940" }} />
                <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Scan QR code to pay registration fee (₹{event.amount})</p>
              </div>
            )}

            {/* WhatsApp Group Link */}
            {event.whatsapp_group_link && (
              <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#25D366", fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.05rem" }}>
                  <MessageSquare size={20} /> Official WhatsApp Group
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Join the official WhatsApp group for real-time announcements & updates.
                </p>
                <a href={event.whatsapp_group_link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}>
                    Join WhatsApp Group →
                  </button>
                </a>
              </div>
            )}

            {/* Registration No (Only when approved by Admin) */}
            {isApproved && (
              <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", textAlign: "center", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <p style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Registration No</p>
                <p style={{ color: "#34d399", fontSize: "1.35rem", fontFamily: "monospace", fontWeight: 900 }}>
                  {registrationRecord.registration_no}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── STUDENT REGISTRATION FORM MODAL ────────────────────────────────────── */}
      {showRegModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div className="glass" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", borderRadius: "1.25rem", padding: "2rem", border: "1px solid rgba(99,102,241,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: "#e2e8f0", fontSize: "1.35rem", fontWeight: 800 }}>Student Registration</h2>
              <button onClick={() => setShowRegModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Name */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Full Name *</label>
                <input required className="input-field" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter your full name" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
              </div>

              {/* Course & Semester */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Course / Branch *</label>
                  <input required className="input-field" value={regForm.course} onChange={e => setRegForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. CSE, BCA" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Semester *</label>
                  <input required className="input-field" value={regForm.semester} onChange={e => setRegForm(p => ({ ...p, semester: e.target.value }))} placeholder="e.g. 5th" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Email Address *</label>
                  <input required type="email" className="input-field" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Phone Number *</label>
                  <input required type="tel" className="input-field" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
                </div>
              </div>

              {/* UTR / Transaction ID */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>UTR / Transaction ID {event.amount > 0 ? "*" : "(Optional)"}</label>
                <input required={event.amount > 0} className="input-field" value={regForm.transaction_id} onChange={e => setRegForm(p => ({ ...p, transaction_id: e.target.value }))} placeholder="e.g. 123456789012" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
              </div>

              {/* Payment Proof Image Upload */}
              <div style={{ background: "rgba(99,102,241,0.05)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Upload size={16} color="#818cf8" /> Upload Payment Proof Screenshot {event.amount > 0 ? "*" : "(Optional)"}
                  </label>
                  {uploadingProof && <span style={{ color: "#818cf8", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}><Loader2 size={14} className="animate-spin" /> Uploading...</span>}
                  {regForm.payment_proof_url && !uploadingProof && <span style={{ color: "#34d399", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><FileCheck size={14} /> Attached</span>}
                </div>
                <input required={event.amount > 0} type="file" accept="image/*" onChange={handleProofUpload} style={{ width: "100%", color: "#94a3b8", fontSize: "0.85rem" }} />
                {regForm.payment_proof_url && (
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <img src={regForm.payment_proof_url} alt="Proof" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "0.4rem", border: "1px solid #818cf840" }} />
                    <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Payment proof screenshot attached</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowRegModal(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "0.75rem 1.25rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={registering || uploadingProof} className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                  {registering ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DOWNLOADABLE TICKET PASS MODAL ─────────────────────────────────────── */}
      {showPassModal && registrationRecord && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 110,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{ width: "100%", maxWidth: 520, background: "linear-gradient(135deg, #121220, #0a0a14)", border: "2px solid rgba(99,102,241,0.4)", borderRadius: "1.25rem", padding: "2rem", color: "#e2e8f0", position: "relative" }}>
            <button onClick={() => setShowPassModal(false)} style={{ position: "absolute", right: "1.25rem", top: "1.25rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>

            {/* Ticket Header */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.15)", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase" }}>RKDF Technical Club</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginTop: "0.25rem" }}>{event.title}</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>Official Event Entry Pass</p>
            </div>

            {/* Ticket Info Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name</span>
                <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{registrationRecord.name || user?.fullName || "Student"}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Course & Sem</span>
                <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{registrationRecord.course || "—"} ({registrationRecord.semester || "—"})</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Email Address</span>
                <p style={{ fontWeight: 600, color: "#cbd5e1", fontSize: "0.85rem", wordBreak: "break-all" }}>{registrationRecord.email || user?.primaryEmailAddress?.emailAddress || "—"}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Registration No</span>
                <p style={{ fontWeight: 900, color: "#34d399", fontFamily: "monospace", fontSize: "1.05rem" }}>{registrationRecord.registration_no}</p>
              </div>
            </div>

            {/* Download / Print Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={downloadTicketPass}
                className="btn-primary"
                style={{ justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem" }}
              >
                <Download size={16} /> Download PDF/Image
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
                <Printer size={16} /> Print Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
