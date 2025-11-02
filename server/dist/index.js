"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const auth_1 = __importDefault(require("./routes/auth"));
const submit_1 = __importDefault(require("./routes/submit"));
const user_1 = __importDefault(require("./routes/user"));
const potd_1 = __importDefault(require("./routes/potd"));
const potd_admin_1 = __importDefault(require("./routes/potd-admin"));
const potdJob_1 = require("./jobs/potdJob");
(async () => {
    // ------------------ MongoDB Connection ------------------
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not set in env");
        process.exit(1);
    }
    await mongoose_1.default.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
        keepAliveInitialDelay: 300000,
    });
    console.log("✅ MongoDB connected");
    // ------------------ Express App ------------------
    const app = (0, express_1.default)();
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
    ].filter(Boolean);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // allow same-origin / server-to-server (no Origin header)
            if (!origin ||
                allowedOrigins.includes(origin) ||
                origin.startsWith("chrome-extension://")) {
                return callback(null, true);
            }
            return callback(new Error(`Not allowed by CORS: ${origin}`));
        },
        credentials: true, // allow cookies/credentials
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.urlencoded({ extended: false }));
    const useSecure = process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
    const sameSite = (process.env.NODE_ENV === "production"
        ? "none"
        : process.env.COOKIE_SAMESITE || "lax");
    const sessionSecret = process.env.SESSION_SECRET || "change_me";
    if (sessionSecret === "change_me") {
        console.warn("⚠️  Using default SESSION_SECRET. Set SESSION_SECRET in production.");
    }
    app.use((0, express_session_1.default)({
        name: "sid",
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: connect_mongo_1.default.create({
            mongoUrl: MONGO_URI,
            ttl: 60 * 60 * 24 * 30, // 30 days
        }),
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
            sameSite, // 'none' in prod
            secure: useSecure, // true in prod
            path: "/",
            partitioned: true,
        },
    }));
    app.use((req, _res, next) => {
        if (process.env.LOG_COOKIES === "true") {
            console.log("Origin:", req.headers.origin);
            console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);
            console.log("Cookie header:", req.headers.cookie);
            // @ts-ignore
            console.log("Session userId:", req.session?.userId);
        }
        next();
    });
    app.get("/health", (_req, res) => res.json({ ok: true }));
    app.get("/_healthz", (_req, res) => res.send("ok"));
    app.use("/auth", auth_1.default);
    app.use("/submit", submit_1.default);
    app.use("/user", user_1.default);
    app.use("/potd", potd_1.default);
    app.use("/potd/admin", potd_admin_1.default);
    // Root
    app.get("/", (_req, res) => res.json({ message: "server is up!!" }));
    // 404
    app.use((_req, res) => res.status(404).json({ error: "Not found" }));
    // Central error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error("Unhandled error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    });
    // ------------------ Jobs / Server ------------------
    (0, potdJob_1.schedulePotdJob)();
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
    });
})();
//# sourceMappingURL=index.js.map