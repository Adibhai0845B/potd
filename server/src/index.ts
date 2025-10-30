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

// --- Type augmentation to allow CHIPS / partitioned cookies in TS ---
declare module "express-session" {
  interface CookieOptions {
    // Chrome's CHIPS flag; supported in express-session >= 1.18
    partitioned?: boolean;
  }
}

(async () => {
  // ------------------ MongoDB Connection ------------------
  const MONGO_URI = process.env.MONGO_URI!;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set in env");
    process.exit(1);
}
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    keepAliveInitialDelay: 300000,
  } as any);
  console.log("✅ MongoDB connected");

  // ------------------ Express App ------------------
  const app = express();

  // Render/Vercel behind proxy (needed so secure cookies are set)
  app.set("trust proxy", 1);

  // ------------------ CORS ------------------
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://potd-opal.vercel.app",
    "https://potd-rfnh0tpxi-aditya-krishna-guptas-projects.vercel.app",
    process.env.CLIENT_ORIGIN,
    process.env.EXTENSION_ORIGIN,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow same-origin / server-to-server (no Origin header)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.startsWith("chrome-extension://")
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true, // allow cookies/credentials
    })
  );

  // ------------------ Body Parsers ------------------
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // ------------------ Sessions ------------------
  // For cross-site (vercel.app -> onrender.com) you need:
  //   SameSite=None, Secure=true, CHIPS Partitioned=true, and NO over-scoped domain.
  const useSecure =
    process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

  const sameSite = (process.env.NODE_ENV === "production"
    ? "none"
    : (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none") || "lax") as
    | "lax"
    | "strict"
    | "none";

  const sessionSecret = process.env.SESSION_SECRET || "change_me";
  if (sessionSecret === "change_me") {
    console.warn(
      "⚠️  Using default SESSION_SECRET. Set SESSION_SECRET in production."
    );
  }

  app.use(
    session({
      name: "sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 60 * 60 * 24 * 30, // 30 days
      }),
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        sameSite, // 'none' in prod
        secure: useSecure, // true in prod
        path: "/",
        // ❗ Do NOT set 'domain' for cross-site CHIPS; keep host-only cookie
        // domain: undefined,
        // ✅ CHIPS for third-party cookies (Chrome/Safari 2025)
        partitioned: true,
      },
    })
  );

  // ------------------ Debug / Diagnostics (optional) ------------------
  app.use((req, _res, next) => {
    // Helpful when diagnosing 401s in prod
    if (process.env.LOG_COOKIES === "true") {
      console.log("Origin:", req.headers.origin);
      console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);
      console.log("Cookie header:", req.headers.cookie);
      // @ts-ignore
      console.log("Session userId:", req.session?.userId);
    }
    next();
  });

  // Simple health checks
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/_healthz", (_req, res) => res.send("ok"));

  // ------------------ Routes ------------------
  app.use("/auth", authRoutes);
  app.use("/submit", submitRoutes);
  app.use("/user", userRoutes);
  app.use("/potd", potdRoutes);
  app.use("/potd/admin", potdAdmin);

  // Root
  app.get("/", (_req, res) => res.json({ message: "server is up!!" }));

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // Central error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // ------------------ Jobs / Server ------------------
  schedulePotdJob();

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
})();
