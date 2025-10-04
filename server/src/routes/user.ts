import { Router } from "express";
import { sessionRequired } from "../middleware/sessionAuth";
import User from "../models/User";
import Completion from "../models/Completion";
import { getTodayKey } from "../lib/date";

const r = Router();

r.get("/me", sessionRequired, async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId as string;
  const user = await User.findById(userId, "email username coins streak lastStreakDay").lean();
  const today = getTodayKey();
  const completions = await Completion.find({ userId, date: today }).lean();
  res.json({ user, today, completions });
});

export default r;
