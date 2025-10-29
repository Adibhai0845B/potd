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
(async()=>{
  const MONGO_URI = process.env.MONGO_URI!;
  await mongoose.connect(MONGO_URI);
  const app = express();
  app.set('trust proxy', 1);
  // CORSforweb+extension
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://potd-opal.vercel.app",
    "https://potd-rfnh0tpxi-aditya-krishna-guptas-projects.vercel.app",
    process.env.CLIENT_ORIGIN,
    process.env.EXTENSION_ORIGIN,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  // For production on Render, set COOKIE_SECURE=true and COOKIE_SAMESITE=none
  // CLIENT_ORIGIN=https://potd-opal.vercel.app
  const useSecure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
  const sameSite = (process.env.NODE_ENV === "production" ? "none" : process.env.COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none";
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
        sameSite,
        secure: useSecure,
        domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
        path: "/",
      },
    })
  );
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth",authRoutes);
  app.use("/submit",submitRoutes);
  app.use("/user",userRoutes);
  app.use("/potd",potdRoutes);
  app.use("/potd/admin",potdAdmin);
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  schedulePotdJob();
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`Server on http://localhost:${port}`));
})();
