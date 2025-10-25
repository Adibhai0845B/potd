"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLeetCodeSubmissions = fetchLeetCodeSubmissions;
const axios_1 = __importDefault(require("axios"));
async function fetchLeetCodeSubmissions(username) {
    const user = (username || "").toString().trim();
    if (!user)
        return [];
    const url = "https://leetcode.com/graphql";
    const payload = {
        query: `
      query recentAcSubmissions($username: String!) {
        recentAcSubmissionList(username: $username, limit: 20) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `,
        variables: { username },
    };
    const res = await axios_1.default.post(url, payload, {
        headers: {
            "Content-Type": "application/json",
            "Referer": `https://leetcode.com/${username}/`,
            "Origin": "https://leetcode.com",
        },
        timeout: 15000,
        validateStatus: () => true,
    });
    const list = res.data?.data?.recentAcSubmissionList || [];
    // Return array of { slug, status, timestamp }
    return list.map((item) => ({ slug: item.titleSlug, status: "Accepted", timestamp: item.timestamp }));
}
//# sourceMappingURL=leetcodeSubmissions.js.map