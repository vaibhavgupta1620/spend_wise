// backend/models/TripMember.js
const mongoose = require('mongoose');

const TripMemberSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: 'participant', enum: ['admin', 'participant'] },
    joinedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// uniqueness like UNIQUE(trip_id, user_id)
TripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TripMember', TripMemberSchema);
