import { Router } from "express";
import { sessionRequired } from "../middleware/sessionAuth";
import { recordCompletionAndAward } from "../services/award";

const r = Router();

r.post("/", sessionRequired, async (req, res) => {
  const { site, problem } = (req.body ?? {}) as { site?: string; problem?: { title?: string; slug?: string } };
  if (!site || !["leetcode", "gfg"].includes(site) || !problem?.slug) {
    res.status(400).json({ error: "Invalid payload" }); return;
  }
  try {
    // @ts-ignore
    const userId = req.session.userId as string;
    const result = await recordCompletionAndAward(userId, site as "leetcode" | "gfg", {
      title: problem.title || "",
      slug: problem.slug!
    });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Error" });
  }
});

export default r;
