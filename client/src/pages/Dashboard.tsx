import { useEffect, useState } from "react";
import { api } from "../api/http";
import { getTodayPotd, type Potd } from "../api/potd";

type Props = { onLogout: () => void };

type MeResp = {
  user: { email: string; username?: string; coins: number; streak: number; lastStreakDay?: string };
  today: string;
  completions: Array<{ site: "leetcode" | "gfg"; date: string; problemSlug: string; problemTitle?: string }>;
};

export default function Dashboard({ onLogout }: Props) {
  const [me, setMe] = useState<MeResp | null>(null);
  const [potd, setPotd] = useState<Potd | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setMsg(null);
    try {
      const [meResp, potdResp] = await Promise.all([
        api<MeResp>("/user/me"),
        getTodayPotd().catch(() => null)
      ]);
      setMe(meResp);
      setPotd(potdResp);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function markDone(site: "leetcode" | "gfg", slug: string, title: string) {
    try {
      await api("/submit", {
        method: "POST",
        body: JSON.stringify({ site, problem: { slug, title } })
      });
      await loadAll();
    } catch (e: any) {
      setMsg(e?.message || "Could not submit completion");
    }
  }

  function hasDone(site: "leetcode" | "gfg") {
    return me?.completions?.some(c => c.site === site) ?? false;
  }

  if (loading || !me) {
    return <div style={styles.container}>Loading…</div>;
  }

  const doneLC = hasDone("leetcode");
  const doneGFG = hasDone("gfg");

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ margin: 0 }}>POTD</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadAll} style={styles.secondaryBtn}>Refresh</button>
          <button onClick={onLogout} style={styles.primaryBtn}>Logout</button>
        </div>
      </header>

      <section style={styles.stats}>
        <div style={styles.statBox}>Coins: <b>{me.user.coins}</b></div>
        <div style={styles.statBox}>Streak: <b>{me.user.streak}</b></div>
        <div style={styles.statBox}>Today: <b>{me.today}</b></div>
      </section>

      {potd ? (
        <section style={{ marginTop: 12 }}>
          {/* LeetCode card */}
          {potd.leetcode && (
            <div style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.platform}>
                  <strong>LeetCode</strong>
                  {doneLC && <span style={styles.badge}>Done</span>}
                </div>
                <a
                    href={`https://leetcode.com/problems/${potd.leetcode.slug}/`}
                    target="_blank" rel="noreferrer"
                    style={styles.link}
                >
                  Open
                </a>
              </div>
              <div style={{ marginTop: 6 }}>{potd.leetcode.title}</div>
              <div style={styles.cardActions}>
                <button
                  disabled={doneLC}
                  onClick={() => markDone("leetcode", potd.leetcode!.slug, potd.leetcode!.title)}
                  style={doneLC ? styles.disabledBtn : styles.actionBtn}
                >
                  {doneLC ? "Marked" : "Mark as done"}
                </button>
              </div>
            </div>
          )}

          {/* GFG card */}
          {potd.gfg && (
            <div style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.platform}>
                  <strong>GFG</strong>
                  {doneGFG && <span style={styles.badge}>Done</span>}
                </div>
                <a
                    href={`https://www.geeksforgeeks.org/${potd.gfg.slug}/`}
                    target="_blank" rel="noreferrer"
                    style={styles.link}
                >
                  Open
                </a>
              </div>
              <div style={{ marginTop: 6 }}>{potd.gfg.title}</div>
              <div style={styles.cardActions}>
                <button
                  disabled={doneGFG}
                  onClick={() => markDone("gfg", potd.gfg!.slug, potd.gfg!.title)}
                  style={doneGFG ? styles.disabledBtn : styles.actionBtn}
                >
                  {doneGFG ? "Marked" : "Mark as done"}
                </button>
              </div>
            </div>
          )}

          {/* If neither source available */}
          {!potd.leetcode && !potd.gfg && (
            <p style={{ marginTop: 8 }}>Sorry, no POTD available right now.</p>
          )}
        </section>
      ) : (
        <p style={{ marginTop: 8 }}>Sorry, no POTD available right now.</p>
      )}

      {msg && <p style={{ marginTop: 12, color: "#ff4d4f" }}>{msg}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 640, margin: "40px auto", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  stats: { display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" },
  statBox: { background: "#0b0b0bff", borderRadius: 8, padding: "6px 10px" },
  card: { border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 12 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  platform: { display: "flex", gap: 8, alignItems: "center" },
  badge: { background: "#e6ffed", color: "#1a7f37", fontSize: 12, padding: "2px 6px", borderRadius: 999 },
  link: { padding: "6px 10px", borderRadius: 8, background: "#222", color: "#fff", textDecoration: "none" },
  cardActions: { marginTop: 10, display: "flex", gap: 8 },
  actionBtn: { padding: "6px 10px", borderRadius: 8, background: "#1677ff", border: 0, color: "#fff", cursor: "pointer" },
  disabledBtn: { padding: "6px 10px", borderRadius: 8, background: "#ccc", border: 0, color: "#555", cursor: "not-allowed" },
  primaryBtn: { padding: "6px 10px", borderRadius: 8, background: "#111", border: 0, color: "#fff", cursor: "pointer" },
  secondaryBtn: { padding: "6px 10px", borderRadius: 8, background: "#eaeaea", border: 0, color: "#111", cursor: "pointer" }
};
