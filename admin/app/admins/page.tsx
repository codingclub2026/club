"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { adminApi, ADMIN_API } from "@/lib/api";
import { Plus, UserX, Shield, X, Edit, Trash2, UserCheck, Lock, User } from "lucide-react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  // Modals
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMyProfileForm, setShowMyProfileForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState<any | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({ admin_id: "", password: "", display_name: "", role: "event_manager" });
  const [myProfileForm, setMyProfileForm] = useState({ admin_id: "", display_name: "", password: "" });
  const [editOtherForm, setEditOtherForm] = useState({ admin_id: "", display_name: "", role: "event_manager", password: "" });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [adminsRes, meRes] = await Promise.all([
      adminApi<any[]>(ADMIN_API.adminsList),
      adminApi<any>(ADMIN_API.me),
    ]);
    if (adminsRes.success) setAdmins(adminsRes.data ?? []);
    if (meRes.success && meRes.data) {
      setMe(meRes.data);
      setMyProfileForm({
        admin_id: meRes.data.admin_id || "",
        display_name: meRes.data.display_name || "",
        password: "",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Super Admin Create Admin ────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    const res = await adminApi(ADMIN_API.createAdmin, { method: "POST", body: JSON.stringify(createForm) });
    if (res.success) {
      setShowCreateForm(false);
      setCreateForm({ admin_id: "", password: "", display_name: "", role: "event_manager" });
      fetchData();
    } else {
      setError(res.error ?? "Failed to create admin.");
    }
    setSubmitting(false);
  };

  // ─── Admin Edit Own Details ──────────────────────────────────────────────────
  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    const body: any = {
      display_name: myProfileForm.display_name,
      admin_id: myProfileForm.admin_id,
    };
    if (myProfileForm.password) body.password = myProfileForm.password;

    const res = await adminApi("/admin/me", { method: "PATCH", body: JSON.stringify(body) });
    if (res.success) {
      setShowMyProfileForm(false);
      alert("Your profile details updated successfully!");
      fetchData();
    } else {
      setError(res.error ?? "Failed to update profile.");
    }
    setSubmitting(false);
  };

  // ─── Super Admin Edit Other Admin ────────────────────────────────────────────
  const handleOpenEditOther = (admin: any) => {
    setEditAdmin(admin);
    setEditOtherForm({
      admin_id: admin.admin_id || "",
      display_name: admin.display_name || "",
      role: admin.role || "event_manager",
      password: "",
    });
  };

  const handleUpdateOtherAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;
    setSubmitting(true); setError("");

    const body: any = {
      display_name: editOtherForm.display_name,
      admin_id: editOtherForm.admin_id,
      role: editOtherForm.role,
    };
    if (editOtherForm.password) body.password = editOtherForm.password;

    const res = await adminApi(`/admin/admins/${editAdmin.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (res.success) {
      setEditAdmin(null);
      fetchData();
    } else {
      setError(res.error ?? "Failed to update admin.");
    }
    setSubmitting(false);
  };

  // ─── Super Admin Delete Other Admin ─────────────────────────────────────────
  const handleDeleteAdmin = async (id: string, name: string) => {
    if (id === me?.id) {
      alert("You cannot delete your own Super Admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently DELETE admin account '${name}'?`)) return;

    const res = await adminApi(`/admin/admins/${id}`, { method: "DELETE" });
    if (res.success) {
      fetchData();
    } else {
      alert(res.error ?? "Failed to delete admin.");
    }
  };

  const roleColor = (role: string) => {
    if (role === "super_admin") return "badge-red";
    if (role === "event_manager") return "badge-yellow";
    return "badge-green";
  };

  const isSuperAdmin = me?.role === "super_admin";

  return (
    <div style={{ display: "flex", background: "#080810", minHeight: "100vh" }}>
      <Sidebar adminName={me?.display_name} role={me?.role} />
      <main className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0" }}>Admin Accounts Management</h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Logged in as: <strong style={{ color: "#818cf8" }}>{me?.display_name}</strong> ({me?.role})</p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-outline" onClick={() => setShowMyProfileForm(true)}>
              <User size={16} /> Edit My Details
            </button>
            {isSuperAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                <Plus size={16} /> Create Admin
              </button>
            )}
          </div>
        </div>

        {/* ─── CREATE ADMIN MODAL (Super Admin) ─────────────────────────────────── */}
        {showCreateForm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div className="card" style={{ width: "100%", maxWidth: 460 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h2 style={{ color: "#e2e8f0", fontWeight: 700 }}>Create New Admin</h2>
                <button onClick={() => setShowCreateForm(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Admin ID (Username) *</label>
                  <input className="input" required value={createForm.admin_id} onChange={e => setCreateForm(p => ({ ...p, admin_id: e.target.value }))} placeholder="e.g. manager1" />
                </div>
                <div>
                  <label className="label">Display Name *</label>
                  <input className="input" required value={createForm.display_name} onChange={e => setCreateForm(p => ({ ...p, display_name: e.target.value }))} placeholder="e.g. Alex Smith" />
                </div>
                <div>
                  <label className="label">Password (min 8 chars) *</label>
                  <input className="input" type="password" required minLength={8} value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Enter password" />
                </div>
                <div>
                  <label className="label">Admin Role *</label>
                  <select className="input" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="event_manager">Event Manager</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Admin"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── EDIT MY OWN DETAILS MODAL ────────────────────────────────────────── */}
        {showMyProfileForm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div className="card" style={{ width: "100%", maxWidth: 460 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h2 style={{ color: "#e2e8f0", fontWeight: 700 }}>Edit My Profile Details</h2>
                <button onClick={() => setShowMyProfileForm(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateOwnProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">My Display Name *</label>
                  <input className="input" required value={myProfileForm.display_name} onChange={e => setMyProfileForm(p => ({ ...p, display_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">My Admin ID (Username) *</label>
                  <input className="input" required value={myProfileForm.admin_id} onChange={e => setMyProfileForm(p => ({ ...p, admin_id: e.target.value }))} />
                </div>
                <div>
                  <label className="label">New Password (Leave blank to keep current)</label>
                  <input className="input" type="password" minLength={8} value={myProfileForm.password} onChange={e => setMyProfileForm(p => ({ ...p, password: e.target.value }))} placeholder="Enter new password" />
                </div>
                {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowMyProfileForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save My Details"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── EDIT OTHER ADMIN MODAL (Super Admin) ────────────────────────────── */}
        {editAdmin && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div className="card" style={{ width: "100%", maxWidth: 460 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h2 style={{ color: "#e2e8f0", fontWeight: 700 }}>Edit Admin: {editAdmin.display_name}</h2>
                <button onClick={() => setEditAdmin(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateOtherAdmin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Display Name *</label>
                  <input className="input" required value={editOtherForm.display_name} onChange={e => setEditOtherForm(p => ({ ...p, display_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Admin ID (Username) *</label>
                  <input className="input" required value={editOtherForm.admin_id} onChange={e => setEditOtherForm(p => ({ ...p, admin_id: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Admin Role *</label>
                  <select className="input" value={editOtherForm.role} onChange={e => setEditOtherForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="event_manager">Event Manager</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Reset Password (Optional)</label>
                  <input className="input" type="password" minLength={8} value={editOtherForm.password} onChange={e => setEditOtherForm(p => ({ ...p, password: e.target.value }))} placeholder="Enter new password to reset" />
                </div>
                {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditAdmin(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Updating..." : "Update Admin"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── ADMIN ACCOUNTS TABLE ─────────────────────────────────────────────── */}
        <div className="card">
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "3rem" }}>Loading admin accounts...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Admin ID (Username)</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  {isSuperAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.id === me?.id;
                  return (
                    <tr key={admin.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontWeight: 700 }}>
                            {admin.display_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{admin.display_name}</span>
                            {isSelf && <span style={{ fontSize: "0.7rem", color: "#34d399", marginLeft: "0.5rem", fontWeight: 700 }}>(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "#818cf8" }}>{admin.admin_id}</td>
                      <td><span className={`badge ${roleColor(admin.role)}`}>{admin.role?.replace("_", " ")}</span></td>
                      <td>
                        <span className={`badge ${admin.is_active ? "badge-green" : "badge-red"}`}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never"}
                      </td>
                      {isSuperAdmin && (
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {/* Edit Admin */}
                            <button
                              className="btn btn-outline"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                              onClick={() => isSelf ? setShowMyProfileForm(true) : handleOpenEditOther(admin)}
                              title="Edit Admin"
                            >
                              <Edit size={13} /> Edit
                            </button>

                            {/* Delete Other Admin */}
                            {!isSelf && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                                onClick={() => handleDeleteAdmin(admin.id, admin.display_name)}
                                title="Delete Admin Account"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
