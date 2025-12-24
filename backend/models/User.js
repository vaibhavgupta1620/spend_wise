// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, index: true, unique: true, sparse: true },
  name: { type: String },
  providerId: { type: String, index: true, unique: true, sparse: true },
  // IMPORTANT: store hash here, not plain password
  passwordHash: { type: String, select: false },
  avatarUrl: {
    type: String,
    default: "",
  },

  // admin fields (new)
  role: { type: String, enum: ["user", "admin", "moderator"], default: "user", index: true },
  active: { type: Boolean, default: true, index: true },

}, { timestamps: true, collection: 'user' });

// Note: do NOT expose passwordHash by default (select: false above)
// If you need to load it, use .select('+passwordHash') explicitly.

module.exports = mongoose.model('User', UserSchema);
