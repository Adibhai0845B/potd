import { Router } from "express";
import { sessionRequired } from "../middleware/sessionAuth";
import User from "../models/User";
import Completion from "../models/Completion";
import { getTodayKey } from "../lib/date";

const r = Router();

r.get("/me", sessionRequired, async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId as string;
  const user = await User.findById(userId, "email username leetcodeUsername gfgUsername coins streak lastStreakDay").lean();
  const today = getTodayKey();
  const completions = await Completion.find({ userId, date: today }).lean();
  res.json({ user, today, completions });
});


// PATCH /user/profile - update LeetCode/GFG usernames
r.patch("/profile", sessionRequired, async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId as string;
  const { leetcodeUsername, gfgUsername } = req.body || {};
  if (!leetcodeUsername && !gfgUsername) {
    return res.status(400).json({ error: "No username provided" });
  }
  const update: any = {};
  if (typeof leetcodeUsername === "string") update.leetcodeUsername = leetcodeUsername.trim();
  if (typeof gfgUsername === "string") update.gfgUsername = gfgUsername.trim();
  const user = await User.findByIdAndUpdate(userId, update, { new: true, fields: "email username leetcodeUsername gfgUsername coins streak lastStreakDay" }).lean();
  res.json({ user });
});

export default r;
