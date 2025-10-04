import cron from "node-cron";
import Potd from "../models/Potd";
import { getTodayKey } from "../lib/date";
import { fetchLeetCodePotd, fetchGfgPotd } from "../services/potdSources";

export async function refreshPotdOnce() {
  const date = getTodayKey();
  const results: { leetcode?: { title: string; slug: string }; gfg?: { title: string; slug: string } } = {};

  await Promise.allSettled([
    (async () => { results.leetcode = await fetchLeetCodePotd(); })(),
    (async () => { results.gfg = await fetchGfgPotd(); })(),
  ]);

  if (!results.leetcode && !results.gfg) throw new Error("No POTD sources fetched");

  await Potd.updateOne({ date }, { $set: { date, ...results } }, { upsert: true });
  return { date, ...results };
}

export function schedulePotdJob() {
  cron.schedule("5 0 * * *", async () => {
    try {
      const r = await refreshPotdOnce();
      console.log("[POTD] Stored:", r);
    } catch (e: any) {
      console.error("[POTD] refresh failed:", e?.message || e);
    }
  });
}
