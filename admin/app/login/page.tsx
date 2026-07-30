"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ADMIN_API } from "@/lib/api";
import { Code2, Lock, User, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminApi<{ admin_id: string; display_name: string; role: string }>(
        ADMIN_API.login,
        {
          method: "POST",
          body: JSON.stringify({ adminId: form.adminId, password: form.password }),
        }
      );

      if (res.success) {
        // Set a session indicator cookie on this domain so proxy.ts can detect login.
        // max-age=2592000 = 30 days
        document.cookie = "cv_admin_session=1; path=/; SameSite=Lax; max-age=2592000";
        window.location.href = "/dashboard";
      } else {
        setError(res.error ?? "Invalid credentials");
      }
    } catch {
      setError("Connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background orb */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 10px 30px rgba(99,102,241,0.4)",
          }}>
            <Code2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#e2e8f0", marginBottom: "0.4rem" }}>
            Admin Portal
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            CodeVed Management System
          </p>
        </div>

        {/* Security notice */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "0.5rem", padding: "0.625rem 0.875rem",
          marginBottom: "1.5rem", fontSize: "0.78rem", color: "#94a3b8",
        }}>
          <ShieldCheck size={14} color="#6366f1" />
          Secure admin-only login. Student Clerk accounts are not accepted.
        </div>

        {/* Login form */}
        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Admin ID */}
            <div>
              <label className="label">Admin ID</label>
              <div style={{ position: "relative" }}>
                <User size={16} color="#6366f1" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your admin ID"
                  value={form.adminId}
                  onChange={(e) => setForm(prev => ({ ...prev, adminId: e.target.value }))}
                  required
                  autoComplete="username"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#6366f1" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "0.5rem", padding: "0.625rem 0.875rem",
                color: "#f87171", fontSize: "0.8rem",
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "0.9rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in..." : "Sign In to Admin Panel"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#64748b", fontSize: "0.78rem" }}>
          <a href="http://localhost:3000" style={{ color: "#6366f1", textDecoration: "none" }}>
            ← Back to CodeVed Portal
          </a>
        </p>
      </div>
    </div>
  );
}
