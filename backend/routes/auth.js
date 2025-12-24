// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || 'Vaibhav_guptaproject_forexpense';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Helper: create JWT token for a user
 * Payload includes: { id, email }
 */
function signToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: "email and password required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // include passwordHash in result
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+passwordHash"
        );

        // If user not found OR passwordHash missing -> invalid credentials
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken(user);

        // Build safe user object (no passwordHash)
        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl || "",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return res.json({
            token,
            user: safeUser,
        });
    } catch (err) {
        console.error("[auth.login] error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/**
 * OPTIONAL: POST /api/auth/reset-password
 * Body: { email, newPassword }
 * (ignores code; works with your current frontend flow where backend reset is "best effort")
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPassword } = req.body || {};

        if (!email || !newPassword) {
            return res
                .status(400)
                .json({ message: "email and newPassword required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (newPassword.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters long" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        await user.save();

        return res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error("[auth.reset-password] error:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
