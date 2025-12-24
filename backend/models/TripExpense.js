// backend/models/TripExpense.js
const mongoose = require('mongoose');

const TripExpenseSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    amount: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, default: '' },
    paymentMode: { type: String, default: '' },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: '' },
    splitType: { type: String, default: 'equal' }, // 'equal', 'custom', ...
    splitData: { type: mongoose.Schema.Types.Mixed, default: {} }, // store JSON-like split
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
}, { timestamps: true });

// After saving an expense, recompute trip.totalSpent
TripExpenseSchema.post('save', async function (doc, next) {
    try {
        const Trip = mongoose.model('Trip');
        // sum amounts for trip where status != 'rejected'
        const agg = await mongoose.model('TripExpense').aggregate([
            { $match: { tripId: doc.tripId, status: { $ne: 'rejected' } } },
            { $group: { _id: '$tripId', total: { $sum: '$amount' } } }
        ]);
        const total = (agg[0] && agg[0].total) || 0;
        await Trip.findByIdAndUpdate(doc.tripId, { totalSpent: total });
        next();
    } catch (err) {
        console.error('Error updating trip totalSpent after expense save:', err);
        next(err);
    }
});

// When an expense is removed, also recompute.
TripExpenseSchema.post('remove', async function (doc, next) {
    try {
        const Trip = mongoose.model('Trip');
        const agg = await mongoose.model('TripExpense').aggregate([
            { $match: { tripId: doc.tripId, status: { $ne: 'rejected' } } },
            { $group: { _id: '$tripId', total: { $sum: '$amount' } } }
        ]);
        const total = (agg[0] && agg[0].total) || 0;
        await Trip.findByIdAndUpdate(doc.tripId, { totalSpent: total });
        next();
    } catch (err) {
        console.error('Error updating trip totalSpent after expense removal:', err);
        next(err);
    }
});

module.exports = mongoose.model('TripExpense', TripExpenseSchema);
