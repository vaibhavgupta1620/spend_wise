// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns").promises;
const path = require("path");
const process = require("process");

const app = express();

/* ------------------------------------------------------------------
   BASIC CONFIG
------------------------------------------------------------------ */

const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || "development";

/* ------------------------------------------------------------------
   CORS CONFIG (SAFE FOR RENDER + LOCAL)
------------------------------------------------------------------ */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://spend-wise-kjuq.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, curl, Postman
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

app.options("*", cors());

console.log("[server] CORS allowed origins:", ALLOWED_ORIGINS);

/* ------------------------------------------------------------------
   MIDDLEWARE
------------------------------------------------------------------ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

/* ------------------------------------------------------------------
   ROUTES
------------------------------------------------------------------ */

const groupsRouter = require("./routes/groups");
const groupMembersRouter = require("./routes/groupMembers");
const approvalRulesRouter = require("./routes/approvalRules");

const expensesRouter = require("./routes/expenses");
const expenseApprovalsRouter = require("./routes/expenseApprovals");

const tripsRouter = require("./routes/trips");
const tripMembersRouter = require("./routes/tripMembers");
const tripExpensesRouter = require("./routes/tripExpenses");
const tripSettlementsRouter = require("./routes/tripSettlements");

const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");

/* ------------------------------------------------------------------
   OPTIONAL ADMIN / AUTH POPULATE
------------------------------------------------------------------ */

let populateUserFromJwt = null;
let adminRouter = null;

try {
  populateUserFromJwt = require("./middleware/auth-populate");
  adminRouter = require("./routes/admin");
  console.log("[server] admin & auth-populate loaded");
} catch (err) {
  console.warn("[server] admin/auth-populate not enabled");
}

/* ------------------------------------------------------------------
   MONGODB DNS SRV CHECK (ATLAS)
------------------------------------------------------------------ */

async function checkSrvIfNeeded(uri) {
  if (!uri || !uri.startsWith("mongodb+srv://")) return true;

  try {
    let host = uri.split("@")[1].split("/")[0].split("?")[0];
    console.log("Detected SRV host:", host);

    const records = await dns.resolveSrv(host);
    console.log(
      "SRV records:",
      records.map(r => `${r.name}:${r.port}`).join(", ")
    );

    return true;
  } catch (err) {
    console.error("❌ SRV DNS resolution failed:", err.message);
    return false;
  }
}

/* ------------------------------------------------------------------
   MONGODB CONNECTION
------------------------------------------------------------------ */

async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  if (uri.startsWith("mongodb+srv://")) {
    const srvOk = await checkSrvIfNeeded(uri);
    if (!srvOk) throw new Error("MongoDB SRV lookup failed");
  }

  console.log("Connecting to MongoDB...");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  console.log("✅ MongoDB connected");

  mongoose.connection.on("error", err => {
    console.error("MongoDB runtime error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
}

/* ------------------------------------------------------------------
   API ROUTE MOUNTING
------------------------------------------------------------------ */

app.use("/api/groups", groupsRouter);
app.use("/api/groups", groupMembersRouter);
app.use("/api/groups", approvalRulesRouter);

app.use("/api/expenses", expensesRouter);
app.use("/api/expense-approvals", expenseApprovalsRouter);

app.use("/api/trips", tripsRouter);
app.use("/api/trips", tripMembersRouter);
app.use("/api/trips", tripExpensesRouter);
app.use("/api/trips", tripSettlementsRouter);

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);

if (populateUserFromJwt) {
  app.use(populateUserFromJwt);
}

if (adminRouter) {
  app.use("/api/admin", adminRouter);
}

/* ------------------------------------------------------------------
   STATIC FILES (UPLOADS)
------------------------------------------------------------------ */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ------------------------------------------------------------------
   SERVE FRONTEND (VITE BUILD)
------------------------------------------------------------------ */

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* ------------------------------------------------------------------
   HEALTH CHECKS
------------------------------------------------------------------ */

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", env: NODE_ENV });
});

app.get("/api/readiness", (req, res) => {
  res.json({
    mongoReady: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState
  });
});

/* ------------------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------------------ */

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);

  if (err.message.includes("Not allowed by CORS")) {
    return res.status(403).json({ message: "CORS origin not allowed" });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

/* ------------------------------------------------------------------
   START SERVER
------------------------------------------------------------------ */

let server;

async function start() {
  try {
    await connectMongo();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();

/* ------------------------------------------------------------------
   GRACEFUL SHUTDOWN
------------------------------------------------------------------ */

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down...`);

  try {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log("HTTP server closed");
    }

    await mongoose.connection.close(false);
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
