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
exports.fetchGfgSubmissions = fetchGfgSubmissions;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
async function fetchGfgSubmissions(username) {
    const user = (username || "").toString().trim();
    if (!user)
        return [];
    const url = `https://auth.geeksforgeeks.org/user/${user}/practice/`;
    const res = await axios_1.default.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
        validateStatus: () => true,
    });
    const html = res.data;
    // 1) Try to parse embedded __NEXT_DATA__ JSON (Next.js)
    try {
        const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
        if (m && m[1]) {
            const json = JSON.parse(m[1]);
            const userSubs = json?.props?.pageProps?.userSubmissionsInfo;
            if (userSubs && typeof userSubs === "object") {
                const submissions = [];
                for (const diffKey of Object.keys(userSubs)) {
                    const group = userSubs[diffKey] || {};
                    for (const id of Object.keys(group)) {
                        const item = group[id];
                        if (item && item.slug) {
                            submissions.push({ slug: item.slug, status: "Accepted" });
                        }
                    }
                }
                console.log(`[GFG] Parsed __NEXT_DATA__ for user=${user}, subs=${submissions.map(s => s.slug).join(",")}`);
                return submissions;
            }
        }
    }
    catch (e) {
        console.warn("[GFG] Failed to parse __NEXT_DATA__ JSON", e?.message || e);
    }
    // 2) Fallback: legacy table scraping
    const $ = cheerio.load(html);
    const submissions = [];
    $(".score_card_table tbody tr").each((_i, el) => {
        const tds = $(el).find("td");
        const status = $(tds[2]).text().trim();
        // some GFG pages may include a date column; try to extract it
        let ts;
        const dateText = $(tds[3]).text().trim();
        if (dateText) {
            const d = new Date(dateText);
            if (!isNaN(d.getTime()))
                ts = Math.floor(d.getTime() / 1000);
        }
        if (/accepted/i.test(status)) {
            const link = ($(tds[1]).find("a").attr("href") || "").toString();
            const patterns = [
                /problems\/([a-z0-9\-]+)\//i,
                /practice-problems\/([a-z0-9\-]+)\//i,
                /practice\/([a-z0-9\-]+)\//i,
                /(?:geeksforgeeks.org\/)?.*?\/([a-z0-9\-]+)\/?$/i,
            ];
            let slugFound = null;
            for (const p of patterns) {
                const mm = link.match(p);
                if (mm && mm[1]) {
                    slugFound = mm[1];
                    break;
                }
            }
            if (slugFound) {
                if (typeof ts === "number")
                    submissions.push({ slug: slugFound, status: "Accepted", timestamp: ts });
                else
                    submissions.push({ slug: slugFound, status: "Accepted" });
            }
        }
    });
    return submissions;
}
//# sourceMappingURL=gfgSubmissions.js.map