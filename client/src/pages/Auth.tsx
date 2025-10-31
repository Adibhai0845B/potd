import { useState } from "react";
import { api } from "../api/http";
import "./Auth.css";

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
    <div className="auth-container">
      <h2 className="auth-title">{mode === "login" ? "Login" : "Register"}</h2>
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="Enter your email"
        />
        <label className="auth-label">Password</label>
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Enter your password"
        />
        <div className="auth-button-group">
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Please wait…" : (mode === "login" ? "Login" : "Register")}
          </button>
          <button className="auth-btn ghost" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            Switch to {mode === "login" ? "register" : "login"}
          </button>
        </div>
      </form>
      {mode === "login" && (
        <button className="auth-forgot-link" onClick={() => setForgotOpen(true)}>
          Forgot password?
        </button>
      )}
      {forgotOpen && (
        <div className="auth-forgot-section">
          <h3 className="forgot-title">Forgot password</h3>
          <input
            className="forgot-input"
            type="email"
            value={forgotEmail}
            onChange={e=>setForgotEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <div className="forgot-button-group">
            <button
              className="forgot-btn primary"
              onClick={async () => {
                setForgotMessage(null);
                try {
                  const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });
                  if ((data as any)?.preview) setForgotMessage(`Preview URL: ${(data as any).preview}`);
                  else if ((data as any)?.devToken) setForgotMessage(`Dev token: ${(data as any).devToken}`);
                  else setForgotMessage('Check your email for reset link');
                } catch (err:any) { setForgotMessage(err.message || 'Failed'); }
              }}
            >
              Send reset
            </button>
            <button
              className="forgot-btn secondary"
              onClick={() => { setForgotOpen(false); setForgotEmail(''); setForgotMessage(null); }}
            >
              Close
            </button>
          </div>
          {forgotMessage && <div className="forgot-message error">{forgotMessage}</div>}
        </div>
      )}
      {message && <div className="auth-message error">{message}</div>}
    </div>
  );
}
