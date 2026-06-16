const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
        try {
            token = token.split(' ')[1];
            
            // Decrypting and checking token validity
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            next();
        } catch (error) {
            console.error('Authentication Middleware Capture:', error.message);
            
            // Explicit interception for expired states to allow downstream silent token refresh
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Access token expired', 
                    code: 'TOKEN_EXPIRED' 
                });
            }
            
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Maintained for 100% backward compatibility with all current routes
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Scalable, variable argument role protection matrix helper (Prepares for Organizer tier safely)
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Role (${req.user ? req.user.role : 'anonymous'}) is not authorized to access this resource` 
            });
        }
        next();
    };
};

module.exports = { protect, admin, authorizeRoles };