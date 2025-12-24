

// backend/routes/trips.js
const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const TripMember = require('../models/TripMember');
const { requireAuth, getMembershipInfo } = require('../utils/authHelpers');

// Create trip (creator becomes admin automatically via model hook)
router.post('/', requireAuth, async (req, res) => {
    try {
        const payload = { ...req.body, createdBy: req.user.id };
        const trip = await Trip.create(payload);
        res.status(201).json(trip);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get trips where user is member
router.get('/', requireAuth, async (req, res) => {
    try {
        const memberships = await TripMember.find({ userId: req.user.id }).select('tripId');
        const tripIds = memberships.map(m => m.tripId);
        const trips = await Trip.find({ _id: { $in: tripIds } }).sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single trip (must be member)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Not found' });
        const m = await getMembershipInfo(trip._id, req.user.id);
        if (!m.isMember) return res.status(403).json({ message: 'Access denied' });
        res.json(trip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update trip (admin only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { isAdmin } = await getMembershipInfo(req.params.id, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only trip admins can update' });
        const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete trip (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { isAdmin } = await getMembershipInfo(req.params.id, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only trip admins can delete' });
        await Trip.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
