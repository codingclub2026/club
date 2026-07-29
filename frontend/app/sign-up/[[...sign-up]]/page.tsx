import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#e2e8f0" }}>
          Join <span style={{ color: "#6366f1" }}>CodeVed</span> 2026
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Create your account and start competing</p>
      </div>
      <SignUp />
    </div>
  );
}
