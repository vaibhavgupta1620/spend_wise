// backend/models/GroupMember.js
const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true,
    },
    // NOTE:
    //  - For "real" app users this is their User _id.
    //  - For ad-hoc group members (just a name), we still store
    //    a synthetic ObjectId here so the unique index works.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // ✅ Store the display name of the group member here
    memberName: { type: String },

    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member',
    },

    joinedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// ensure uniqueness per (groupId, userId)
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('GroupMember', GroupMemberSchema);
