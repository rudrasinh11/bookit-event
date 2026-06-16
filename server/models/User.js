const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Phase 10: Extensible roles validation (Preserves user and admin contexts safely)
    role: { 
        type: String, 
        enum: ['user', 'admin', 'organizer'], 
        default: 'user' 
    },
    isVerified: { type: Boolean, default: false },

    // Phase 3: Real-Time Telemetry Properties Tracking Matrix
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    activeSessions: [{ type: String }] // Stores socket connection IDs
    
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);