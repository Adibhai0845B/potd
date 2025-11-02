import { Router } from "express";
import { sessionRequired } from "../middleware/sessionAuth";
import User from "../models/User";
import Completion from "../models/Completion";
import { getTodayKey } from "../lib/date";
const r=Router();
r.get("/me",sessionRequired,async(req,res)=>{
  //@ts-ignore
  const userId=req.session.userId as string;
  const user=await User.findById(userId, "email username leetcodeUsername gfgUsername coins streak lastStreakDay").lean();
  const today=getTodayKey();
  const completions=await Completion.find({ userId, date: today }).lean();
  res.json({ user, today, completions });
});
//PATCH /user/profile-update LeetCode/GFG usernames
r.patch("/profile",sessionRequired,async (req, res) => {
// @ts-ignore
  const userId = req.session.userId as string;
  const { leetcodeUsername, gfgUsername } = req.body || {};
  if (!leetcodeUsername && !gfgUsername) {
    return res.status(400).json({ error: "No username provided" });
  }
  // Check if user has any completions with current usernames
  const currentUser = await User.findById(userId).lean();
  if (!currentUser) return res.status(404).json({ error: "User not found" });
  const update: any = {};
  if (typeof leetcodeUsername === "string"){
    const newLeetUsername = leetcodeUsername.trim();
    if (currentUser.leetcodeUsername && currentUser.leetcodeUsername !== newLeetUsername) {
      // Check if there are any completions with the current leetcode username
      const hasCompletions = await Completion.findOne({ userId, site: "leetcode", platformUsername: currentUser.leetcodeUsername }).lean();
      if (hasCompletions) {
        return res.status(400).json({ error: "Cannot change LeetCode username after earning points with it" });
      }
    }
    // Validate the new username exists
    const { validateLeetCodeUsername } = await import("../services/validateUsernames");
    const exists = await validateLeetCodeUsername(newLeetUsername);
    if (!exists) {
      return res.status(400).json({ error: "LeetCode username does not exist" });
    }
    update.leetcodeUsername = newLeetUsername;
  }
  if (typeof gfgUsername === "string") {
    const newGfgUsername = gfgUsername.trim();
    if (currentUser.gfgUsername && currentUser.gfgUsername !== newGfgUsername) {
      // Check if there are any completions with the current gfg username
      const hasCompletions = await Completion.findOne({ userId, site: "gfg", platformUsername: currentUser.gfgUsername }).lean();
      if (hasCompletions) {
        return res.status(400).json({ error: "Cannot change GFG username after earning points with it" });
      }
    }
    // Validate the new username exists
    const { validateGfgUsername } = await import("../services/validateUsernames");
    const exists = await validateGfgUsername(newGfgUsername);
    if (!exists) {
      return res.status(400).json({ error: "GFG username does not exist" });
    }
    update.gfgUsername = newGfgUsername;
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true, fields: "email username leetcodeUsername gfgUsername coins streak lastStreakDay" }).lean();
  res.json({ user });
});

r.post("/validate-username", sessionRequired, async (req, res) => {
  const { site, username } = req.body || {};
  if (!site || !username || typeof username !== "string") {
    return res.status(400).json({ error: "Site and username required" });
  }
  const user = username.trim();
  if (!user) return res.json({ exists: false });
  try {
    const { validateLeetCodeUsername, validateGfgUsername } = await import("../services/validateUsernames");
    let exists = false;
    if (site === "leetcode") {
      exists = await validateLeetCodeUsername(user);
    } else if (site === "gfg") {
      exists = await validateGfgUsername(user);
    } else {
      return res.status(400).json({ error: "Invalid site" });
    }
    res.json({ exists });
  } catch (e: any) {
    console.error("Validation error", e);
    res.status(500).json({ error: "Validation failed" });
  }
});

export default r;
