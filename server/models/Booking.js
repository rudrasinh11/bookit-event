const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    seatNumber: { type: String, required: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    
    // Support for multiple seats in one transaction
    totalSeats: { type: Number, required: true, default: 1 },
    attendees: [attendeeSchema], // Captures structural passenger name manifests
    seatNumbers: [{ type: String }], // Fast matching reference array
    
    status: { 
        type: String, 
        enum: ['confirmed', 'cancelled', 'pending'], 
        default: 'pending' 
    },
    paymentStatus: { 
        type: String, 
        enum: ['paid', 'not_paid', 'failed', 'refund_pending', 'refunded'], 
        default: 'not_paid' 
    },
    
    amount: { type: Number, required: true },
    transactionId: { type: String, default: null }, // Tracking identifier reference
    invoiceLink: { type: String, default: null },
    ticketLink: { type: String, default: null },
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Performance Indexes for search parameters, ranges, and analytical filters
bookingSchema.index({ userId: 1, eventId: 1 });
bookingSchema.index({ status: 1, bookedAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);