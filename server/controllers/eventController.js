const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const mongoose = require('mongoose');

const generateDefaultSeatMap = (rowsCount = 6, colsCount = 10, seatCategories, ticketPrice = 0) => {
    let layout = [];
    const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    
    const segments = seatCategories && seatCategories.length > 0 
        ? seatCategories 
        : [{ name: 'General', price: ticketPrice }];

    for (let r = 0; r < rowsCount; r++) {
        let rowLabel = rows[r] || `R${r + 1}`;
        let assignedCategory = segments[0].name;
        if (segments.length > 1) {
            let segmentIndex = Math.min(Math.floor(r / (rowsCount / segments.length)), segments.length - 1);
            assignedCategory = segments[segmentIndex].name;
        }

        for (let c = 1; c <= colsCount; c++) {
            layout.push({
                seatId: `${rowLabel}-${c}`,
                rowLabel: rowLabel,
                rowNumber: r + 1,
                colNumber: c,
                category: assignedCategory,
                status: 'Available',
                lockedAt: null,
                lockedBy: null,
                bookingDetails: {}
            });
        }
    }
    return layout;
};

const checkIsBookingClosed = (eventDate, eventTime) => {
    try {
        const [hours, minutes] = eventTime.split(':');
        const eventDateTime = new Date(eventDate);
        eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        const currentSystemTime = new Date();
        const differenceInMilliseconds = eventDateTime - currentSystemTime;
        return (differenceInMilliseconds / (1000 * 60 * 60)) < 12;
    } catch (e) {
        return true; 
    }
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\$&');

const categoryAliases = {
    Tech: ['Tech', 'Technology'],
    Technology: ['Tech', 'Technology'],
    Arts: ['Art', 'Arts'],
    Art: ['Art', 'Arts'],
    Workshop: ['Workshop', 'Workshops'],
    Workshops: ['Workshop', 'Workshops'],
    Comedy: ['Comedy'],
    Music: ['Music'],
    Business: ['Business']
};

// Upgraded Public Browsing Controller Supporting Phase 4 Parameters
exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        const compactView = req.query.compact === 'true';
        
        if (req.query.category && req.query.category !== 'All') {
            const normalizedCategory = req.query.category.toString().trim();
            const candidateCategories = categoryAliases[normalizedCategory] || [normalizedCategory];
            filters.category = {
                $in: candidateCategories.map((item) => new RegExp(`^${escapeRegex(item)}$`, 'i'))
            };
        }

        if (req.query.status && req.query.status !== 'All') {
            filters.status = req.query.status;
        } else if (!req.query.status) {
            filters.status = 'Active';
        }

        if (req.query.city) {
            filters.location = { $regex: escapeRegex(req.query.city.toString().trim()), $options: 'i' };
        }
        
        if (req.query.search) {
            const safeSearch = escapeRegex(req.query.search.toString().trim());
            filters.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
                { location: { $regex: safeSearch, $options: 'i' } },
                { category: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        if (req.query.date) {
            const targetedDate = new Date(req.query.date);
            const startOfDay = new Date(targetedDate.setHours(0,0,0,0));
            const endOfDay = new Date(targetedDate.setHours(23,59,59,999));
            filters.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filters.ticketPrice = {};
            if (req.query.minPrice) filters.ticketPrice.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filters.ticketPrice.$lte = Number(req.query.maxPrice);
        }

        let sortCriteria = { popularityScore: -1, createdAt: -1 };
        if (req.query.sortBy === 'date') sortCriteria = { date: 1 };
        if (req.query.sortBy === 'price_low') sortCriteria = { ticketPrice: 1 };
        if (req.query.sortBy === 'price_high') sortCriteria = { ticketPrice: -1 };
        if (req.query.sortBy === 'rating') sortCriteria = { averageRating: -1 };

        let eventsQuery = Event.find(filters).sort(sortCriteria);

        if (compactView) {
            eventsQuery = eventsQuery.select('title date time location image category ticketPrice availableSeats totalSeats popularityScore averageRating reviewsCount status');
        } else {
            eventsQuery = eventsQuery.populate('createdBy', 'name email');
        }

        const events = await eventsQuery.lean();
        
        const processedEvents = events.map(event => ({
            ...event,
            isBookingClosed: checkIsBookingClosed(event.date, event.time)
        }));

        return res.json(processedEvents);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event id.' });
        }

        const eventDoc = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!eventDoc) return res.status(404).json({ message: 'Event not found' });
        
        // 🌟 CRITICAL FIX: Explicitly flush out and persist expired locks inside MongoDB Atlas
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        let databaseNeedsSync = false;

        eventDoc.seatMapLayout.forEach(seat => {
            if (seat.status === 'Locked' && seat.lockedAt && new Date(seat.lockedAt) < tenMinutesAgo) {
                seat.status = 'Available';
                seat.lockedAt = null;
                seat.lockedBy = null;
                databaseNeedsSync = true;
            }
        });

        if (databaseNeedsSync) {
            await eventDoc.save();
        }

        const event = eventDoc.toObject();
        event.isBookingClosed = checkIsBookingClosed(event.date, event.time);

        return res.json(event);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { 
            title, description, date, time, location, locationLink, 
            coordinates, category, ticketPrice, image, seatCategories,
            gridRows, gridCols, tags, imageGallery 
        } = req.body;

        const rows = parseInt(gridRows, 10) || 6;
        const cols = parseInt(gridCols, 10) || 10;
        const totalCalculatedCapacity = rows * cols;

        let cleanCategories = seatCategories || [{ name: 'General', price: ticketPrice || 0, totalSeats: totalCalculatedCapacity, availableSeats: totalCalculatedCapacity }];
        let derivedSeatLayout = generateDefaultSeatMap(rows, cols, cleanCategories, ticketPrice || 0);

        const event = await Event.create({
            title, description, date,
            time: time || '18:00',
            location, locationLink: locationLink || '',
            coordinates: coordinates || { lat: null, lng: null },
            category,
            totalSeats: totalCalculatedCapacity,
            availableSeats: totalCalculatedCapacity,
            ticketPrice: ticketPrice || 0,
            image: image || '',
            tags: tags || [],
            imageGallery: imageGallery || [],
            popularityScore: 0,
            seatCategories: cleanCategories,
            seatMapLayout: derivedSeatLayout,
            createdBy: req.user.id
        });
        
        return res.status(201).json(event);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const targetEvent = await Event.findById(req.params.id);
        if (!targetEvent) return res.status(404).json({ message: 'Event not found' });

        if (targetEvent.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: Unauthorized data modification rejected.' });
        }

        if (req.body.gridRows || req.body.gridCols) {
            const rows = parseInt(req.body.gridRows || 6, 10);
            const cols = parseInt(req.body.gridCols || 10, 10);
            
            req.body.totalSeats = rows * cols;
            req.body.seatMapLayout = generateDefaultSeatMap(rows, cols, req.body.seatCategories || targetEvent.seatCategories, req.body.ticketPrice || targetEvent.ticketPrice);
            req.body.availableSeats = req.body.totalSeats;
        }

        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        return res.json(event);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const targetEvent = await Event.findById(req.params.id);
        if (!targetEvent) return res.status(404).json({ message: 'Event not found' });

        if (targetEvent.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: Unauthorized archival requested.' });
        }

        const event = await Event.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
        return res.json({ message: 'Event soft deleted successfully.', event });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// 🌟 CRITICAL REWRITE: Serverless Optimized Atomic Selection Coordinator
exports.lockInteractiveSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const seatIds = Array.isArray(req.body?.seatIds) ? req.body.seatIds : null;

        if (!req.user?.id) {
            return res.status(401).json({ message: 'Please login to select seats.' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid event id.' });
        }

        if (!seatIds) {
            return res.status(400).json({ message: 'Seat ids array is required.' });
        }

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: 'Target event missing.' });

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        event.seatMapLayout.forEach((seat) => {
            if (seat.status === 'Locked' && seat.lockedAt && new Date(seat.lockedAt) < tenMinutesAgo) {
                seat.status = 'Available';
                seat.lockedAt = null;
                seat.lockedBy = null;
            }
        });

        const unavailableSeats = event.seatMapLayout.filter((seat) => 
            seatIds.includes(seat.seatId) &&
            seat.status !== 'Available' &&
            !(seat.status === 'Locked' && seat.lockedBy && seat.lockedBy.toString() === req.user.id)
        );

        if (unavailableSeats.length > 0) {
            return res.status(400).json({ 
                message: 'One or more selected seats are no longer available.',
                unavailableIds: unavailableSeats.map((seat) => seat.seatId)
            });
        }

        event.seatMapLayout.forEach((seat) => {
            if (seatIds.includes(seat.seatId)) {
                seat.status = 'Locked';
                seat.lockedAt = new Date();
                seat.lockedBy = req.user.id;
            } else if (seat.status === 'Locked' && seat.lockedBy && seat.lockedBy.toString() === req.user.id) {
                seat.status = 'Available';
                seat.lockedAt = null;
                seat.lockedBy = null;
            }
        });

        event.markModified('seatMapLayout');
        await event.save();

        return res.json({ message: 'Seats successfully updated.', seatMapLayout: event.seatMapLayout });
    } catch (error) {
        return res.status(500).json({ message: 'Failed setting atomic seat matrix locks.', error: error.message });
    }
};

exports.getEventAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: 'Target event records do not exist.' });

        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized metrics query context rejected.' });
        }

        let bookedSeatsCount = 0, reservedSeatsCount = 0, disabledSeatsCount = 0, totalRevenueGenerated = 0;
        let uniqueUserEmails = new Set(), timelineTrendMap = {};

        event.seatMapLayout.forEach(seat => {
            if (seat.status === 'Booked') {
                bookedSeatsCount++;
                totalRevenueGenerated += seat.bookingDetails.paidAmount || 0;
                if (seat.bookingDetails.userEmail) uniqueUserEmails.add(seat.bookingDetails.userEmail);
                if (seat.bookingDetails.bookingDate) {
                    const dateStr = new Date(seat.bookingDetails.bookingDate).toISOString().split('T')[0];
                    timelineTrendMap[dateStr] = (timelineTrendMap[dateStr] || 0) + 1;
                }
            } else if (seat.status === 'Reserved') {
                reservedSeatsCount++;
            } else if (seat.status === 'Disabled') {
                disabledSeatsCount++;
            }
        });

        const availableSeatsCount = event.totalSeats - (bookedSeatsCount + reservedSeatsCount + disabledSeatsCount);
        const bookingTrends = Object.keys(timelineTrendMap).map(date => ({
            date, bookings: timelineTrendMap[date], revenue: timelineTrendMap[date] * (event.ticketPrice || 0)
        })).sort((a,b) => new Date(a.date) - new Date(b.date));

        return res.json({
            stats: {
                totalUsersRegistered: uniqueUserEmails.size,
                totalSeatsSold: bookedSeatsCount,
                totalAvailableSeats: availableSeatsCount,
                totalReservedSeats: reservedSeatsCount,
                totalRevenueGenerated,
                bookingConversionRate: event.totalSeats > 0 ? parseFloat(((bookedSeatsCount / event.totalSeats) * 100).toFixed(2)) : 0,
                averageBookingValue: bookedSeatsCount > 0 ? parseFloat((totalRevenueGenerated / bookedSeatsCount).toFixed(2)) : 0,
                occupancyPercentage: event.totalSeats > 0 ? ((bookedSeatsCount / event.totalSeats) * 100).toFixed(1) : 0
            },
            charts: {
                bookingTrends,
                seatOccupancyDistribution: [
                    { name: 'Available', value: availableSeatsCount },
                    { name: 'Booked', value: bookedSeatsCount },
                    { name: 'Reserved', value: reservedSeatsCount },
                    { name: 'Disabled', value: disabledSeatsCount }
                ]
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error compiling event telemetry data.', error: error.message });
    }
};

exports.updateSeatStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { seatId, status } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ message: 'Event profile target missing.' });

        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized seat modification context rejected.' });
        }

        const seatIndex = event.seatMapLayout.findIndex(s => s.seatId === seatId);
        if (seatIndex === -1) return res.status(404).json({ message: 'Seat index position identifier invalid.' });

        if (event.seatMapLayout[seatIndex].status === 'Booked') {
            return res.status(400).json({ message: 'Cannot modify status configuration of an active customer purchase registration.' });
        }

        event.seatMapLayout[seatIndex].status = status;
        await event.save();

        return res.json({ message: 'Seat status updated successfully.', seatMapLayout: event.seatMapLayout });
    } catch (error) {
        return res.status(500).json({ message: 'Failed modifying grid layout seat matrix.', error: error.message });
    }
};

// Submit Event Review
exports.submitEventReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const ticketCheck = await Booking.findOne({
            userId: req.user.id,
            eventId: id,
            status: 'confirmed'
        });

        if (!ticketCheck) {
            return res.status(403).json({ 
                message: 'Review authorization rejected. You can only review events you have booked and attended.' 
            });
        }

        await Review.create({
            eventId: id,
            userId: req.user.id,
            userName: req.user.name,
            rating: Number(rating),
            comment: comment.toString().trim()
        });

        const scoresAggregate = await Review.aggregate([
            { $match: { eventId: new mongoose.Types.ObjectId(id) } },
            { $group: { _id: '$eventId', avgScore: { $avg: '$rating' }, totalCount: { $sum: 1 } } }
        ]);

        if (scoresAggregate.length > 0) {
            await Event.findByIdAndUpdate(id, {
                averageRating: parseFloat(scoresAggregate[0].avgScore.toFixed(1)),
                reviewsCount: scoresAggregate[0].totalCount
            });
        }

        return res.status(201).json({ message: 'Community feedback saved successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed creating assessment entry.', error: error.message });
    }
};

exports.getEventReviews = async (req, res) => {
    try {
        const reviewManifest = await Review.find({ eventId: req.params.id }).sort({ createdAt: -1 });
        return res.json(reviewManifest);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error tracking reviews.', error: error.message });
    }
};