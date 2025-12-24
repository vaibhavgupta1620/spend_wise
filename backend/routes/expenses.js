// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { requireAuth } = require('../utils/authHelpers');

// Create expense
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = { ...req.body, submittedBy: req.user.id };

    // ✅ If this is a group expense and no groupId is provided,
    //    automatically create a Group and GroupMember records.
    if (payload.expenseType === 'group' && !payload.groupId) {
      const Group = require('../models/Group');
      const GroupMember = require('../models/GroupMember');
      const mongoose = require('mongoose');

      const groupName = payload.groupName || 'Group Expense';

      // 1) Create a Group document (stored in "groups" collection)
      const group = await Group.create({
        name: groupName,
        description: payload.description || '',
        createdBy: req.user.id,
      });

      payload.groupId = group._id;

      // 2) If the client sent memberNames, store them in "groupmembers" collection
      if (Array.isArray(payload.memberNames) && payload.memberNames.length > 0) {
        const docs = payload.memberNames
          .map((raw) => (typeof raw === 'string' ? raw.trim() : ''))
          .filter((name) => !!name)
          .map((name) => ({
            groupId: group._id,
            // synthetic userId, so we don't depend on an existing User record
            userId: new mongoose.Types.ObjectId(),
            role: 'member',
            memberName: name,
            joinedAt: new Date(),
          }));

        if (docs.length > 0) {
          await GroupMember.insertMany(docs);
          // also store membersCount snapshot on the expense
          payload.membersCount = docs.length;
        }
      }
    }

    // default status: if group expense -> pending, else approved
    if (payload.groupId) payload.status = payload.status || 'pending';
    else payload.status = 'approved';

    const created = await Expense.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get expenses for current user (personal + group)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // All expenses submitted by this user OR belonging to groups they are in
    const expenses = await Expense.find({
      $or: [
        { submittedBy: userId },
        { paidBy: userId },
        { splitBetween: userId },
      ],
    })
      .sort({ date: -1 })
      .lean();

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single expense
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Not found' });

    // Only allow the submitter to see details directly (simplified)
    if (String(exp.submittedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update expense (only creator)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });

    if (String(expense.submittedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only submitter can update' });
    }

    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete expense (only creator)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });

    if (String(expense.submittedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only submitter can delete' });
    }

    await expense.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
