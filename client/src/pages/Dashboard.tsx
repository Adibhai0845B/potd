import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import { getTodayPotd, type Potd } from "../api/potd";
import "./Dashboard.css";

type Props = { onLogout: () => void };

type Completion = {
  site: "leetcode" | "gfg";
  date: string;
  problemSlug: string;
  problemTitle?: string;
};

type MeResp = {
  user: { email: string; username?: string; coins: number; streak: number; lastStreakDay?: string };
  today: string;
  completions: Completion[];
};

type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

export default function Dashboard({ onLogout }: Props) {
  const [me, setMe] = useState<MeResp | null>(null);
  const [potd, setPotd] = useState<Potd | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [meResp, potdResp] = await Promise.all([
        api<MeResp>("/user/me"),
        getTodayPotd().catch(() => null),
      ]);
      setMe(meResp);
      setPotd(potdResp);
    } catch (e: any) {
      pushToast("error", e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function markDone(site: "leetcode" | "gfg", slug: string, title: string) {
    try {
      await api("/submit", {
        method: "POST",
        body: JSON.stringify({ site, problem: { slug, title } }),
      });
      pushToast("success", `Marked ${site.toUpperCase()} POTD as done!`);
      await loadAll();
    } catch (e: any) {
      pushToast("error", e?.message || "Could not mark as done");
    }
  }

  function pushToast(kind: Toast["kind"], text: string) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  const doneLC = useMemo(() => me?.completions?.some((c) => c.site === "leetcode") ?? false, [me]);
  const doneGFG = useMemo(() => me?.completions?.some((c) => c.site === "gfg") ?? false, [me]);

  return (
    <div className="dash-root">
      <header className="dash-header">
        <div className="brand">
          <span className="logo-dot" />
          <span className="brand-text">POTD</span>
        </div>
        <div className="header-actions">
          <button
            className="btn ghost"
            onClick={async () => {
              setRefreshing(true);
              await loadAll();
              setRefreshing(false);
              pushToast("info", "Refreshed");
            }}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {loading ? (
        <Skeleton />
      ) : me ? (
        <>
          <section className="stats">
            <StatCard label="Coins" value={me.user.coins} />
            <StreakRing streak={me.user.streak} />
            <StatCard label="Today" value={me.today} mono />
          </section>

          <section className="cards">
            <PlatformCard
              platform="LeetCode"
              done={doneLC}
              potd={potd?.leetcode}
              onOpen={() =>
                potd?.leetcode &&
                window.open(`https://leetcode.com/problems/${potd.leetcode.slug}/`, "_blank", "noopener,noreferrer")
              }
              onMark={() =>
                potd?.leetcode &&
                markDone("leetcode", potd.leetcode.slug, potd.leetcode.title)
              }
            />
            <PlatformCard
              platform="GFG"
              done={doneGFG}
              potd={potd?.gfg}
              onOpen={() =>
                potd?.gfg &&
                window.open(`https://www.geeksforgeeks.org/${potd.gfg.slug}/`, "_blank", "noopener,noreferrer")
              }
              onMark={() =>
                potd?.gfg && markDone("gfg", potd.gfg.slug, potd.gfg.title)
              }
            />
          </section>

          {!potd?.leetcode && !potd?.gfg && (
            <EmptyState
              title="No POTD right now"
              subtitle="We couldn't fetch today's problems yet. Hit refresh or try again in a moment."
              actionLabel="Refresh"
              onAction={() => loadAll()}
            />
          )}
        </>
      ) : (
        <EmptyState
          title="Not loaded"
          subtitle="Could not fetch your account. Try refreshing."
          actionLabel="Refresh"
          onAction={() => loadAll()}
        />
      )}

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function Skeleton() {
  return (
    <div className="skeleton">
      <div className="s-row" />
      <div className="s-grid">
        <div className="s-card" />
        <div className="s-card" />
        <div className="s-card" />
      </div>
      <div className="s-grid">
        <div className="s-wide" />
        <div className="s-wide" />
      </div>
    </div>
  );
}

function StatCard({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="stat-card glass">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

function StreakRing({ streak }: { streak: number }) {
  // cap the ring fill to a reasonable window (e.g., 30)
  const cap = 30;
  const pct = Math.min(100, Math.round((Math.min(streak, cap) / cap) * 100));
  const style = { ["--fill" as any]: `${pct}%` };
  return (
    <div className="streak-card glass">
      <div className="ring" style={style as any}>
        <div className="ring-inner">
          <div className="ring-number">{streak}</div>
          <div className="ring-label">streak</div>
        </div>
      </div>
      <div className="ring-caption">Max ring shows 30-day window</div>
    </div>
  );
}

function PlatformCard({
  platform,
  potd,
  done,
  onOpen,
  onMark,
}: {
  platform: "LeetCode" | "GFG";
  potd?: { title: string; slug: string };
  done: boolean;
  onOpen: () => void;
  onMark: () => void;
}) {
  return (
    <div className="card glass">
      <div className="card-top">
        <div className="title-wrap">
          <div className="platform">
            <span className={`dot ${platform === "LeetCode" ? "lc" : "gfg"}`} />
            <span className="platform-name">{platform}</span>
            {done && <span className="badge">Done</span>}
          </div>
          <div className="problem-title" title={potd?.title || ""}>
            {potd?.title || "No problem yet"}
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={onOpen} disabled={!potd}>
            Open
          </button>
          <button className="btn" onClick={onMark} disabled={!potd || done}>
            {done ? "Marked" : "Mark as done"}
          </button>
        </div>
      </div>
      {potd && (
        <div className="slug">
          <span className="slug-label">Slug:</span> <code>{potd.slug}</code>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-emoji">🫥</div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-sub">{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn" onClick={onAction} style={{ marginTop: 10 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
