"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { adminApi, ADMIN_API } from "@/lib/api";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Image as ImageIcon, QrCode, Upload, CheckCircle2, Loader2 } from "lucide-react";

const emptyForm = {
  title: "",
  description: "",
  rules: "",
  venue: "",
  amount: 0,
  membership: "Open to All",
  whatsapp_group_link: "",
  poster_url: "",
  payment_qr_url: "",
  max_participants: "",
  registration_deadline: "",
  coordinator_phone: "",
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    const res = await adminApi<any>(ADMIN_API.events + "?limit=50&status=all");
    if (res.success) setEvents(res.data?.events ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: "posters" | "payment_qrs") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (folder === "posters") setUploadingPoster(true);
    else setUploadingQr(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await adminApi<{ url: string }>(ADMIN_API.upload, {
          method: "POST",
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            folder,
          }),
        });

        if (res.success && res.data?.url) {
          if (folder === "posters") setForm(p => ({ ...p, poster_url: res.data!.url }));
          else setForm(p => ({ ...p, payment_qr_url: res.data!.url }));
        } else {
          alert(res.error ?? "Failed to upload image to ImageKit.");
        }
        if (folder === "posters") setUploadingPoster(false);
        else setUploadingQr(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to read image file.");
      if (folder === "posters") setUploadingPoster(false);
      else setUploadingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body: any = { ...form };
      body.amount = parseFloat(body.amount as any) || 0;
      if (body.max_participants) body.max_participants = parseInt(body.max_participants, 10);
      else delete body.max_participants;
      if (body.registration_deadline) {
        body.registration_deadline = new Date(body.registration_deadline).toISOString();
      } else {
        delete body.registration_deadline;
      }
      if (!body.whatsapp_group_link) delete body.whatsapp_group_link;
      if (!body.poster_url) delete body.poster_url;
      if (!body.payment_qr_url) delete body.payment_qr_url;

      const res = editId
        ? await adminApi(`${ADMIN_API.events}/${editId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await adminApi(ADMIN_API.events, { method: "POST", body: JSON.stringify(body) });

      if (res.success) {
        setShowForm(false);
        setForm({ ...emptyForm });
        setEditId(null);
        fetchEvents();
      } else {
        setError(res.error ?? "Failed to save event.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (event: any) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await adminApi(`${ADMIN_API.events}/${event.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    fetchEvents();
  };

  const handleEdit = (event: any) => {
    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      rules: event.rules ?? "",
      venue: event.venue ?? "",
      amount: event.amount ?? 0,
      membership: event.membership ?? "Open to All",
      whatsapp_group_link: event.whatsapp_group_link ?? "",
      poster_url: event.poster_url ?? "",
      payment_qr_url: event.payment_qr_url ?? "",
      max_participants: event.max_participants?.toString() ?? "",
      registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : "",
      coordinator_phone: event.coordinator_phone ?? "",
    });
    setEditId(event.id);
    setShowForm(true);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { published: "badge-green", draft: "badge-yellow", cancelled: "badge-red", completed: "badge-purple" };
    return map[status] ?? "badge-yellow";
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? All associated registrations will also be deleted.")) return;
    const res = await adminApi(`${ADMIN_API.events}/${id}`, { method: "DELETE" });
    if (res.success) fetchEvents();
    else alert(res.error ?? "Failed to delete event.");
  };

  return (
    <div style={{ display: "flex", background: "#080810", minHeight: "100vh" }}>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0" }}>Events Management</h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Create, publish, edit, or delete events</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>
            <Plus size={16} /> Create Event
          </button>
        </div>

        {/* Create / Edit Form Modal */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
          }}>
            <div className="card" style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0" }}>{editId ? "Edit Event" : "Create New Event"}</h2>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={18} /></button>
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Title */}
                <div>
                  <label className="label">Event Title *</label>
                  <input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. HackOverflow 2026" />
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description *</label>
                  <textarea className="input" required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed event overview..." style={{ resize: "vertical" }} />
                </div>

                {/* Amount Charges & Membership */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Registration Fee (₹)</label>
                    <input className="input" type="number" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} placeholder="0 for Free" />
                  </div>
                  <div>
                    <label className="label">Membership Requirement</label>
                    <select className="input" value={form.membership} onChange={e => setForm(p => ({ ...p, membership: e.target.value }))}>
                      <option value="Open to All">Open to All</option>
                      <option value="Club Members Only">Club Members Only</option>
                      <option value="RKDF Students Only">RKDF Students Only</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Group Link */}
                <div>
                  <label className="label">WhatsApp Group Link</label>
                  <input className="input" type="url" value={form.whatsapp_group_link} onChange={e => setForm(p => ({ ...p, whatsapp_group_link: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
                </div>

                {/* Upload Poster Image */}
                <div style={{ background: "rgba(99,102,241,0.05)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: "0.5rem", padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <label className="label" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <ImageIcon size={16} color="#818cf8" /> Upload Event Poster Image
                    </label>
                    {uploadingPoster && <span style={{ color: "#818cf8", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Loader2 size={12} className="animate-spin" /> Uploading...</span>}
                    {form.poster_url && !uploadingPoster && <span style={{ color: "#34d399", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><CheckCircle2 size={12} /> Uploaded</span>}
                  </div>
                  <input className="input" type="file" accept="image/*" onChange={e => handleFileUpload(e, "posters")} style={{ background: "transparent", fontSize: "0.85rem" }} />
                  {form.poster_url && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img src={form.poster_url} alt="Poster preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "0.25rem" }} />
                      <span style={{ fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all" }}>{form.poster_url}</span>
                    </div>
                  )}
                </div>

                {/* Upload Payment QR Image */}
                <div style={{ background: "rgba(52,211,153,0.05)", border: "1px dashed rgba(52,211,153,0.3)", borderRadius: "0.5rem", padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <label className="label" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <QrCode size={16} color="#34d399" /> Upload Payment QR Image
                    </label>
                    {uploadingQr && <span style={{ color: "#34d399", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Loader2 size={12} className="animate-spin" /> Uploading...</span>}
                    {form.payment_qr_url && !uploadingQr && <span style={{ color: "#34d399", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><CheckCircle2 size={12} /> Uploaded</span>}
                  </div>
                  <input className="input" type="file" accept="image/*" onChange={e => handleFileUpload(e, "payment_qrs")} style={{ background: "transparent", fontSize: "0.85rem" }} />
                  {form.payment_qr_url && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img src={form.payment_qr_url} alt="QR preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "0.25rem" }} />
                      <span style={{ fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all" }}>{form.payment_qr_url}</span>
                    </div>
                  )}
                </div>

                {/* Venue & Max Participants */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="label">Venue Location</label>
                    <input className="input" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. Main Auditorium" />
                  </div>
                  <div>
                    <label className="label">Max Participants</label>
                    <input className="input" type="number" min="1" value={form.max_participants} onChange={e => setForm(p => ({ ...p, max_participants: e.target.value }))} placeholder="Unlimited" />
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <label className="label">Rules & Instructions</label>
                  <textarea className="input" value={form.rules} onChange={e => setForm(p => ({ ...p, rules: e.target.value }))} rows={2} placeholder="Event rules, prerequisites..." style={{ resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || uploadingPoster || uploadingQr}>
                    {submitting ? "Saving..." : editId ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events Table */}
        <div className="card">
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "3rem" }}>Loading events...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Membership</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {event.poster_url && (
                          <img src={event.poster_url} alt="" style={{ width: 36, height: 36, borderRadius: "0.4rem", objectFit: "cover" }} />
                        )}
                        <div>
                          <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{event.title}</div>
                          {event.venue && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📍 {event.venue}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: event.amount > 0 ? "#34d399" : "#818cf8" }}>
                      {event.amount > 0 ? `₹${event.amount}` : "Free"}
                    </td>
                    <td>
                      <span className="badge badge-purple">{event.membership ?? "Open to All"}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(event.status)}`}>{event.status}</span>
                    </td>
                    <td style={{ color: "#e2e8f0" }}>{event._count?.registrations ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "0.375rem 0.625rem" }}
                          onClick={() => handlePublish(event)}
                          title={event.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {event.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="btn btn-outline" style={{ padding: "0.375rem 0.625rem" }} onClick={() => handleEdit(event)} title="Edit Event">
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "0.375rem 0.625rem", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No events created yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
