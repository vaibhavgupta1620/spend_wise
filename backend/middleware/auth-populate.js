// backend/middleware/auth-populate.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'Vaibhav_guptaproject_forexpense';

async function populateUserFromJwt(req, res, next) {
    try {
        const auth = req.get('Authorization') || '';
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m) {
            // no token provided -> continue without req.user
            return next();
        }

        const token = m[1];
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // invalid/expired token -> do not populate req.user
            // you can optionally return 401 here, but leaving to route guards is flexible
            console.warn('[auth-populate] token verify failed:', err && err.message);
            return next();
        }

        if (!payload || !payload.id) return next();

        // Load user from DB but exclude sensitive fields
        const userDoc = await User.findById(payload.id).select('-passwordHash').lean();
        if (!userDoc) return next();

        // Attach minimal user object
        req.user = {
            id: userDoc._id.toString(),
            email: userDoc.email,
            name: userDoc.name,
            role: userDoc.role || 'user',
            active: typeof userDoc.active === 'boolean' ? userDoc.active : true,
        };

        return next();
    } catch (err) {
        console.error('[auth-populate] unexpected error:', err);
        return next();
    }
}

module.exports = populateUserFromJwt;
