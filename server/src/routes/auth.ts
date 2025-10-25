import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
// rate limiter
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimit = require('express-rate-limit');
const forgotLimiter = rateLimit({ windowMs: 1000 * 60 * 15, max: 6 }); // 6 req per 15 min
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

// POST /auth/forgot-password -> { ok: true }
r.post("/forgot-password", forgotLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const u = await User.findOne({ email });
  if (!u) return res.json({ ok: true }); // don't reveal existence

  // generate token
  const token = crypto.randomBytes(20).toString("hex");
  const expiry = Date.now() + 1000 * 60 * 60; // 1 hour
  // assign using a loose cast to avoid strict mongoose doc types
  (u as any).resetToken = token;
  (u as any).resetTokenExpiry = expiry;
  await u.save();

  // Try to send email if SMTP configured, otherwise return token for dev
  const smtpUrl = process.env.SMTP_URL || "";
  // dynamic import to avoid compile-time nodemailer type requirement
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require("nodemailer");
  try {
    if (smtpUrl) {
      const transporter = nodemailer.createTransport(smtpUrl);
      const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${token}`;
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || "no-reply@potd.local",
        to: email,
        subject: "Reset your POTD password",
        text: `Reset your password: ${resetUrl}`,
      });
      // if transporter supports preview URL (e.g., ethereal), include it
      const preview = (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) || undefined;
      return res.json({ ok: true, preview });
    } else {
      // create a test account and send via ethereal so devs get a preview URL
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${token}`;
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || "no-reply@potd.local",
        to: email,
        subject: "Reset your POTD password (dev)",
        text: `Reset your password: ${resetUrl}`,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      return res.json({ ok: true, preview });
    }
  } catch (e: any) {
    console.error("Failed to send reset email:", e?.message || e);
    // fallback to returning dev token if sending failed
    return res.json({ ok: true, devToken: token });
  }
});

// POST /auth/reset-password -> { ok: true }
r.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Token and new password required" });
  const u = await User.findOne({ resetToken: token }).exec();
  if (!u || !(u as any).resetTokenExpiry || (u as any).resetTokenExpiry < Date.now()) return res.status(400).json({ error: "Invalid or expired token" });
  u.passwordHash = await bcrypt.hash(password, 10);
  (u as any).resetToken = undefined;
  (u as any).resetTokenExpiry = 0;
  await u.save();
  return res.json({ ok: true });
});

// POST /auth/generate-token -> { ok: true, token }
// Accepts email+password and returns a generated api token for the user.
// This is useful for extensions that cannot rely on session cookies.
r.post("/generate-token", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });
  const u = await User.findOne({ email });
  if (!u) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.passwordHash || "");
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = crypto.randomBytes(24).toString('hex');
  (u as any).apiToken = token;
  await u.save();
  return res.json({ ok: true, token });
});
