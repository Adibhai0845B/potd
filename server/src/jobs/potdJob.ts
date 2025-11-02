import cron from "node-cron";
import Potd from "../models/Potd";
import { getTodayKey } from "../lib/date";
import { fetchLeetCodePotd, fetchGfgPotd } from "../services/potdSources";
export async function refreshPotdOnce() {
  const date=getTodayKey();
  const results:{
    leetcode?:{ title: string; slug: string };
    gfg?: { title: string; slug: string };
  } = {};

  await Promise.allSettled([
    (async () => {
      try {
        results.leetcode = await fetchLeetCodePotd();
      } catch (e) {
        console.warn("[POTD] LeetCode fetch failed:", (e as any)?.message || e);
      }
    })(),
    (async()=>{
      try{
        results.gfg = await fetchGfgPotd();
      } catch (e) {
        console.warn("[POTD] GFG fetch failed:", (e as any)?.message || e);
      }
  })(),
  ]);
  if (!results.leetcode && !results.gfg) {
    throw new Error("No POTD sources fetched");
  }
  await Potd.updateOne(
  {date},
    {$set:{ date, ...results } },
    { upsert: true }
  );

  return { date, ...results };
}

/**
 * Schedule: Every day at 05:00 AM IST
 * Cron string is "0 5 * * *" and we pin timezone to Asia/Kolkata.
 */
export function schedulePotdJob() {
  const tz = process.env.APP_TIMEZONE || "Asia/Kolkata";

  cron.schedule(
    "0 5 * * *", // minute hour dom mon dow
    async () => {
      try {
        const r = await refreshPotdOnce();
        console.log("[POTD] Stored @ 05:00", tz, "->", r);
      } catch (e: any) {
        console.error("[POTD] refresh failed:", e?.message || e);
      }
    },
    { timezone: tz }
  );

  console.log(`[POTD] Daily job scheduled at 05:00 ${tz}`);
}
