const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
    : [];

const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secure_key_string',
        { expiresIn: '7d' }
    );
};

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            isVerified: false
        });

        const otp = generateOTP();

        await OTP.create({
            email,
            otp,
            action: 'account_verification'
        });

        // Explicitly await execution delivery so the lambda container stays open
        await sendOTPEmail(email, otp, 'account_verification');

        return res.status(201).json({
            message: 'OTP sent to email. Please verify.',
            email: user.email
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Registration Process Interrupted',
            error: error.message
        });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();

            await OTP.findOneAndDelete({
                email: user.email,
                action: 'account_verification'
            });

            await OTP.create({
                email: user.email,
                otp,
                action: 'account_verification'
            });

            // Explicitly await delivery so the container stays active to process the email task
            await sendOTPEmail(user.email, otp, 'account_verification');

            return res.status(403).json({
                message: 'Account not verified',
                needsVerification: true,
                email: user.email
            });
        }

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshTokenVal = generateRefreshToken(user.id, user.role);

        return res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: accessToken,
            refreshToken: refreshTokenVal
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Login Pipeline Interrupted',
            error: error.message
        });
    }
};

// VERIFY OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const validOTP = await OTP.findOne({
            email,
            otp,
            action: 'account_verification'
        });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        await OTP.deleteOne({ _id: validOTP._id });

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshTokenVal = generateRefreshToken(user.id, user.role);

        return res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: accessToken,
            refreshToken: refreshTokenVal
        });

    } catch (error) {
        return res.status(500).json({ message: 'Server Error verifying verification code token.' });
    }
};

// REFRESH TOKEN ROTATION HANDLER
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh Token required.' });
        }

        jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secure_key_string', 
            (err, decoded) => {
                if (err) {
                    return res.status(403).json({ message: 'Invalid or expired refresh token.' });
                }

                const newAccessToken = generateAccessToken(decoded.id, decoded.role);
                return res.json({
                    token: newAccessToken,
                    refreshToken: refreshToken
                });
            }
        );
    } catch (error) {
        return res.status(500).json({ message: 'Server error rotating authorization signature.' });
    }
};