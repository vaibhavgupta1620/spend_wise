// backend/models/ApprovalRule.js
const mongoose = require('mongoose');

const ApprovalRuleSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, unique: true },
    ruleType: { type: String, enum: ['all_members', 'admin_only', 'majority_vote', 'single_approval'], default: 'single_approval' },
    autoApproveThreshold: { type: Number, default: 0 }, // auto approve below this
    requireMultipleApprovalsThreshold: { type: Number, default: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', ApprovalRuleSchema);
