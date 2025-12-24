// backend/utils/authHelpers.js
const jwt = require('jsonwebtoken');
const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');

const JWT_SECRET = process.env.JWT_SECRET || 'PLEASE_CHANGE_THIS_SECRET';

/**
 * requireAuth - JWT-based auth middleware.
 * Expects an Authorization: Bearer <token> header containing a JWT
 * whose payload includes the user id in `sub` (or `userId` / `id`).
 * For local testing, it also supports an `x-user-id` header as a fallback.
 */
async function requireAuth(req, res, next) {
  try {
    let userId = null;

    // Prefer JWT in Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        userId = payload.sub || payload.userId || payload.id || null;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }

    // Fallback for manual testing
    if (!userId) {
      const headerId = req.header('x-user-id');
      if (headerId) userId = headerId;
    }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: userId };
    return next();
  } catch (err) {
    console.error('[requireAuth] error:', err);
    return res.status(500).json({ message: 'Auth error' });
  }
}

/**
 * getMembershipInfo - helper to fetch group membership info.
 */
async function getMembershipInfo(groupId, userId) {
  const member = await GroupMember.findOne({ groupId, userId });
  if (!member) return { isMember: false, isAdmin: false };

  const group = await Group.findById(groupId);
  const isAdmin = Boolean(member.isAdmin || (group && String(group.createdBy) === String(userId)));

  return { isMember: true, isAdmin };
}

/**
 * isUserAllowedOnExpense - placeholder: implement expense-level access checks.
 */
async function isUserAllowedOnExpense(expense, userId) {
  if (!expense) return false;
  // basic rule: allow if the user submitted the expense
  if (String(expense.submittedBy) === String(userId)) return true;
  // more complex rules (group admin, approver, etc.) can be added here
  return false;
}

/**
 * middleware: ensureGroupAdmin
 */
async function ensureGroupAdmin(req, res, next) {
  const groupId = req.params.groupId || req.body.groupId;
  if (!groupId) return res.status(400).json({ message: 'Missing groupId' });

  const { isAdmin } = await getMembershipInfo(groupId, req.user.id);
  if (!isAdmin) return res.status(403).json({ message: 'Admin required' });
  next();
}

/**
 * middleware: ensureGroupAdminOrSelf (placeholder)
 */
async function ensureGroupAdminOrSelf(req, res, next) {
  // This can be used for changes affecting specific members; implement per-route as needed
  next();
}

module.exports = {
  requireAuth,
  getMembershipInfo,
  isUserAllowedOnExpense,
  ensureGroupAdmin,
  ensureGroupAdminOrSelf,
};
