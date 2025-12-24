// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://spend-wise-kjuq.onrender.com"
    ],
    credentials: true
  })
);

/* =======================
   MONGODB CONNECTION
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

/* =======================
   API ROUTES
======================= */
// Example
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "SpendWise API running" });
});

// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/expense", require("./routes/expenseRoutes"));

/* =======================
   SERVE FRONTEND (VITE)
======================= */
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
