// backend/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  amount: { type: Number, required: true },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },

  // "expense" or "income"
  type: {
    type: String,
    enum: ['expense', 'income'],
    default: 'expense',
  },

  // "personal" or "group"
  expenseType: {
    type: String,
    enum: ['personal', 'group'],
    default: 'personal',
  },

  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  splitBetween: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },

  // Optional display name for the group on the expense
  groupName: { type: String },

  // ✅ NEW: snapshot of group members for this expense
  membersCount: { type: Number, default: 0 },
  memberNames: [{ type: String }],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  notes: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

/**
 * recomputeStatus(expenseId)
 * Re-evaluates the approval status for an expense based on the current approval rules.
 * Mirrors the original trigger-like logic from the previous implementation.
 */
ExpenseSchema.statics.recomputeStatus = async function (expenseId) {
  const Expense = this;
  const ApprovalRule = mongoose.model('ApprovalRule');
  const ExpenseApproval = mongoose.model('ExpenseApproval');
  const GroupMember = mongoose.model('GroupMember');
  const TripMember = mongoose.model('TripMember');

  const expense = await Expense.findById(expenseId).lean();
  if (!expense) throw new Error('Expense not found');

  // Non-group/trip expenses: approve by default (or keep approved)
  if (!expense.groupId && !expense.tripId) {
    await Expense.findByIdAndUpdate(expenseId, { status: 'approved' });
    return await Expense.findById(expenseId);
  }

  // Try fetch approval rule (group-based)
  let rule = null;
  if (expense.groupId) {
    rule = await ApprovalRule.findOne({ groupId: expense.groupId }).lean();
  } else if (expense.tripId) {
    rule = await ApprovalRule.findOne({ tripId: expense.tripId }).lean();
  }

  let rule_type = 'single_approval';
  let required_approvals = 1;

  if (rule && rule.rule_type) {
    rule_type = rule.rule_type;
  }

  // count current approvals on this expense
  const current_approvals = await ExpenseApproval.countDocuments({
    expenseId,
    status: 'approved',
  });

  if (rule_type === 'single_approval') {
    required_approvals = 1;
  } else if (rule_type === 'all_members') {
    // count members of the group/trip (or fallback to 1)
    if (expense.groupId) {
      const membersCount = await GroupMember.countDocuments({
        groupId: expense.groupId,
      });
      required_approvals = membersCount || 1;
    } else if (expense.tripId) {
      const membersCount = await TripMember.countDocuments({
        tripId: expense.tripId,
      });
      required_approvals = membersCount || 1;
    } else {
      required_approvals = 1;
    }
  } else if (rule_type === 'majority_vote') {
    let membersCount = 1;
    if (expense.groupId) {
      membersCount = await GroupMember.countDocuments({
        groupId: expense.groupId,
      });
    } else if (expense.tripId) {
      membersCount = await TripMember.countDocuments({
        tripId: expense.tripId,
      });
    }
    membersCount = membersCount || 1;
    required_approvals = Math.floor(membersCount / 2) + 1;
  } else {
    // default fallback
    required_approvals = 1;
  }

  // Update status depending on approvals
  if (current_approvals >= required_approvals) {
    await Expense.findByIdAndUpdate(expenseId, { status: 'approved' });
  } else {
    await Expense.findByIdAndUpdate(expenseId, { status: 'pending' });
  }

  return await Expense.findById(expenseId);
};

module.exports = mongoose.model('Expense', ExpenseSchema);
