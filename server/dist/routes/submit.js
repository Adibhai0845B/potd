"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionAuth_1 = require("../middleware/sessionAuth");
const award_1 = require("../services/award");
const User_1 = __importDefault(require("../models/User"));
const checkCooldown_1 = require("../lib/checkCooldown");
const r = (0, express_1.Router)();
// Helper to resolve userId either from session or from Bearer token
async function resolveUserId(req) {
    // session first
    if (req.session?.userId)
        return String(req.session.userId);
    const auth = (req.headers?.authorization || "").toString();
    if (auth.startsWith("Bearer ")) {
        const token = auth.slice(7).trim();
        if (token) {
            const u = await User_1.default.findOne({ apiToken: token }).lean();
            if (u)
                return String(u._id);
        }
    }
    return null;
}
r.post("/", async (req, res) => {
    const { site, problem } = (req.body ?? {});
    if (!site || !["leetcode", "gfg"].includes(site) || !problem?.slug) {
        res.status(400).json({ error: "Invalid payload" });
        return;
    }
    try {
        const userId = await resolveUserId(req);
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const result = await (0, award_1.recordCompletionAndAward)(userId, site, {
            title: problem.title || "",
            slug: problem.slug
        });
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message ?? "Error" });
    }
});
// POST /submit/check-and-award
// Body: { site: 'leetcode' | 'gfg', username: '<platform username>' }
// Finds the user by platform username (or email) and attempts to check POTD and award automatically.
r.post('/check-and-award', async (req, res) => {
    const { site } = (req.body ?? {});
    if (!site || !['leetcode', 'gfg'].includes(site))
        return res.status(400).json({ error: 'Invalid payload' });
    try {
        const userId = await resolveUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await User_1.default.findById(userId).exec();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Determine the platform username from the authenticated user record
        const platformUsername = site === 'leetcode' ? (user.leetcodeUsername || '').toString().trim() : (user.gfgUsername || '').toString().trim();
        if (!platformUsername)
            return res.status(400).json({ error: `Authenticated user has no ${site} username linked` });
        // resolve potd
        const PotdModel = require('../models/Potd').default;
        const potd = await PotdModel.findOne({}).sort({ createdAt: -1 }).lean();
        if (!potd || !potd[site] || !potd[site].slug)
            return res.status(400).json({ error: 'POTD not available for site' });
        // enforce cooldown
        const cd = (0, checkCooldown_1.canInvokeCheck)(String(user._id));
        if (!cd.ok)
            return res.status(429).json({ error: 'Please wait before checking again', waitMs: cd.waitMs });
        // fetch user's submissions for their linked username
        let subs = [];
        if (site === 'leetcode') {
            const svc = require('../services/leetcodeSubmissions');
            subs = await svc.fetchLeetCodeSubmissions(platformUsername);
        }
        else {
            const svc = require('../services/gfgSubmissions');
            subs = await svc.fetchGfgSubmissions(platformUsername);
        }
        const { normalizeSlug } = require('../lib/date');
        const potdSlug = normalizeSlug(site, potd[site].slug);
        const found = subs.find((s) => typeof s.slug === 'string' && normalizeSlug(site, s.slug) === potdSlug && s.status === 'Accepted');
        if (!found)
            return res.json({ ok: false, matched: false, message: 'No accepted submission for POTD found for your linked account' });
        // award for authenticated user
        try {
            const r = await (0, award_1.recordCompletionAndAward)(String(user._id), site, { title: potd[site].title || '', slug: potd[site].slug });
            return res.json({ ok: true, awarded: r });
        }
        catch (e) {
            return res.status(400).json({ ok: false, error: e.message || e });
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message || e });
    }
});
// POST /submit/token - generate/regenerate a user api token (requires session)
r.post("/token", sessionAuth_1.sessionRequired, async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    const token = require('crypto').randomBytes(24).toString('hex');
    await User_1.default.findByIdAndUpdate(userId, { apiToken: token });
    res.json({ ok: true, token });
});
exports.default = r;
//# sourceMappingURL=submit.js.map