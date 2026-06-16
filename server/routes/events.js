const express = require('express');
const router = express.Router();
const { 
    getEvents, 
    getEventById, 
    createEvent, 
    updateEvent, 
    deleteEvent,
    getEventAnalytics,
    updateSeatStatus,
    lockInteractiveSeats, // 🔓 Phase 5 Atomic Multi-Seat Lock import
    submitEventReview,   // Hooked up for Phase 7
    getEventReviews      // Hooked up for Phase 7
} = require('../controllers/eventController');
const { protect, admin, authorizeRoles } = require('../middleware/auth');

// Public facing endpoints to browse experience cards (Supports category/search queries)
router.get('/', getEvents);
router.get('/:id', getEventById);

// Phase 7 Review System Endpoint Channels
router.get('/:id/reviews', getEventReviews);
router.post('/:id/reviews', protect, submitEventReview);

// ==========================================================
// 🔓 PHASE 5: SEAT SELECTION RESERVATION WINDOW TIMER CHANNEL
// ==========================================================
router.post('/:id/lock', protect, lockInteractiveSeats);

// Phase 10 Requirements: Authorized access extended to both Admin and Organizer roles
router.post('/', protect, authorizeRoles('admin', 'organizer'), createEvent);
router.put('/:id', protect, authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', protect, authorizeRoles('admin', 'organizer'), deleteEvent);

// Admin-exclusive Analytics & Seat Configuration Override Channels
router.get('/:id/analytics', protect, authorizeRoles('admin'), getEventAnalytics);
router.patch('/:id/seats', protect, authorizeRoles('admin'), updateSeatStatus);

module.exports = router;