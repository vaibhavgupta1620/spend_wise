// backend/models/TripSettlement.js
const mongoose = require('mongoose');

const TripSettlementSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'settled', 'cancelled'] },
    settledAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('TripSettlement', TripSettlementSchema);
