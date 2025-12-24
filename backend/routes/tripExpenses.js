// backend/routes/tripExpenses.js
const express = require('express');
const router = express.Router();
const TripExpense = require('../models/TripExpense');
const TripMember = require('../models/TripMember');
const Trip = require('../models/Trip');
const { requireAuth, getMembershipInfo, isUserAllowedOnExpense } = require('../utils/authHelpers');

// Create trip expense (must be trip member and paidBy must be the user)
router.post('/:tripId/expenses', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isMember } = await getMembershipInfo(tripId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        if (String(req.body.paidBy) !== String(req.user.id)) {
            return res.status(403).json({ message: 'paidBy must be the authenticated user' });
        }

        const payload = { ...req.body, tripId, date: req.body.date || new Date() };
        // default status pending
        payload.status = payload.status || 'pending';
        const created = await TripExpense.create(payload);
        res.status(201).json(created);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get expenses for trip (member only)
router.get('/:tripId/expenses', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isMember } = await getMembershipInfo(tripId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });
        const expenses = await TripExpense.find({ tripId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update expense (only paidBy can update)
router.put('/expenses/:id', requireAuth, async (req, res) => {
    try {
        const exp = await TripExpense.findById(req.params.id);
        if (!exp) return res.status(404).json({ message: 'Not found' });
        if (String(exp.paidBy) !== String(req.user.id)) return res.status(403).json({ message: 'Only payer can update' });

        const updated = await TripExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete expense (only paidBy or trip admin)
router.delete('/expenses/:id', requireAuth, async (req, res) => {
    try {
        const exp = await TripExpense.findById(req.params.id);
        if (!exp) return res.status(404).json({ message: 'Not found' });

        if (String(exp.paidBy) !== String(req.user.id)) {
            const { isAdmin } = await getMembershipInfo(exp.tripId, req.user.id);
            if (!isAdmin) return res.status(403).json({ message: 'Only payer or admin can delete' });
        }

        await exp.remove();
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
