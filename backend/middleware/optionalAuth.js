const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // If token is invalid, we still allow the request to proceed as a guest
        console.warn('Optional Auth: Invalid token provided, proceeding as guest.');
        next();
    }
};

module.exports = optionalAuth;
