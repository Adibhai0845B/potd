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
exports.fetchLeetCodePotd = fetchLeetCodePotd;
exports.fetchGfgPotd = fetchGfgPotd;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const GfgPotdMap_1 = __importDefault(require("../models/GfgPotdMap"));
async function fetchLeetCodePotd() {
    const url = "https://leetcode.com/graphql";
    const payload = {
        query: `
      query questionOfToday{
        activeDailyCodingChallengeQuestion {
          date
          link
          question { title titleSlug }
        }
      }
    `
    };
    const res = await axios_1.default.post(url, payload, { headers: {
            "Content-Type": "application/json",
            "Origin": "https://leetcode.com",
            "Referer": "https://leetcode.com"
        },
        validateStatus: () => true
    });
    const q = res.data?.data?.activeDailyCodingChallengeQuestion?.question;
    if (!q)
        throw new Error("LeetCode POTD not found");
    return { title: q.title, slug: q.titleSlug };
}
async function fetchGfgPotd() {
    const pages = [
        "https://www.geeksforgeeks.org/problem-of-the-day/",
        "https://www.geeksforgeeks.org/tag/potd/",
        "https://www.geeksforgeeks.org/"
    ];
    for (const p of pages) {
        try {
            const html = await axios_1.default.get(p, {
                headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" },
                timeout: 15000, validateStatus: () => true
            });
            const $ = cheerio.load(html.data);
            const candidates = [];
            $("a,button").each((_i, el) => {
                const text = ($(el).text() || "").trim();
                const href = $(el).attr("href") || "";
                if (!href)
                    return;
                if (/problem of the day|potd/i.test(text))
                    candidates.push(href);
            });
            $("a[href]").each((_i, el) => {
                const href = $(el).attr("href") || "";
                if (/geeksforgeeks\.org\/[^/]+\/?$/.test(href) || /geeksforgeeks\.org\/problems\/[^/]+\/?/.test(href)) {
                    candidates.push(href);
                }
            });
            const rx = /(https?:\/\/www\.geeksforgeeks\.org\/(?:problems\/)?[a-z0-9\-]+\/)/i;
            const m = html.data.match(rx);
            if (m)
                candidates.push(m[1]);
            const first = candidates.find((h) => /geeksforgeeks\.org/i.test(h));
            if (first) {
                const u = new URL(first, "https://www.geeksforgeeks.org/");
                const parts = u.pathname.split("/").filter(Boolean);
                const slug = parts[parts.length - 1];
                let title = "GFG POTD";
                try {
                    const probHtml = await axios_1.default.get(u.toString(), { timeout: 15000, validateStatus: () => true });
                    const $p = cheerio.load(probHtml.data);
                    const h1 = $p("h1, h2").first().text().trim();
                    if (h1)
                        title = h1.replace(/\s*-\s*GeeksforGeeks\s*$/, "");
                    const innerLinks = [];
                    $p("a[href]").each((_i, el) => {
                        const href = ($p(el).attr("href") || "").toString();
                        if (!href)
                            return;
                        if (/\/problems\/[a-z0-9\-]+\//i.test(href) || /\/practice\/[a-z0-9\-]+\//i.test(href) || /geeksforgeeks\.org\/problems\/[a-z0-9\-]+\//i.test(href)) {
                            innerLinks.push(href);
                        }
                    });
                    if (innerLinks.length) {
                        const chosen = String(innerLinks[0]);
                        const uu = new URL(chosen, u.toString());
                        const pparts = uu.pathname.split("/").filter(Boolean);
                        const probSlug = pparts[pparts.length - 1];
                        if (probSlug)
                            return { title: title || "GFG POTD", slug: probSlug };
                    }
                }
                catch (e) {
                    // ignore
                }
                if (slug) {
                    try {
                        const existing = await GfgPotdMap_1.default.findOne({ articleSlug: slug }).exec();
                        if (existing && existing.problemSlug) {
                            return { title: existing.title || title, slug: existing.problemSlug };
                        }
                    }
                    catch (err) {
                    }
                    return { title, slug };
                }
            }
        }
        catch { }
    }
    throw new Error("GFG POTD not found");
}
//# sourceMappingURL=potdSources.js.map