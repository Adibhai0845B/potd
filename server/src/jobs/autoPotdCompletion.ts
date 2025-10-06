import cron from "node-cron";
import User from "../models/User";
import Potd from "../models/Potd";
import Completion from "../models/Completion";
import { getTodayKey, normalizeSlug } from "../lib/date";
import { fetchLeetCodeSubmissions } from "../services/leetcodeSubmissions";
import { fetchGfgSubmissions } from "../services/gfgSubmissions";

export async function checkAndAwardPotdCompletions() {
  const date = getTodayKey();
  const potd = await Potd.findOne({ date }).lean();
  if (!potd) return; // No POTD for today

  const users = await User.find({}).lean();

  for (const user of users) {
    // Track platforms where user actually solved today's POTD
    const solvedPlatforms: Array<"leetcode" | "gfg"> = [];

    // ----- LeetCode -----
    if (
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

      if (found) solvedPlatforms.push("leetcode");
    }

    // ----- GFG -----
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

      if (found) solvedPlatforms.push("gfg");
    }

    // ----- Insert Completions only for solved platforms -----
    for (const site of solvedPlatforms) {
      const problem =
        site === "leetcode" ? potd.leetcode : site === "gfg" ? potd.gfg : null;
      if (!problem) continue;

      await Completion.updateOne(
        { userId: user._id, date, site },
        {
          $setOnInsert: {
            userId: user._id,
            date,
            site,
            problemSlug: problem.slug,
            problemTitle: problem.title,
            awarded: false,
          },
        },
        { upsert: true }
      );
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
