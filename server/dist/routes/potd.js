"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Potd_1 = __importDefault(require("../models/Potd"));
const date_1 = require("../lib/date");
const potdJob_1 = require("../jobs/potdJob");
const r = (0, express_1.Router)();
r.get("/today", async (_req, res) => {
    const date = (0, date_1.getTodayKey)();
    let doc = await Potd_1.default.findOne({ date }).lean();
    if (!doc || (!doc.leetcode && !doc.gfg)) {
        try {
            console.log(`[POTD] /today endpoint: missing or partial for ${date}, forcing refresh...`);
            await (0, potdJob_1.refreshPotdOnce)();
            doc = await Potd_1.default.findOne({ date }).lean();
        }
        catch (e) {
            console.error(`[POTD] /today endpoint error:`, e?.message || e);
            return res.status(404).json({ error: e?.message || "POTD not ready" });
        }
    }
    if (!doc) {
        console.error(`[POTD] /today endpoint: still missing after refresh for ${date}`);
        return res.status(404).json({ error: "POTD not ready" });
    }
    res.json({ date, leetcode: doc.leetcode, gfg: doc.gfg });
});
exports.default = r;
//# sourceMappingURL=potd.js.map