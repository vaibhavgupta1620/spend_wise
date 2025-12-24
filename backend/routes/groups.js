// backend/routes/groups.js
const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const { requireAuth, ensureGroupAdmin } = require('../utils/authHelpers');

// Create group
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = await Group.create({ name, description, createdBy: req.user.id });
        // add creator as admin member
        await GroupMember.create({ groupId: group._id, userId: req.user.id, role: 'admin' });
        res.status(201).json(group);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get groups for current user
router.get('/', requireAuth, async (req, res) => {
    try {
        const memberships = await GroupMember.find({ userId: req.user.id }).populate('groupId');
        const groups = memberships.map(m => m.groupId);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update group (admin only)
router.put('/:id', requireAuth, ensureGroupAdmin, async (req, res) => {
    try {
        const updated = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
