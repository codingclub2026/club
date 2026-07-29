import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
          Welcome back to <span style={{ color: "#6366f1" }}>CodeVed</span>
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Sign in to register for events and track your participation</p>
      </div>
      <SignIn />
    </div>
  );
}
