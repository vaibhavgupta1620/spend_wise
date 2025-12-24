// backend/models/Trip.js
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    name: { type: String, required: true },
    destination: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'active' }, // 'active', 'archived', etc.
}, { timestamps: true });

// After creating a trip, ensure the creator is added as admin member.
// We use post('save') but only act when document is newly created.
TripSchema.post('save', async function (doc, next) {
    try {
        if (!doc) return next();
        const TripMember = mongoose.model('TripMember');
        // upsert admin membership
        await TripMember.updateOne(
            { tripId: doc._id, userId: doc.createdBy },
            { $setOnInsert: { tripId: doc._id, userId: doc.createdBy, role: 'admin', joinedAt: new Date() } },
            { upsert: true }
        );
        next();
    } catch (err) {
        console.error('Error auto-adding trip creator as admin:', err);
        next(err);
    }
});

module.exports = mongoose.model('Trip', TripSchema);
