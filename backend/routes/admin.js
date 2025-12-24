// backend/routes/admin.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const { ensureAdmin } = require('../middleware/auth');

const router = express.Router();

// allowed roles
const ROLES = ['user', 'admin', 'moderator'];

/**
 * Helper: map user doc to safe API user object
 */
function mapUser(u) {
    return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        providerId: u.providerId,
        role: u.role || 'user',
        active: typeof u.active === 'boolean' ? u.active : true,
        createdAt: u.createdAt,
        avatarUrl: u.avatarUrl || '',
    };
}
// debug ping to verify router is mounted and reachable
router.get('/_ping', (req, res) => res.json({ ok: true, name: 'admin-router' }));

/**
 * List users (paginated)
 * GET /api/admin/users?q=&page=&pageSize=
 */
router.get('/users', ensureAdmin, asyncHandler(async (req, res) => {
    console.log('[admin.users] list called by', req.user && req.user.email);
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize || '12', 10)));

    const filter = {};
    if (q) {
        const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { email: { $regex: re } },
            { name: { $regex: re } },
            { providerId: { $regex: re } },
        ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec();

    res.json({ users: users.map(mapUser), total });
}));

/**
 * Roles list
 * GET /api/admin/roles
 */
router.get('/roles', ensureAdmin, asyncHandler(async (req, res) => {
    console.log('[admin.roles] called by', req.user && req.user.email);
    res.json(ROLES);
}));

/**
 * Get single user
 * GET /api/admin/users/:id
 */
router.get('/users/:id', ensureAdmin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log('[admin.user.get] called by', req.user && req.user.email, 'id=', id);

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(mapUser(user));
}));

/**
 * Update user name/role
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', ensureAdmin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log('[admin.user.update] called by', req.user && req.user.email, 'id=', id);

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const { role, name } = req.body || {};
    const update = {};
    if (typeof role !== 'undefined') {
        if (!ROLES.includes(role)) return res.status(400).json({ message: `Invalid role. Allowed: ${ROLES.join(', ')}` });
        update.role = role;
    }
    if (typeof name !== 'undefined') update.name = name;

    if (Object.keys(update).length === 0) return res.status(400).json({ message: 'Nothing to update' });

    const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(mapUser(user));
}));

/**
 * Update active status
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', ensureAdmin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log('[admin.user.status] called by', req.user && req.user.email, 'id=', id);

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const { active } = req.body;
    if (typeof active !== 'boolean') return res.status(400).json({ message: 'active must be boolean' });

    const user = await User.findByIdAndUpdate(id, { active }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ id: user._id.toString(), active: user.active });
}));

/**
 * Delete single user
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', ensureAdmin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log('[admin.user.delete] called by', req.user && req.user.email, 'id=', id);

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const deleted = await User.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    // TODO: cascade-delete or mark soft-delete related resources (expenses)
    // TODO: write to audit log who deleted the user
    res.json({ success: true });
}));

/**
 * Bulk actions: { ids: [], action: 'delete'|'enable'|'disable' }
 * POST /api/admin/users/bulk
 */
router.post('/users/bulk', ensureAdmin, asyncHandler(async (req, res) => {
    console.log('[admin.bulk] called by', req.user && req.user.email);
    const { ids, action } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });

    const objectIds = ids.filter(id => mongoose.isValidObjectId(id)).map(id => mongoose.Types.ObjectId(id));
    if (objectIds.length === 0) return res.status(400).json({ message: 'No valid ids provided' });

    if (action === 'delete') {
        const result = await User.deleteMany({ _id: { $in: objectIds } });
        // TODO: audit log
        return res.json({ deletedCount: result.deletedCount || 0 });
    }

    if (action === 'enable' || action === 'disable') {
        const active = action === 'enable';
        const result = await User.updateMany({ _id: { $in: objectIds } }, { $set: { active } });
        return res.json({ modifiedCount: result.modifiedCount || 0 });
    }

    return res.status(400).json({ message: 'Invalid action' });
}));

module.exports = router;
