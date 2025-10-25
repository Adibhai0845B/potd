import { Router } from "express";
import Potd from "../models/Potd";
import { getTodayKey } from "../lib/date";
import { refreshPotdOnce } from "../jobs/potdJob";
const r = Router();
r.get("/today", async (_req, res) => {
  const date = getTodayKey();
  let doc = await Potd.findOne({ date }).lean();
  if (!doc || (!doc.leetcode && !doc.gfg)) {
    try {
      console.log(`[POTD] /today endpoint: missing or partial for ${date}, forcing refresh...`);
      await refreshPotdOnce();
      doc = await Potd.findOne({ date }).lean();
    } catch (e: any) {
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
export default r;
