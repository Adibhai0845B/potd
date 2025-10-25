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
    // @ts-ignore
    const userId = req.session.userId;
    const user = await User_1.default.findById(userId, "email username leetcodeUsername gfgUsername coins streak lastStreakDay").lean();
    const today = (0, date_1.getTodayKey)();
    const completions = await Completion_1.default.find({ userId, date: today }).lean();
    res.json({ user, today, completions });
});
// PATCH /user/profile - update LeetCode/GFG usernames
r.patch("/profile", sessionAuth_1.sessionRequired, async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    const { leetcodeUsername, gfgUsername } = req.body || {};
    if (!leetcodeUsername && !gfgUsername) {
        return res.status(400).json({ error: "No username provided" });
    }
    const update = {};
    if (typeof leetcodeUsername === "string")
        update.leetcodeUsername = leetcodeUsername.trim();
    if (typeof gfgUsername === "string")
        update.gfgUsername = gfgUsername.trim();
    const user = await User_1.default.findByIdAndUpdate(userId, update, { new: true, fields: "email username leetcodeUsername gfgUsername coins streak lastStreakDay" }).lean();
    res.json({ user });
});
exports.default = r;
//# sourceMappingURL=user.js.map