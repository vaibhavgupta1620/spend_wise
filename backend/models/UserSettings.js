// backend/models/UserSettings.js
const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  monthlyIncome: { type: Number, default: 0 },
  // add other settings here if necessary
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
