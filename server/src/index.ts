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

  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  }));
  app.use(express.json());

  app.use(session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI, ttl: 60 * 60 * 24 * 30 }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30
      // prod HTTPS: sameSite:"none", secure:true
    }
  }));

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
