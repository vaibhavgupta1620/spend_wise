// backend/middleware/auth.js
function ensureAdmin(req, res, next) {
    // Assumes you have earlier middleware that sets req.user, e.g. passport/jwt/session
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
}

module.exports = { ensureAdmin };
