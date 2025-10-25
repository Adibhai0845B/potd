import { Router } from "express";
import { refreshPotdOnce } from "../jobs/potdJob";
import { checkAndAwardPotdCompletions } from "../jobs/autoPotdCompletion";
import { fetchLeetCodeSubmissions } from "../services/leetcodeSubmissions";
import { fetchGfgSubmissions } from "../services/gfgSubmissions";

const r = Router();
r.post("/refresh", async (_req, res) => {
  try {
    const data = await refreshPotdOnce();
    res.json({ ok: true, ...data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Failed" });
  }
});

// Dev-only endpoint to trigger auto completion check immediately.
// Guarded by DEV_POTD_TOKEN env var or require a header 'x-dev-potd-token'.
r.post("/trigger-auto-check", async (req, res) => {
  const token = process.env.DEV_POTD_TOKEN || "";
  const header = (req.headers["x-dev-potd-token"] as string) || "";
  if (token && token !== header) return res.status(403).json({ ok: false, error: "Forbidden" });
  try {
    await checkAndAwardPotdCompletions();
    return res.json({ ok: true, message: "Triggered" });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Failed" });
  }
});

export default r;

// Dev endpoint: fetch recent submissions for a username on a platform
r.post('/debug/fetch-subs', async (req, res) => {
  const { site, username } = req.body || {};
  if (!site || !username) return res.status(400).json({ error: 'site and username required' });
  try {
    if (site === 'leetcode') {
      const subs = await fetchLeetCodeSubmissions(username);
      return res.json({ ok: true, subs });
    }
    if (site === 'gfg') {
      const subs = await fetchGfgSubmissions(username);
      return res.json({ ok: true, subs });
    }
    return res.status(400).json({ error: 'unknown site' });
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});
