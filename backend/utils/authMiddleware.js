// backend/utils/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

function requireAuth(req, res, next) {
    const auth = req.header('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing Authorization header' });
    }
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // payload.sub contains user id
        req.user = { id: payload.sub, email: payload.email };
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = requireAuth;
