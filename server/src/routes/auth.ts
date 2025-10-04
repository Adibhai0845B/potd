import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
const r = Router();
r.post("/register", async (req, res) => {
  const { email, password, username } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email in use" });
  const passwordHash = await bcrypt.hash(password, 10);
  const u = await User.create({ email, passwordHash, username });
  // @ts-ignore
  req.session.userId = String(u._id);
  res.json({ ok: true });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const u = await User.findOne({ email });
  if (!u) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.passwordHash || "");
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  // @ts-ignore
  req.session.userId = String(u._id);
  res.json({ ok: true });
});

r.post("/logout", (req, res) => {
  req.session?.destroy(() => res.json({ ok: true }));
});

export default r;
