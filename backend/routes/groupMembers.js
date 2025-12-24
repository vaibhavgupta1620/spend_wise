// backend/routes/groupMembers.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const GroupMember = require('../models/GroupMember');
const { requireAuth, ensureGroupAdminOrSelf } = require('../utils/authHelpers');

// Add member (admin only)
router.post('/:groupId/members', requireAuth, async (req, res) => {
    try {
        // ensure caller is admin
        const { groupId } = req.params;
        const { userId, role } = req.body;
        // admin check
        const { isAdmin } = await require('../utils/authHelpers').getMembershipInfo(groupId, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only group admins can add members' });

        const member = await GroupMember.create({ groupId, userId, role: role || 'member' });
        res.status(201).json(member);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// List members of a group (must be a member)
router.get('/:groupId/members', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        // check membership
        const { isMember } = await require('../utils/authHelpers').getMembershipInfo(groupId, req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });

        const members = await GroupMember.find({ groupId });
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove member (admin only)
router.delete('/:groupId/members/:memberId', requireAuth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { isAdmin } = await require('../utils/authHelpers').getMembershipInfo(groupId, req.user.id);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });

        await GroupMember.findByIdAndDelete(req.params.memberId);
        res.json({ message: 'Removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
