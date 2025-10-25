"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshPotdOnce = refreshPotdOnce;
exports.schedulePotdJob = schedulePotdJob;
const node_cron_1 = __importDefault(require("node-cron"));
const Potd_1 = __importDefault(require("../models/Potd"));
const date_1 = require("../lib/date");
const potdSources_1 = require("../services/potdSources");
async function refreshPotdOnce() {
    const date = (0, date_1.getTodayKey)();
    const results = {};
    await Promise.allSettled([
        (async () => {
            try {
                results.leetcode = await (0, potdSources_1.fetchLeetCodePotd)();
            }
            catch (e) {
                console.warn("[POTD] LeetCode fetch failed:", e?.message || e);
            }
        })(),
        (async () => {
            try {
                results.gfg = await (0, potdSources_1.fetchGfgPotd)();
            }
            catch (e) {
                console.warn("[POTD] GFG fetch failed:", e?.message || e);
            }
        })(),
    ]);
    if (!results.leetcode && !results.gfg) {
        throw new Error("No POTD sources fetched");
    }
    await Potd_1.default.updateOne({ date }, { $set: { date, ...results } }, { upsert: true });
    return { date, ...results };
}
/**
 * Schedule: Every day at 05:00 AM IST
 * Cron string is "0 5 * * *" and we pin timezone to Asia/Kolkata.
 */
function schedulePotdJob() {
    const tz = process.env.APP_TIMEZONE || "Asia/Kolkata";
    node_cron_1.default.schedule("0 5 * * *", // minute hour dom mon dow
    async () => {
        try {
            const r = await refreshPotdOnce();
            console.log("[POTD] Stored @ 05:00", tz, "->", r);
        }
        catch (e) {
            console.error("[POTD] refresh failed:", e?.message || e);
        }
    }, { timezone: tz });
    console.log(`[POTD] Daily job scheduled at 05:00 ${tz}`);
}
//# sourceMappingURL=potdJob.js.map