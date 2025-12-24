// backend/routes/tripMembers.js
const express = require('express');
const router = express.Router();
const TripMember = require('../models/TripMember');
const { requireAuth, getMembershipInfo } = require('../utils/authHelpers');

// Add a member (admin only)
router.post('/:tripId/members', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { userId, role } = req.body;
        const { isAdmin } = await getMembershipInfo(tripId, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });

        const member = await TripMember.create({ tripId, userId, role: role || 'participant' });
        res.status(201).json(member);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'Member already exists' });
        res.status(400).json({ message: err.message });
    }
});

// List members (member only)
router.get('/:tripId/members', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isMember } = await getMembershipInfo(tripId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });
        const members = await TripMember.find({ tripId });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove member (admin only)
router.delete('/:tripId/members/:memberId', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const { isAdmin } = await getMembershipInfo(tripId, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });
        await TripMember.findByIdAndDelete(req.params.memberId);
        res.json({ message: 'Removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
