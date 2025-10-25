import { useState, useEffect } from "react";
import { api } from "../api/http";

export default function ResetPassword(){
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
  },[]);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setMessage(null); setLoading(true);
    try{
      await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      setMessage('Password reset successful. You can now login.');
    }catch(err:any){
      setMessage(err.message || 'Failed');
    }finally{ setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto' }}>
      <h2>Reset Password</h2>
      <form onSubmit={onSubmit}>
        <label>Token</label>
        <input value={token} onChange={e=>setToken(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
        <label>New password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
        <button disabled={loading}>{loading ? 'Please wait…' : 'Reset Password'}</button>
      </form>
      {message && <p style={{ color: message.includes('successful') ? 'green' : 'crimson' }}>{message}</p>}
    </div>
  );
}
