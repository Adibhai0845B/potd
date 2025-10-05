import Completion from "../models/Completion";
import User from "../models/User";
import Potd from "../models/Potd";
import { getTodayKey, getYesterdayKey, normalizeSlug } from "../lib/date";

export async function recordCompletionAndAward(
  userId: string,
  site: "leetcode" | "gfg",
  problem: { title: string; slug: string }
) {
  const date = getTodayKey();
  const potd = await Potd.findOne({ date }).lean();
  if (!potd || !potd[site] || !potd[site].slug) throw new Error("POTD not ready");
  const todaysSlug = normalizeSlug(site, potd[site].slug);
  const submittedSlug = normalizeSlug(site, problem.slug);
  if (todaysSlug !== submittedSlug) {
    throw new Error(`Not the POTD (${site}): expected ${todaysSlug}, got ${submittedSlug}`);
  }

  const created = await Completion.findOneAndUpdate(
    { userId, date, site },
    {
      $setOnInsert: {
        userId,
        date,
        site,
        problemSlug: submittedSlug,
        problemTitle: problem.title || "",
        awarded: false,
      },
    },
    { upsert: true, new: true }
  );

  if (!created.awarded) {
    const u = await User.findById(userId);
    if (!u) throw new Error("User not found");

    const yesterday = getYesterdayKey();
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
