// backend/models/ExpenseApproval.js
const mongoose = require('mongoose');

const ExpenseApprovalSchema = new mongoose.Schema({
    expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        required: true,
        index: true
    },
    approverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['approved', 'rejected'],
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    approvedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Unique constraint similar to SQL (unique(expense_id, approver_id))
ExpenseApprovalSchema.index(
    { expenseId: 1, approverId: 1 },
    { unique: true }
);

/**
 * Middleware: Runs ONLY on .save()
 * (NOT on findOneAndUpdate)
 */
ExpenseApprovalSchema.post('save', async function (doc, next) {
    try {
        const Expense = mongoose.model('Expense');
        await Expense.recomputeStatus(doc.expenseId);
        next();
    } catch (err) {
        console.error('Error recomputing expense status after approval (save):', err);
        next(err);
    }
});

/**
 * Middleware: Runs on .remove()
 * If approval is removed, re-evaluate.
 */
ExpenseApprovalSchema.post('remove', async function (doc, next) {
    try {
        const Expense = mongoose.model('Expense');
        await Expense.recomputeStatus(doc.expenseId);
        next();
    } catch (err) {
        console.error('Error recomputing expense status after approval removal:', err);
        next(err);
    }
});

module.exports = mongoose.model('ExpenseApproval', ExpenseApprovalSchema);
