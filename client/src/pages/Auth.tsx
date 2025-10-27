import { useState } from "react";
import { api } from "../api/http";

type Props = { onAuth: () => void };

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(null); setLoading(true);
    try {
      await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      onAuth();
    } catch (err: any) { setMessage(err.message || "Auth failed"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} autoComplete="email" />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? "Please wait…" : (mode === "login" ? "Login" : "Register")}</button>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>Switch to {mode === "login" ? "register" : "login"}</button>
        </div>
      </form>
      {mode === "login" && (
        <p style={{ marginTop: 8 }}>
          <button style={{ background: "none", border: "none", color: "blue", textDecoration: "underline", cursor: "pointer" }} onClick={() => setForgotOpen(true)}>Forgot password?</button>
        </p>
      )}
      {forgotOpen && (
        <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
          <h3>Forgot password</h3>
          <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="your email" style={{ width: "100%", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => {
              setForgotMessage(null);
              try {
                const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });
                if ((data as any)?.preview) setForgotMessage(`Preview URL: ${(data as any).preview}`);
                else if ((data as any)?.devToken) setForgotMessage(`Dev token: ${(data as any).devToken}`);
                else setForgotMessage('Check your email for reset link');
              } catch (err:any) { setForgotMessage(err.message || 'Failed'); }
            }}>Send reset</button>
            <button onClick={() => { setForgotOpen(false); setForgotEmail(''); setForgotMessage(null); }}>Close</button>
          </div>
          {forgotMessage && <p style={{ color: 'crimson' }}>{forgotMessage}</p>}
        </div>
      )}
      {message && <p style={{ color: "crimson" }}>{message}</p>}
    </div>
  );
}
