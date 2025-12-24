// backend/routes/approvalRules.js
const express = require('express');
const router = express.Router();
const ApprovalRule = require('../models/ApprovalRule');
const { requireAuth, ensureGroupAdmin } = require('../utils/authHelpers');

// Create or update rule (admin only)
router.post('/:groupId/rule', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { isAdmin } = await require('../utils/authHelpers').getMembershipInfo(groupId, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can manage rules' });

        const payload = req.body;
        const existing = await ApprovalRule.findOne({ groupId });
        if (existing) {
            const updated = await ApprovalRule.findByIdAndUpdate(existing._id, payload, { new: true });
            return res.json(updated);
        } else {
            const created = await ApprovalRule.create({ ...payload, groupId });
            return res.status(201).json(created);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get rule
router.get('/:groupId/rule', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { isMember } = await require('../utils/authHelpers').getMembershipInfo(groupId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const rule = await ApprovalRule.findOne({ groupId });
        res.json(rule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
