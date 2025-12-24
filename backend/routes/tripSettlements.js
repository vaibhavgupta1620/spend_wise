// backend/routes/tripSettlements.js
const express = require('express');
const router = express.Router();
const TripSettlement = require('../models/TripSettlement');
const Trip = require('../models/Trip');
const { requireAuth, getMembershipInfo } = require('../utils/authHelpers');

// Create settlement (member only)
router.post('/:tripId/settlements', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isMember } = await getMembershipInfo(tripId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const { fromUser, toUser, amount } = req.body;
        // basic sanity checks
        if (!fromUser || !toUser || !amount) return res.status(400).json({ message: 'Missing fields' });

        const settlement = await TripSettlement.create({ tripId, fromUser, toUser, amount, status: 'pending' });
        res.status(201).json(settlement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// List settlements for a trip (member only)
router.get('/:tripId/settlements', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isMember } = await getMembershipInfo(tripId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const settlements = await TripSettlement.find({ tripId }).sort({ createdAt: -1 });
        res.json(settlements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settlement (from_user or to_user can update status)
router.put('/settlements/:id', requireAuth, async (req, res) => {
    try {
        const s = await TripSettlement.findById(req.params.id);
        if (!s) return res.status(404).json({ message: 'Not found' });
        if (!(String(s.fromUser) === String(req.user.id) || String(s.toUser) === String(req.user.id))) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Allow status update and settledAt
        const updates = req.body;
        if (updates.status === 'settled') updates.settledAt = updates.settledAt || new Date();

        const updated = await TripSettlement.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
