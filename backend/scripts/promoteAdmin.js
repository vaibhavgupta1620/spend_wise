// backend/scripts/promoteAdmin.js
const path = require('path');
// ensure dotenv loads the backend/.env file
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: node backend/scripts/promoteAdmin.js you@example.com');
        process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set in backend/.env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const normalized = String(email).trim().toLowerCase();
        const result = await User.findOneAndUpdate(
            { email: normalized },
            { $set: { role: 'admin', active: true } },
            { new: true }
        ).lean();

        if (!result) {
            console.error(`User with email "${normalized}" not found. Create the user first (register), then re-run this script.`);
            process.exit(2);
        }

        console.log('Successfully promoted user to admin:', result.email);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error promoting user:', err && err.stack ? err.stack : err);
        try { await mongoose.disconnect(); } catch (_) { }
        process.exit(1);
    }
}

run();
