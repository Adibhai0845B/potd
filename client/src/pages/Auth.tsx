import { useState } from "react";
import { api } from "../api/http";

type Props = { onAuth: () => void };

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? "Please wait…" : (mode === "login" ? "Login" : "Register")}</button>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>Switch to {mode === "login" ? "register" : "login"}</button>
        </div>
      </form>
      {message && <p style={{ color: "crimson" }}>{message}</p>}
    </div>
  );
}
