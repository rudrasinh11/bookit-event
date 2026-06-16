const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, verifyOTP, refreshToken } = require('../controllers/authController');

const authBruteForceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window bounds
    max: 5, // Tight limit: maximum of 5 structural execution attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Security Exception: Too many authentication attempts. Lockdown active for 15 minutes.' }
});

const tokenRefreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window bounds
    max: 30, // Limit token rotations to prevent session exhaustion attacks
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many session refresh requests. Please re-authenticate manually.' }
});

// Clean helper middleware function for validating raw payload structures
const validatePayload = (rules) => {
    return (req, res, next) => {
        for (const [field, validations] of Object.entries(rules)) {
            const value = req.body[field] ? req.body[field].toString().trim() : '';
            
            if (validations.required && !value) {
                return res.status(400).json({ message: `${field} is a required field.` });
            }
            if (value && validations.pattern && !validations.pattern.test(value)) {
                return res.status(400).json({ message: validations.message });
            }
        }
        next();
    };
};

// Input verification validation schemas
const registerSchema = validatePayload({
    name: { required: true },
    email: { 
        required: true, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        message: 'Please provide a valid structural email address.' 
    },
    password: { 
        required: true, 
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
        message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.' 
    }
});

const loginSchema = validatePayload({
    email: { 
        required: true, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        message: 'Please provide a valid email structure.' 
    },
    password: { required: true }
});

const otpSchema = validatePayload({
    email: { required: true },
    otp: { 
        required: true, 
        pattern: /^\d{6}$/, 
        message: 'OTP must be exactly a 6-digit numerical string.' 
    }
});

// Hardened Routes wrapped inside high-performance middleware isolation loops
router.post('/register', authBruteForceLimiter, registerSchema, register);
router.post('/login', authBruteForceLimiter, loginSchema, login);
router.post('/verify-otp', authBruteForceLimiter, otpSchema, verifyOTP);

// Token rotation endpoint bounded under session refresh rate parameters
router.post('/refresh-token', tokenRefreshLimiter, refreshToken);

module.exports = router;