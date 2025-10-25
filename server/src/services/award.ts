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
  // Exact match first
  if (todaysSlug !== submittedSlug) {
    // Allow more permissive matching for GFG because their URL/slug patterns
    // sometimes include extra segments or slightly different forms.
    if (site === "gfg") {
      const a = todaysSlug || "";
      const b = submittedSlug || "";
      const permissive = a.includes(b) || b.includes(a) || a.endsWith(b) || b.endsWith(a);
      if (!permissive) {
        console.warn(`[AWARD] GFG slug mismatch: expected='${todaysSlug}' submitted='${submittedSlug}'`);
        throw new Error(`Not the POTD (gfg): expected ${todaysSlug}, got ${submittedSlug}`);
      }
    } else {
      throw new Error(`Not the POTD (${site}): expected ${todaysSlug}, got ${submittedSlug}`);
    }
  }

  // Get the user's platform username
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");
  const platformUsername = site === "leetcode" ? user.leetcodeUsername : user.gfgUsername;
  if (!platformUsername) throw new Error(`No ${site} username set for user`);

  const created = await Completion.findOneAndUpdate(
    { userId, date, site },
    {
      $setOnInsert: {
        userId,
        date,
        site,
        problemSlug: submittedSlug,
        problemTitle: problem.title || "",
        platformUsername,
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
