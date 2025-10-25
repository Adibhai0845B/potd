import { Router } from "express";
import { sessionRequired } from "../middleware/sessionAuth";
import { recordCompletionAndAward } from "../services/award";
import User from "../models/User";
import { canInvokeCheck } from "../lib/checkCooldown";

const r = Router();

// Helper to resolve userId either from session or from Bearer token
async function resolveUserId(req: any) {
  // session first
  if (req.session?.userId) return String(req.session.userId);
  const auth = (req.headers?.authorization || "").toString();
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) {
      const u = await User.findOne({ apiToken: token }).lean();
      if (u) return String(u._id);
    }
  }
  return null;
}

r.post("/", async (req, res) => {
  const { site, problem } = (req.body ?? {}) as { site?: string; problem?: { title?: string; slug?: string } };
  if (!site || !["leetcode", "gfg"].includes(site) || !problem?.slug) {
    res.status(400).json({ error: "Invalid payload" }); return;
  }
  try {
    const userId = await resolveUserId(req as any);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const result = await recordCompletionAndAward(userId, site as "leetcode" | "gfg", {
      title: problem.title || "",
      slug: problem.slug!
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Error" });
  }
});

// POST /submit/check-and-award
// Body: { site: 'leetcode' | 'gfg', username: '<platform username>' }
// Finds the user by platform username (or email) and attempts to check POTD and award automatically.
r.post('/check-and-award', async (req, res) => {
  const { site } = (req.body ?? {}) as { site?: string };
  if (!site || !['leetcode', 'gfg'].includes(site)) return res.status(400).json({ error: 'Invalid payload' });
  try {
    const userId = await resolveUserId(req as any);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Determine the platform username from the authenticated user record
    const platformUsername = site === 'leetcode' ? (user.leetcodeUsername || '').toString().trim() : (user.gfgUsername || '').toString().trim();
    if (!platformUsername) return res.status(400).json({ error: `Authenticated user has no ${site} username linked` });

    // resolve potd
    const PotdModel = require('../models/Potd').default;
    const potd = await PotdModel.findOne({}).sort({ createdAt: -1 }).lean();
    if (!potd || !potd[site] || !potd[site].slug) return res.status(400).json({ error: 'POTD not available for site' });

  // enforce cooldown
  const cd = canInvokeCheck(String(user._id));
  if (!cd.ok) return res.status(429).json({ error: 'Please wait before checking again', waitMs: cd.waitMs });

  // fetch user's submissions for their linked username
    let subs: any[] = [];
    if (site === 'leetcode') {
      const svc = require('../services/leetcodeSubmissions');
      subs = await svc.fetchLeetCodeSubmissions(platformUsername);
    } else {
      const svc = require('../services/gfgSubmissions');
      subs = await svc.fetchGfgSubmissions(platformUsername);
    }

    const { normalizeSlug } = require('../lib/date');
    const potdSlug = normalizeSlug(site, potd[site].slug);
    const found = subs.find((s: any) => typeof s.slug === 'string' && normalizeSlug(site, s.slug) === potdSlug && s.status === 'Accepted');
    if (!found) return res.json({ ok: false, matched: false, message: 'No accepted submission for POTD found for your linked account' });

    // award for authenticated user
    try {
      const r = await recordCompletionAndAward(String(user._id), site as any, { title: potd[site].title || '', slug: potd[site].slug });
      return res.json({ ok: true, awarded: r });
    } catch (e: any) {
      return res.status(400).json({ ok: false, error: e.message || e });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message || e });
  }
});

// POST /submit/token - generate/regenerate a user api token (requires session)
r.post("/token", sessionRequired, async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId as string;
  const token = require('crypto').randomBytes(24).toString('hex');
  await User.findByIdAndUpdate(userId, { apiToken: token });
  res.json({ ok: true, token });
});

export default r;
