"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        // Validate the new username exists
        const { validateLeetCodeUsername } = await Promise.resolve().then(() => __importStar(require("../services/validateUsernames")));
        const exists = await validateLeetCodeUsername(newLeetUsername);
        if (!exists) {
            return res.status(400).json({ error: "LeetCode username does not exist" });
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
        // Validate the new username exists
        const { validateGfgUsername } = await Promise.resolve().then(() => __importStar(require("../services/validateUsernames")));
        const exists = await validateGfgUsername(newGfgUsername);
        if (!exists) {
            return res.status(400).json({ error: "GFG username does not exist" });
        }
        update.gfgUsername = newGfgUsername;
    }
    const user = await User_1.default.findByIdAndUpdate(userId, update, { new: true, fields: "email username leetcodeUsername gfgUsername coins streak lastStreakDay" }).lean();
    res.json({ user });
});
r.post("/validate-username", sessionAuth_1.sessionRequired, async (req, res) => {
    const { site, username } = req.body || {};
    if (!site || !username || typeof username !== "string") {
        return res.status(400).json({ error: "Site and username required" });
    }
    const user = username.trim();
    if (!user)
        return res.json({ exists: false });
    try {
        const { validateLeetCodeUsername, validateGfgUsername } = await Promise.resolve().then(() => __importStar(require("../services/validateUsernames")));
        let exists = false;
        if (site === "leetcode") {
            exists = await validateLeetCodeUsername(user);
        }
        else if (site === "gfg") {
            exists = await validateGfgUsername(user);
        }
        else {
            return res.status(400).json({ error: "Invalid site" });
        }
        res.json({ exists });
    }
    catch (e) {
        console.error("Validation error", e);
        res.status(500).json({ error: "Validation failed" });
    }
});
exports.default = r;
//# sourceMappingURL=user.js.map