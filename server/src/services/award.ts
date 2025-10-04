import Completion from "../models/Completion";
import User from "../models/User";
import Potd from "../models/Potd";
import { getTodayKey } from "../lib/date";

export async function recordCompletionAndAward(
  userId: string,
  site: "leetcode" | "gfg",
  problem: { title: string; slug: string }
) {
  const date = getTodayKey();
  const potd = await Potd.findOne({ date }).lean();
  if (!potd || !potd[site]) throw new Error("POTD not ready");

  const todaysSlug = potd[site]!.slug;
  if (todaysSlug !== problem.slug) throw new Error("Not the POTD");

  const created = await Completion.findOneAndUpdate(
    { userId, date, site },
    {
      $setOnInsert: {
        userId,
        date,
        site,
        problemSlug: problem.slug,
        problemTitle: problem.title || "",
        awarded: false,
      },
    },
    { upsert: true, new: true }
  );

  if (!created.awarded) {
    const u = await User.findById(userId);
    if (!u) throw new Error("User not found");

    // 👇 Fix starts here
    const yesterdayDate = new Date(date);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getTodayKey(); // use your IST-aware date util
    // 👆 we call getTodayKey() directly to get string key for "yesterday" date

    const continueStreak = u.lastStreakDay === yesterday;
    u.streak = continueStreak ? u.streak + 1 : 1;
    u.lastStreakDay = date;
    const coins = 10;
    u.coins += coins;
    await u.save();

    created.awarded = true;
    await created.save();

    return { ok: true, coinsAdded: coins, streak: u.streak };
  }

  return { ok: true, coinsAdded: 0, streak: undefined, message: "Already awarded" };
}
