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
exports.validateLeetCodeUsername = validateLeetCodeUsername;
exports.validateGfgUsername = validateGfgUsername;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
async function validateLeetCodeUsername(username) {
    const user = (username || "").toString().trim();
    if (!user)
        return false;
    const url = "https://leetcode.com/graphql";
    const payload = {
        query: `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `,
        variables: { username },
    };
    try {
        const res = await axios_1.default.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "Referer": `https://leetcode.com/${username}/`,
                "Origin": "https://leetcode.com",
            },
            timeout: 10000,
            validateStatus: () => true,
        });
        const matchedUser = res.data?.data?.matchedUser;
        return !!matchedUser;
    }
    catch (e) {
        console.warn("[LeetCode Validate] Error validating username", username, e?.message || e);
        return false;
    }
}
async function validateGfgUsername(username) {
    const user = (username || "").toString().trim();
    if (!user)
        return false;
    const url = `https://auth.geeksforgeeks.org/user/${user}/practice/`;
    try {
        const res = await axios_1.default.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout: 10000,
            validateStatus: () => true,
        });
        if (res.status !== 200)
            return false;
        const html = res.data;
        const $ = cheerio.load(html);
        // Check if the page has the practice submissions table or user info
        const hasTable = $(".score_card_table").length > 0;
        const hasUserInfo = html.includes(`user/${user}`) && !html.includes("User not found");
        return hasTable || hasUserInfo;
    }
    catch (e) {
        console.warn("[GFG Validate] Error validating username", username, e?.message || e);
        return false;
    }
}
//# sourceMappingURL=validateUsernames.js.map