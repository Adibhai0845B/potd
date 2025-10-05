import cron from "node-cron";
import User from "../models/User";
import Potd from "../models/Potd";
import Completion from "../models/Completion";
import { getTodayKey, normalizeSlug } from "../lib/date";
import axios from "axios";
import { fetchLeetCodeSubmissions } from "../services/leetcodeSubmissions";
import { fetchGfgSubmissions } from "../services/gfgSubmissions";

export async function checkAndAwardPotdCompletions() {
  const date = getTodayKey();
  const potd = await Potd.findOne({ date }).lean();
  if (!potd) return;
  const users = await User.find({}).lean();
  for (const user of users) {
    if(
      user.leetcodeUsername &&
      potd.leetcode &&
      typeof potd.leetcode.slug === "string" &&
      potd.leetcode.slug
    ) {
      const subs = await fetchLeetCodeSubmissions(user.leetcodeUsername);
      const potdSlug = normalizeSlug("leetcode", potd.leetcode.slug);
      const found = subs.find(
        (s: { slug: string; status: string }) =>
          typeof s.slug === "string" &&
          normalizeSlug("leetcode", s.slug) === potdSlug &&
          s.status === "Accepted"
      );
      if (found) {
        await Completion.updateOne(
          { userId: user._id, date, site: "leetcode" },
          { $setOnInsert: { userId: user._id, date, site: "leetcode", problemSlug: potd.leetcode.slug, problemTitle: potd.leetcode.title, awarded: false } },
          { upsert: true }
        );
        // TODO: Award coins/streak if not already awarded
      }
    }
    // GFG
    if (
      user.gfgUsername &&
      potd.gfg &&
      typeof potd.gfg.slug === "string" &&
      potd.gfg.slug
    ) {
      const subs = await fetchGfgSubmissions(user.gfgUsername);
      const potdSlug = normalizeSlug("gfg", potd.gfg.slug);
      const found = subs.find(
        (s: { slug: string; status: string }) =>
          typeof s.slug === "string" &&
          normalizeSlug("gfg", s.slug) === potdSlug &&
          s.status === "Accepted"
      );
      if (found) {
        await Completion.updateOne(
          { userId: user._id, date, site: "gfg" },
          { $setOnInsert: { userId: user._id, date, site: "gfg", problemSlug: potd.gfg.slug, problemTitle: potd.gfg.title, awarded: false } },
          { upsert: true }
        );
      }
    }
  }
}

// Schedule the job to run every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    await checkAndAwardPotdCompletions();
    console.log("[POTD] Automatic completion check ran.");
  } catch (e) {
    console.error("[POTD] Auto completion check failed:", e);
  }
});
