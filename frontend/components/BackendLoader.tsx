"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const tips = [
  "🚀 Setting up your experience...",
  "⚡ Charging up the servers...",
  "🎯 Loading event data for you...",
  "🔧 Warming up the backend...",
  "🌐 Connecting to the cloud...",
  "💡 Preparing something awesome...",
  "🏆 Almost there, hang tight!",
  "🎪 CodeVed 2026 is almost ready!",
];

export default function BackendLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Rotate tips every 2.5s
  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 2500);
    return () => clearInterval(t);
  }, []);

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  // Track elapsed seconds
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [ready]);

  // Poll backend health until ready
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL.replace("/api/v1", "")}/health`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok && !cancelled) {
          setReady(true);
          return;
        }
      } catch {
        // backend still sleeping
      }
      if (!cancelled) {
        setAttempt(a => a + 1);
        timeoutId = setTimeout(check, 3000);
      }
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (ready) return <>{children}</>;

  const progress = Math.min(95, attempt * 8);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#05060d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "20%", left: "15%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", animation: "pulseGlow 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "15%",
        width: 350, height: 350,
        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", animation: "pulseGlow 4s ease-in-out infinite 2s",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(80px)",
      }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 4, height: 4,
          borderRadius: "50%",
          background: `rgba(${i % 2 === 0 ? "99,102,241" : "168,85,247"},0.6)`,
          top: `${15 + i * 14}%`,
          left: `${10 + i * 15}%`,
          animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* Main card */}
      <div style={{
        background: "rgba(15, 18, 35, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.5rem",
        padding: "3rem 2.5rem",
        maxWidth: 460,
        width: "90%",
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Animated logo ring */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 2rem" }}>
          {/* Outer spinning ring */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#6366f1",
            borderRightColor: "#a855f7",
            animation: "spin 1.2s linear infinite",
          }} />
          {/* Inner spinning ring (reverse) */}
          <div style={{
            position: "absolute", inset: 8,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#06b6d4",
            animation: "spin 1.8s linear infinite reverse",
          }} />
          {/* Center icon */}
          <div style={{
            position: "absolute", inset: 16,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem",
          }}>
            ⚡
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "1.6rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.4rem",
        }}>
          CodeVed 2026
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "2rem" }}>
          Technical Fest — Waking up the server{".".repeat(dots)}
        </p>

        {/* Progress bar */}
        <div style={{
          height: 4,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)",
            borderRadius: 99,
            transition: "width 0.6s ease",
            boxShadow: "0 0 12px rgba(99,102,241,0.6)",
          }} />
        </div>

        {/* Rotating tip */}
        <div style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontSize: "0.83rem",
          color: "#94a3b8",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          transition: "opacity 0.4s ease",
        }}>
          {tips[tipIndex]}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "1.5rem" }}>
          {[
            { label: "Events", value: "TBA" },
            { label: "Prize Pool", value: "TBA" },
            { label: "Colleges", value: "TBA" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.75rem",
              padding: "0.625rem 0.5rem",
            }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}>{value}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Elapsed time */}
        <p style={{ color: "#475569", fontSize: "0.75rem" }}>
          {elapsed < 5
            ? "Connecting to backend..."
            : elapsed < 15
            ? `Server is waking up... (${elapsed}s)`
            : `Render cold start in progress... (${elapsed}s) — this can take up to 50s`}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes floatParticle {
          from { transform: translateY(0px); opacity: 0.4; }
          to { transform: translateY(-20px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
