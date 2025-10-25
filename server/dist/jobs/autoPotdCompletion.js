"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAwardPotdCompletions = checkAndAwardPotdCompletions;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const Potd_1 = __importDefault(require("../models/Potd"));
const Completion_1 = __importDefault(require("../models/Completion"));
const date_1 = require("../lib/date");
const leetcodeSubmissions_1 = require("../services/leetcodeSubmissions");
const gfgSubmissions_1 = require("../services/gfgSubmissions");
const award_1 = require("../services/award");
async function checkAndAwardPotdCompletions() {
    const date = (0, date_1.getTodayKey)();
    const potd = await Potd_1.default.findOne({ date }).lean();
    if (!potd) {
        console.warn(`[POTD] No POTD found for date=${date}, skipping auto-check`);
        return;
    }
    const totalUsers = await User_1.default.countDocuments({}).exec();
    console.log(`[POTD] Running auto-check for ${totalUsers} users, date=${date}`);
    const batchSize = Number(process.env.AUTO_POTD_BATCH || 20);
    let awardedTotal = 0;
    for (let skip = 0; skip < totalUsers; skip += batchSize) {
        const users = await User_1.default.find({}).skip(skip).limit(batchSize).lean();
        console.log(`[POTD] Processing users ${skip + 1}-${skip + users.length} of ${totalUsers}`);
        for (const user of users) {
            console.log(`[POTD] Checking user ${user._id} (${user.username || user.email})`);
            const solvedPlatforms = [];
            // LeetCode
            const lcUser = (user.leetcodeUsername || "").toString().trim();
            if (lcUser && potd?.leetcode && typeof potd.leetcode.slug === "string" && potd.leetcode.slug) {
                try {
                    const subs = await (0, leetcodeSubmissions_1.fetchLeetCodeSubmissions)(lcUser);
                    console.log(`[POTD] user=${user._id} leet=${lcUser} submissions=${subs.length}`);
                    const potdSlug = (0, date_1.normalizeSlug)("leetcode", potd.leetcode.slug);
                    const found = subs.find((s) => typeof s.slug === "string" && (0, date_1.normalizeSlug)("leetcode", s.slug) === potdSlug && s.status === "Accepted");
                    if (found) {
                        const isToday = typeof found.timestamp === "number" ? (0, date_1.getTodayKey)(undefined, new Date(found.timestamp * 1000)) === date : true;
                        if (isToday) {
                            console.log(`[POTD] user=${user._id} matched leetcode slug=${found.slug} (today=${isToday})`);
                            solvedPlatforms.push("leetcode");
                        }
                        else {
                            console.log(`[POTD] user=${user._id} matched leetcode slug=${found.slug} but timestamp not today, skipping`);
                        }
                    }
                }
                catch (e) {
                    console.error(`[POTD] Failed to fetch LeetCode submissions for user ${user._id}:`, e?.message || e);
                }
            }
            else {
                if (!lcUser)
                    console.log(`[POTD] user=${user._id} has no leetcodeUsername (or blank)`);
            }
            // GFG
            const gfgStrict = (process.env.GFG_STRICT || "false").toLowerCase() === "true";
            const gfgUser = (user.gfgUsername || "").toString().trim();
            if (gfgUser && potd?.gfg && typeof potd.gfg.slug === "string" && potd.gfg.slug) {
                try {
                    const subs = await (0, gfgSubmissions_1.fetchGfgSubmissions)(gfgUser);
                    console.log(`[POTD] user=${user._id} gfg=${gfgUser} submissions=${subs.length}`);
                    const potdSlug = (0, date_1.normalizeSlug)("gfg", potd.gfg.slug);
                    let found = subs.find((s) => typeof s.slug === "string" && (0, date_1.normalizeSlug)("gfg", s.slug) === potdSlug && s.status === "Accepted");
                    // If exact normalized slug didn't match and we are permissive, try keyword matching
                    if (!found && !gfgStrict) {
                        try {
                            const title = (potd.gfg.title || "").toString().toLowerCase();
                            const keys = title.split(/[^a-z0-9]+/).filter(Boolean).slice(0, 6);
                            if (keys.length) {
                                const hits = subs.filter((s) => typeof s.slug === "string" && s.status === "Accepted" && keys.some((k) => s.slug.toLowerCase().includes(k)));
                                if (hits.length) {
                                    found = hits[0];
                                    if (found && found.slug)
                                        console.log(`[POTD] user=${user._id} gfg permissive keyword match slug=${found.slug} keys=${keys.join(',')}`);
                                }
                            }
                        }
                        catch (e) {
                            console.warn('[POTD] permissive gfg matching error', e?.message || e);
                        }
                    }
                    // Fuzzy token overlap fallback: compare tokens in POTD title to tokens in each submission slug
                    if (!found && !gfgStrict) {
                        try {
                            const title = (potd.gfg.title || "").toString().toLowerCase();
                            const titleTokens = title.split(/[^a-z0-9]+/).filter(Boolean);
                            let best = { score: 0 };
                            for (const s of subs) {
                                if (!s.slug || s.status !== 'Accepted')
                                    continue;
                                const sTokens = s.slug.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
                                const common = sTokens.filter((t) => titleTokens.includes(t));
                                if (common.length > best.score)
                                    best = { slug: s.slug, score: common.length };
                            }
                            if (best.score >= 2) {
                                // accept fuzzy match
                                found = subs.find((s) => s.slug === best.slug);
                                if (found)
                                    console.log(`[POTD] user=${user._id} gfg fuzzy match slug=${found.slug} score=${best.score}`);
                            }
                        }
                        catch (e) {
                            console.warn('[POTD] fuzzy gfg matching error', e?.message || e);
                        }
                    }
                    if (found) {
                        const hasTimestamp = typeof found.timestamp === "number";
                        let isToday = false;
                        if (hasTimestamp) {
                            const ts = found.timestamp;
                            isToday = (0, date_1.getTodayKey)(undefined, new Date(ts * 1000)) === date;
                        }
                        if (hasTimestamp) {
                            if (isToday) {
                                console.log(`[POTD] user=${user._id} matched gfg slug=${found.slug} (today=${isToday})`);
                                solvedPlatforms.push("gfg");
                            }
                            else {
                                console.log(`[POTD] user=${user._id} matched gfg slug=${found.slug} but timestamp not today, skipping`);
                            }
                        }
                        else {
                            if (gfgStrict) {
                                console.log(`[POTD] user=${user._id} matched gfg slug=${found.slug} but no timestamp and GFG_STRICT=true -> skipping`);
                            }
                            else {
                                console.log(`[POTD] user=${user._id} matched gfg slug=${found.slug} with no timestamp (permissive mode) -> awarding`);
                                solvedPlatforms.push("gfg");
                            }
                        }
                    }
                }
                catch (e) {
                    console.error(`[POTD] Failed to fetch GFG submissions for user ${user._id}:`, e?.message || e);
                }
            }
            else {
                if (!user.gfgUsername)
                    console.log(`[POTD] user=${user._id} has no gfgUsername`);
            }
            for (const site of solvedPlatforms) {
                const problem = site === "leetcode" ? potd.leetcode : site === "gfg" ? potd.gfg : null;
                if (!problem)
                    continue;
                const existing = await Completion_1.default.findOne({ userId: user._id, date, site }).lean();
                if (existing && existing.awarded) {
                    console.log(`[POTD] user=${user._id} site=${site} already awarded, skipping`);
                    continue;
                }
                try {
                    const r = await (0, award_1.recordCompletionAndAward)(String(user._id), site, { title: problem.title || "", slug: problem.slug || "" });
                    console.log(`[POTD] Award result for user=${user._id} site=${site}:`, r);
                    awardedTotal++;
                }
                catch (e) {
                    console.error(`[POTD] Failed to award ${site} for user ${user._id}:`, e?.message || e);
                }
            }
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`[POTD] Auto-check completed. awardedTotal=${awardedTotal}`);
}
const defaultCron = process.env.AUTO_POTD_CRON || "*/10 * * * *";
node_cron_1.default.schedule(defaultCron, async () => {
    try {
        await checkAndAwardPotdCompletions();
        console.log(`[POTD] Automatic completion check ran (cron=${defaultCron}).`);
    }
    catch (e) {
        console.error("[POTD] Auto completion check failed:", e);
    }
});
//# sourceMappingURL=autoPotdCompletion.js.map