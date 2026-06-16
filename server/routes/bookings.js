const express = require('express');
const router = express.Router();
const { 
    bookEvent, 
    confirmBooking, 
    getMyBookings, 
    cancelBooking, 
    sendBookingOTP,
    requestBookingRefund,
    verifyTicketCheckIn // Imported for Phase 6 Gate Control Systems
} = require('../controllers/bookingController');
const { protect, admin, authorizeRoles } = require('../middleware/auth');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);

// Phase 6 Feature Entry: Gate scanning check-in intercept point
router.post('/verify-checkin', protect, authorizeRoles('admin'), verifyTicketCheckIn);

// Phase 10 & 14 Custom Authorization Mapping
router.put('/:id/confirm', protect, authorizeRoles('admin'), confirmBooking);
router.get('/my', protect, getMyBookings);

// Unified structural cancellation point
router.delete('/:id', protect, cancelBooking);

// Phase 12 Feature Addition: Production-grade refund request processing registry
router.post('/:id/refund', protect, requestBookingRefund);

module.exports = router;