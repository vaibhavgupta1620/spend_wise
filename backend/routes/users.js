// backend/routes/users.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const User = require("../models/User");
const UserSettings = require("../models/UserSettings");
const { requireAuth } = require("../utils/authHelpers");

const SALT_ROUNDS = 10;

// Read ADMIN_EMAIL from env; if set, registering that email will auto-assign role 'admin'
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

// ---------- Avatar upload setup ----------

// Ensure uploads/avatars directory exists
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    // If req.user is present (avatar update), use user id; otherwise use timestamp
    const idPart = req.user && req.user.id ? req.user.id : "anon";
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${idPart}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Helper to strip sensitive fields and keep role/active
const makeSafeUser = (userDoc) => {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  // remove passwordHash if present
  const { passwordHash, __v, ...rest } = obj;
  // ensure role/active defaults
  rest.role = rest.role || "user";
  rest.active = typeof rest.active === "boolean" ? rest.active : true;
  return rest;
};

// ---------- POST /api/users/register ----------
// If ADMIN_EMAIL env var is set and matches the registering email, that user will get role 'admin'
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Determine role based on ADMIN_EMAIL env
    const isAdminEmail = ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL;
    const role = isAdminEmail ? "admin" : "user";

    const user = await User.create({
      name: name || "",
      email: normalizedEmail,
      passwordHash,
      role,
      active: true,
    });

    // SAFE: will only insert settings if none exists yet
    await UserSettings.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, monthlyIncome: 0 } },
      { upsert: true, new: true }
    );

    const safeUser = makeSafeUser(user);

    return res.status(201).json({
      message: "User registered successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("[users.register] error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
});

// ---------- GET /api/users ----------
// Used by forgot-password flow: /api/users?email=...
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail }).select(
        "name email createdAt avatarUrl role active"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(makeSafeUser(user));
    }

    // If no email query, return list (for dev tools only)
    const users = await User.find().select("name email createdAt avatarUrl role active");
    return res.json(users.map((u) => makeSafeUser(u)));
  } catch (err) {
    console.error("[users.get] error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
});

// ---------- GET /api/users/me ----------
// Get current logged-in user
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: makeSafeUser(user) });
  } catch (err) {
    console.error("[users.me] error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
});

// ---------- POST /api/users/me/avatar ----------
// Upload and update avatar for current user
router.post(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const relativePath = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatarUrl: relativePath },
        { new: true }
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        message: "Avatar updated",
        user: makeSafeUser(user),
      });
    } catch (err) {
      console.error("[users.me.avatar] error:", err);
      return res
        .status(500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

module.exports = router;
