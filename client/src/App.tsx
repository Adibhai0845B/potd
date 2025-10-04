import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import { api } from "./api/http";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try { await api("/user/me"); setLoggedIn(true); }
      catch { setLoggedIn(false); }
    })();
  }, []);

  if (loggedIn === null) return <div style={{ padding: 24 }}>Loading…</div>;

  return loggedIn
    ? <Dashboard onLogout={async () => { await api("/auth/logout", { method: "POST" }); setLoggedIn(false); }} />
    : <Auth onAuth={() => setLoggedIn(true)} />;
}
