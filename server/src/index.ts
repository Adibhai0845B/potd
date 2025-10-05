import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import authRoutes from "./routes/auth";
import submitRoutes from "./routes/submit";
import userRoutes from "./routes/user";
import potdRoutes from "./routes/potd";
import potdAdmin from "./routes/potd-admin";
import { schedulePotdJob } from "./jobs/potdJob";

(async () => {
  const MONGO_URI = process.env.MONGO_URI!;
  await mongoose.connect(MONGO_URI);

  const app = express();

  const CLIENT_WEB = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const EXTENSION_ORIGIN = process.env.EXTENSION_ORIGIN || ""; // "chrome-extension://<id>"

  // CORS for web + extension
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin.startsWith("chrome-extension://")) return cb(null, true);
        const allowed = [CLIENT_WEB];
        if (EXTENSION_ORIGIN) allowed.push(EXTENSION_ORIGIN);
        if (allowed.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json());

  const useSecure = (process.env.COOKIE_SECURE || "false") === "true";
  const sameSite = (process.env.COOKIE_SAMESITE || "none") as "lax" | "strict" | "none";
  app.use("/potd/admin", potdAdmin);
  app.use(
    session({
      name: "sid",
      secret: process.env.SESSION_SECRET || "change_me",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: MONGO_URI, ttl: 60 * 60 * 24 * 30 }),
      cookie: {
        httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
       sameSite,       // "none" for extension background requests
        secure: useSecure,
      },
    })
  );
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRoutes);
  app.use("/submit", submitRoutes);
  app.use("/user", userRoutes);
  app.use("/potd", potdRoutes);
  app.use("/potd/admin", potdAdmin);
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  schedulePotdJob();
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`Server on http://localhost:${port}`));
})();
