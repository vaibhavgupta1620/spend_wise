// backend/routes/expenseApprovals.js
const express = require('express');
const router = express.Router();
const ExpenseApproval = require('../models/ExpenseApproval');
const Expense = require('../models/Expense');
const { requireAuth } = require('../utils/authHelpers');

// Approve/reject an expense (a member of group can approve/reject)
router.post('/:expenseId/approve', requireAuth, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'

    // Validate status
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Check user is member of group (if group expense)
    const allowed = await require('../utils/authHelpers').isUserAllowedOnExpense(req.user.id, expense);
    if (!allowed) return res.status(403).json({ message: 'Not authorized to approve' });

    // Upsert (unique constraint prevents duplicate)
    const upsert = await ExpenseApproval.findOneAndUpdate(
      { expenseId, approverId: req.user.id },
      { status, notes, approvedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // The ExpenseApproval model has post-save hook to recompute status.
    res.json(upsert);
  } catch (err) {
    // handle duplicate key separately
    if (err.code === 11000) return res.status(409).json({ message: 'Already approved by this user' });
    res.status(500).json({ message: err.message });
  }
});

// Get approvals for an expense (only group members)
router.get('/:expenseId', requireAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const allowed = await require('../utils/authHelpers').isUserAllowedOnExpense(req.user.id, expense);
    if (!allowed) return res.status(403).json({ message: 'Not authorized' });

    const approvals = await ExpenseApproval.find({ expenseId: req.params.expenseId }).sort({ approvedAt: -1 });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
