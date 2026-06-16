const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const Notification = require('../models/Notification'); 
const { sendBookingEmail, sendOTPEmail } = require('../utils/email'); 
const mongoose = require('mongoose');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const verifyIsCutoffExpired = (eventDate, eventTime) => {
    try {
        const [hours, minutes] = eventTime.split(':');
        const eventDateTime = new Date(eventDate);
        eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return (eventDateTime - new Date()) / (1000 * 60 * 60) < 12;
    } catch (e) {
        return true;
    }
};

// ==========================================================
// 📨 SECURE TRANSACTIONAL OTP DELIVERY PIPELINE
// ==========================================================
exports.sendBookingOTP = async (req, res) => {
    try {
        const cleanEmail = req.user.email.toLowerCase().trim();
        const otp = generateOTP();

        await OTP.deleteMany({ email: cleanEmail, action: 'event_booking' });
        await OTP.create({ email: cleanEmail, otp, action: 'event_booking' });

        console.log(`[SYSTEM MONITOR] Booking OTP generated for ${cleanEmail}: ${otp}`);

        // 🌟 CRITICAL FIX: Explicitly AWAIT the promise to force Vercel to complete delivery
        await sendOTPEmail(cleanEmail, otp, 'event_booking');
        
        return res.status(200).json({ 
            success: true,
            message: 'OTP verification token dispatched successfully to your email.' 
        });

    } catch (error) {
        console.error("Booking OTP Node Failure:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Email delivery system failed to transmit security verification token.', 
            error: error.message 
        });
    }
};

exports.bookEvent = async (req, res) => {
    const session = await mongoose.startSession();
    let useTransaction = true;
    let isSessionActive = true; 

    try {
        await session.startTransaction();
    } catch (e) {
        useTransaction = false;
    }

    try {
        const { eventId, otp, selectedSeatIds, bookerName, bookerPhone, bookerEmail } = req.body;
        const cleanEmail = (bookerEmail || req.user.email).toLowerCase().trim();
        const cleanOTP = otp ? otp.toString().trim() : "";

        const validOTP = await OTP.findOne({ email: req.user.email.toLowerCase().trim(), otp: cleanOTP, action: "event_booking" });
        if (!validOTP) {
            if (useTransaction && session.inTransaction()) await session.abortTransaction();
            await session.endSession();
            isSessionActive = false;
            return res.status(400).json({ message: "Invalid or expired OTP token confirmation code." });
        }

        const event = useTransaction 
            ? await Event.findById(eventId).session(session)
            : await Event.findById(eventId);

        if (!event) {
            if (useTransaction && session.inTransaction()) await session.abortTransaction();
            await session.endSession();
            isSessionActive = false;
            return res.status(404).json({ message: "Target event profile records missing." });
        }

        if (verifyIsCutoffExpired(event.date, event.time)) {
            if (useTransaction && session.inTransaction()) await session.abortTransaction();
            await session.endSession();
            isSessionActive = false;
            return res.status(400).json({ message: "Booking has closed for this event. Ticket sales end 12 hours prior to showtime." });
        }

        if (!selectedSeatIds || !Array.isArray(selectedSeatIds) || selectedSeatIds.length === 0) {
            if (useTransaction && session.inTransaction()) await session.abortTransaction();
            await session.endSession();
            isSessionActive = false;
            return res.status(400).json({ message: "No seat coordinate matrix entries selected." });
        }

        const requestedSeatsCount = selectedSeatIds.length;
        if (event.availableSeats < requestedSeatsCount) {
            if (useTransaction && session.inTransaction()) await session.abortTransaction();
            await session.endSession();
            isSessionActive = false;
            return res.status(400).json({ message: "Insufficient seat capacity allocations remain." });
        }

        let internalLayoutUpdate = [...event.seatMapLayout];
        let finalizedSeatsData = [];
        let runningTotalCost = 0;

        for (let targetSeatId of selectedSeatIds) {
            const seatIdx = internalLayoutUpdate.findIndex(s => s.seatId === targetSeatId);
            
            if (seatIdx === -1) {
                if (useTransaction && session.inTransaction()) await session.abortTransaction();
                await session.endSession();
                isSessionActive = false;
                return res.status(400).json({ message: `Seat ${targetSeatId} does not exist.` });
            }

            const currentSeatStatus = internalLayoutUpdate[seatIdx].status;
            const isLockedByMe = currentSeatStatus === 'Locked' && 
                                 internalLayoutUpdate[seatIdx].lockedBy?.toString() === req.user.id;

            if (currentSeatStatus !== 'Available' && !isLockedByMe) {
                if (useTransaction && session.inTransaction()) await session.abortTransaction();
                await session.endSession();
                isSessionActive = false;
                return res.status(400).json({ message: `Seat ${targetSeatId} is currently reserved or sold.` });
            }

            const explicitSeatPrice = event.ticketPrice;
            runningTotalCost += explicitSeatPrice;

            internalLayoutUpdate[seatIdx].status = 'Booked';
            internalLayoutUpdate[seatIdx].lockedAt = null;
            internalLayoutUpdate[seatIdx].lockedBy = null;
            internalLayoutUpdate[seatIdx].bookingDetails = {
                userName: bookerName || req.user.name,
                userEmail: cleanEmail,
                paidAmount: explicitSeatPrice,
                bookingDate: new Date()
            };

            finalizedSeatsData.push({
                name: bookerName || req.user.name,
                seatNumber: targetSeatId
            });
        }

        const bookingPayload = {
            userId: req.user.id,
            eventId: eventId,
            totalSeats: requestedSeatsCount,
            attendees: finalizedSeatsData, 
            seatNumbers: selectedSeatIds,
            status: "confirmed",
            paymentStatus: "paid", 
            amount: runningTotalCost,
            transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            invoiceLink: "",
            ticketLink: ""
        };

        const createdBookings = useTransaction
            ? await Booking.create([bookingPayload], { session })
            : await Booking.create([bookingPayload]);

        event.availableSeats -= requestedSeatsCount;
        event.seatMapLayout = internalLayoutUpdate;
        
        if (useTransaction) {
            await event.save({ session });
            await OTP.deleteOne({ _id: validOTP._id }).session(session);
            await session.commitTransaction();
        } else {
            await event.save();
            await OTP.deleteOne({ _id: validOTP._id });
        }
        
        await session.endSession();
        isSessionActive = false;

        const responseBookingData = createdBookings[0].toObject ? createdBookings[0].toObject() : createdBookings[0];

        // 🌟 CRITICAL FIX: Explicitly AWAIT final booking confirmation ticket emails
        try {
            await sendBookingEmail(cleanEmail, bookerName || req.user.name, event.title, {
                seatNumbers: selectedSeatIds,
                attendees: finalizedSeatsData,
                amount: runningTotalCost,
                transactionId: bookingPayload.transactionId
            });
        } catch (mailErr) {
            console.error("Mailer notification trace error:", mailErr.message);
        }

        try {
            const bookingAlert = await Notification.create({
                userId: req.user.id,
                title: 'Passes Successfully Allocated!',
                message: `Your booking for "${event.title}" (Seats: ${selectedSeatIds.join(', ')}) is recorded under ID: ${responseBookingData.transactionId}.`,
                type: 'SUCCESS'
            });

            if (req.io) {
                req.io.to(`user-room-${req.user.id}`).emit('user_notification_alert', bookingAlert);
            }
        } catch (notifyErr) {
            console.error("Non-blocking context write error:", notifyErr.message);
        }

        return res.status(201).json({
            message: "Seating reservation established successfully.",
            booking: responseBookingData
        });

    } catch (error) {
        if (useTransaction && session.inTransaction()) {
            await session.abortTransaction();
        }
        if (isSessionActive) {
            await session.endSession();
        }
        return res.status(500).json({ message: "Server database failure.", error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'confirmed';
        booking.paymentStatus = req.body.paymentStatus || 'paid';
        await booking.save();

        return res.json({ message: 'Manual status synchronization absolute.', booking });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const queryFilter = req.user.role === 'admin' ? {} : { userId: req.user.id };
        const dataManifest = await Booking.find(queryFilter)
            .populate({ path: 'eventId', select: 'title location date time image status ticketPrice category' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return res.json(dataManifest);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('userId', 'name email');
        if (!booking) return res.status(404).json({ message: 'Booking records missing.' });

        const bookerIdStr = booking.userId?._id ? booking.userId._id.toString() : booking.userId.toString();
        if (bookerIdStr !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const event = await Event.findById(booking.eventId);
        if (event) {
            const timeDifferenceHours = (new Date(event.date) - new Date()) / (1000 * 60 * 60);
            if (timeDifferenceHours < 24 && req.user.role !== 'admin') {
                return res.status(400).json({ message: 'Cancellations are locked within 24 hours of event kickoff.' });
            }

            const updatedSeatMapLayout = event.seatMapLayout.map(seat => {
                if (booking.seatNumbers.includes(seat.seatId)) {
                    return { 
                        seatId: seat.seatId,
                        rowNumber: seat.rowNumber,
                        colNumber: seat.colNumber,
                        status: 'Available', 
                        lockedAt: null, 
                        lockedBy: null,
                        bookingDetails: { userName: '', userEmail: '', paidAmount: 0, bookingDate: null }
                    };
                }
                return seat;
            });

            await Event.updateOne(
                { _id: event._id },
                { 
                    $inc: { availableSeats: booking.totalSeats },
                    $set: { seatMapLayout: updatedSeatMapLayout }
                }
            );
        }

        await Booking.updateOne(
            { _id: booking._id },
            { $set: { status: 'cancelled', paymentStatus: 'refunded' } }
        );

        try {
            const targetUserEmail = booking.userId?.email || req.user.email;
            const targetUserName = booking.userId?.name || req.user.name;
            
            // 🌟 CRITICAL FIX: Explicitly AWAIT cancellation logs
            await sendBookingEmail(
                targetUserEmail, 
                targetUserName, 
                `⚠️ CANCELLED: ${event ? event.title : 'Event Experience Pass'}`, 
                {
                    seatNumbers: booking.seatNumbers,
                    attendees: booking.attendees,
                    amount: booking.amount,
                    transactionId: booking.transactionId
                }
            );
        } catch (mailErr) {
            console.error("Cancellation automated receipt system delivery failure:", mailErr.message);
        }

        try {
            const notificationTargetUserId = booking.userId?._id || booking.userId;
            if (notificationTargetUserId) {
                const cancelNotification = await Notification.create({
                    userId: notificationTargetUserId,
                    title: 'Booking Cancelled',
                    message: `Your seating reservation for "${event ? event.title : 'Selected Event'}" has been successfully cancelled. Refund processing initiated.`,
                    type: 'ALERT'
                });
            }
        } catch (notifyErr) {
            console.error("Non-blocking cancellation notification error trace:", notifyErr.message);
        }

        return res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error handling cancellation routine.', error: error.message });
    }
};

exports.requestBookingRefund = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized refund query context rejected.' });
        }

        if (booking.paymentStatus === 'refunded' || booking.status === 'cancelled') {
            return res.status(400).json({ message: 'This transaction record has already been voided or settled.' });
        }

        booking.paymentStatus = 'refund_pending';
        await booking.save();

        return res.json({ message: 'Refund request processed. Pending operations review approval.', booking });
    } catch (error) {
        return res.status(500).json({ message: 'Refund creation runtime issue.', error: error.message });
    }
};

exports.verifyTicketCheckIn = async (req, res) => {
    try {
        const { bookingId, seatId } = req.body;

        const targetEvent = await Event.findOne({ "seatMapLayout.seatId": seatId });
        if (!targetEvent) {
            return res.status(404).json({ message: 'No event grid matching this seat allocation exists.' });
        }

        const layoutCopy = [...targetEvent.seatMapLayout];
        const targetIndex = layoutCopy.findIndex(s => s.seatId === seatId && s.status === 'Booked');

        if (targetIndex === -1) {
            return res.status(400).json({ message: 'Ticket validation error: Target seat is unassigned or open.' });
        }

        if (layoutCopy[targetIndex].bookingDetails.checkInStatus === 'Checked In') {
            return res.status(400).json({ message: 'Security Warning: This ticket pass has already been processed at a gate.' });
        }

        layoutCopy[targetIndex].bookingDetails.checkInStatus = 'Checked In';
        targetEvent.seatMapLayout = layoutCopy;
        await targetEvent.save();

        return res.json({
            success: true,
            message: `Check-in authorization absolute. Welcome! Mapped seat row: ${seatId}.`
        });
    } catch (error) {
        return res.status(500).json({ message: 'Scanning runtime checkpoint critical break.', error: error.message });
    }
};