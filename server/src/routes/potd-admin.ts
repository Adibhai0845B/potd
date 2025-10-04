import { Router } from "express";
import { refreshPotdOnce } from "../jobs/potdJob";

const r = Router();
r.post("/refresh", async (_req, res) => {
  try {
    const data = await refreshPotdOnce();
    res.json({ ok: true, ...data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Failed" });
  }
});
export default r;
