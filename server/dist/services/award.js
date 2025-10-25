"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCompletionAndAward = recordCompletionAndAward;
const Completion_1 = __importDefault(require("../models/Completion"));
const User_1 = __importDefault(require("../models/User"));
const Potd_1 = __importDefault(require("../models/Potd"));
const date_1 = require("../lib/date");
async function recordCompletionAndAward(userId, site, problem) {
    const date = (0, date_1.getTodayKey)();
    const potd = await Potd_1.default.findOne({ date }).lean();
    if (!potd || !potd[site] || !potd[site].slug)
        throw new Error("POTD not ready");
    const todaysSlug = (0, date_1.normalizeSlug)(site, potd[site].slug);
    const submittedSlug = (0, date_1.normalizeSlug)(site, problem.slug);
    // Exact match first
    if (todaysSlug !== submittedSlug) {
        // Allow more permissive matching for GFG because their URL/slug patterns
        // sometimes include extra segments or slightly different forms.
        if (site === "gfg") {
            const a = todaysSlug || "";
            const b = submittedSlug || "";
            const permissive = a.includes(b) || b.includes(a) || a.endsWith(b) || b.endsWith(a);
            if (!permissive) {
                console.warn(`[AWARD] GFG slug mismatch: expected='${todaysSlug}' submitted='${submittedSlug}'`);
                throw new Error(`Not the POTD (gfg): expected ${todaysSlug}, got ${submittedSlug}`);
            }
        }
        else {
            throw new Error(`Not the POTD (${site}): expected ${todaysSlug}, got ${submittedSlug}`);
        }
    }
    const created = await Completion_1.default.findOneAndUpdate({ userId, date, site }, {
        $setOnInsert: {
            userId,
            date,
            site,
            problemSlug: submittedSlug,
            problemTitle: problem.title || "",
            awarded: false,
        },
    }, { upsert: true, new: true });
    if (!created.awarded) {
        const u = await User_1.default.findById(userId);
        if (!u)
            throw new Error("User not found");
        const yesterday = (0, date_1.getYesterdayKey)();
        const continueStreak = u.lastStreakDay === yesterday;
        u.streak = continueStreak ? u.streak + 1 : 1;
        u.lastStreakDay = date;
        const coins = 10;
        u.coins += coins;
        await u.save();
        created.awarded = true;
        await created.save();
        return { ok: true, coinsAdded: coins, streak: u.streak };
    }
    return { ok: true, coinsAdded: 0, streak: undefined, message: "Already awarded" };
}
//# sourceMappingURL=award.js.map