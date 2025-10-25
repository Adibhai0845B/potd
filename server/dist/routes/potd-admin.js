"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const potdJob_1 = require("../jobs/potdJob");
const autoPotdCompletion_1 = require("../jobs/autoPotdCompletion");
const leetcodeSubmissions_1 = require("../services/leetcodeSubmissions");
const gfgSubmissions_1 = require("../services/gfgSubmissions");
const r = (0, express_1.Router)();
r.post("/refresh", async (_req, res) => {
    try {
        const data = await (0, potdJob_1.refreshPotdOnce)();
        res.json({ ok: true, ...data });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "Failed" });
    }
});
// Dev-only endpoint to trigger auto completion check immediately.
// Guarded by DEV_POTD_TOKEN env var or require a header 'x-dev-potd-token'.
r.post("/trigger-auto-check", async (req, res) => {
    const token = process.env.DEV_POTD_TOKEN || "";
    const header = req.headers["x-dev-potd-token"] || "";
    if (token && token !== header)
        return res.status(403).json({ ok: false, error: "Forbidden" });
    try {
        await (0, autoPotdCompletion_1.checkAndAwardPotdCompletions)();
        return res.json({ ok: true, message: "Triggered" });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: e?.message || "Failed" });
    }
});
exports.default = r;
// Dev endpoint: fetch recent submissions for a username on a platform
r.post('/debug/fetch-subs', async (req, res) => {
    const { site, username } = req.body || {};
    if (!site || !username)
        return res.status(400).json({ error: 'site and username required' });
    try {
        if (site === 'leetcode') {
            const subs = await (0, leetcodeSubmissions_1.fetchLeetCodeSubmissions)(username);
            return res.json({ ok: true, subs });
        }
        if (site === 'gfg') {
            const subs = await (0, gfgSubmissions_1.fetchGfgSubmissions)(username);
            return res.json({ ok: true, subs });
        }
        return res.status(400).json({ error: 'unknown site' });
    }
    catch (e) {
        return res.status(500).json({ error: e?.message || String(e) });
    }
});
//# sourceMappingURL=potd-admin.js.map