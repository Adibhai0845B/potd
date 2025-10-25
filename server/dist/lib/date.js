"use strict";
// IST-aware date helpers and slug normalization
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayKey = getTodayKey;
exports.getYesterdayKey = getYesterdayKey;
exports.normalizeSlug = normalizeSlug;
function getTodayKey(timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata", at = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(at);
    const y = parts.find(p => p.type === "year")?.value || "1970";
    const m = parts.find(p => p.type === "month")?.value || "01";
    const d = parts.find(p => p.type === "day")?.value || "01";
    return `${y}-${m}-${d}`;
}
function getYesterdayKey(timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata", at = new Date()) {
    const d = new Date(at);
    d.setDate(d.getDate() - 1);
    return getTodayKey(timeZone, d);
}
function normalizeSlug(site, slug) {
    if (!slug)
        return slug;
    let s = slug.toLowerCase().trim();
    s = s.replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (site === "gfg") {
        // GFG can appear as /problems/<slug>/<id> or /<slug>/
        // trim numeric id segments and common suffix noise
        s = s.replace(/\/\d+$/, "");
        s = s.replace(/-geeksforgeeks$/, "");
    }
    return s;
}
//# sourceMappingURL=date.js.map