"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionAuth_1 = require("../middleware/sessionAuth");
const User_1 = __importDefault(require("../models/User"));
const Completion_1 = __importDefault(require("../models/Completion"));
const date_1 = require("../lib/date");
const r = (0, express_1.Router)();
r.get("/me", sessionAuth_1.sessionRequired, async (req, res) => {
    //@ts-ignore
    const userId = req.session.userId;
    const user = await User_1.default.findById(userId, "email username leetcodeUsername gfgUsername coins streak lastStreakDay").lean();
    const today = (0, date_1.getTodayKey)();
    const completions = await Completion_1.default.find({ userId, date: today }).lean();
    res.json({ user, today, completions });
});
//PATCH /user/profile-update LeetCode/GFG usernames
r.patch("/profile", sessionAuth_1.sessionRequired, async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    const { leetcodeUsername, gfgUsername } = req.body || {};
    if (!leetcodeUsername && !gfgUsername) {
        return res.status(400).json({ error: "No username provided" });
    }
    // Check if user has any completions with current usernames
    const currentUser = await User_1.default.findById(userId).lean();
    if (!currentUser)
        return res.status(404).json({ error: "User not found" });
    const update = {};
    if (typeof leetcodeUsername === "string") {
        const newLeetUsername = leetcodeUsername.trim();
        if (currentUser.leetcodeUsername && currentUser.leetcodeUsername !== newLeetUsername) {
            // Check if there are any completions with the current leetcode username
            const hasCompletions = await Completion_1.default.findOne({ userId, site: "leetcode", platformUsername: currentUser.leetcodeUsername }).lean();
            if (hasCompletions) {
                return res.status(400).json({ error: "Cannot change LeetCode username after earning points with it" });
            }
        }
        update.leetcodeUsername = newLeetUsername;
    }
    if (typeof gfgUsername === "string") {
        const newGfgUsername = gfgUsername.trim();
        if (currentUser.gfgUsername && currentUser.gfgUsername !== newGfgUsername) {
            // Check if there are any completions with the current gfg username
            const hasCompletions = await Completion_1.default.findOne({ userId, site: "gfg", platformUsername: currentUser.gfgUsername }).lean();
            if (hasCompletions) {
                return res.status(400).json({ error: "Cannot change GFG username after earning points with it" });
            }
        }
        update.gfgUsername = newGfgUsername;
    }
    const user = await User_1.default.findByIdAndUpdate(userId, update, { new: true, fields: "email username leetcodeUsername gfgUsername coins streak lastStreakDay" }).lean();
    res.json({ user });
});
exports.default = r;
//# sourceMappingURL=user.js.map