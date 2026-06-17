import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Calendar, MapPin, ArrowLeft, Users,
    Key, AlertTriangle, User, Phone, Mail, Ticket, Star, MessageSquare, Image
} from 'lucide-react';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [seatSyncing, setSeatSyncing] = useState(false);

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookerDetails, setBookerDetails] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

    useEffect(() => {
        fetchEventDetails();
        fetchEventReviews();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data } = await api.get(`/events/${id}`);

            if (!data || data.status === 'Cancelled') {
                setEvent(null);
                toast.error('This event is no longer available.');
                return;
            }

            setEvent(data);

            if (user) {
                setBookerDetails({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || ''
                });
            }
        } catch (error) {
            setEvent(null);
            toast.error(
                error.response?.status === 404
                    ? 'This event is no longer available.'
                    : 'Failed to load event details.'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchEventReviews = async () => {
        try {
            const { data } = await api.get(`/events/${id}/reviews`);
            setReviews(data);
        } catch (err) {
            console.error('Failed to load event reviews:', err);
        }
    };

    const handleSeatToggleSelection = async (seatId) => {
        if (!user) {
            toast.error('Please login to select seats.');
            navigate('/login');
            return;
        }

        if (seatSyncing) return;

        const isSelected = selectedSeats.includes(seatId);
        const nextSelectedSeats = isSelected
            ? selectedSeats.filter((item) => item !== seatId)
            : [...selectedSeats, seatId];

        setSelectedSeats(nextSelectedSeats);
        setSeatSyncing(true);

        try {
            await api.post(`/events/${id}/lock`, { seatIds: nextSelectedSeats });
        } catch (err) {
            setSelectedSeats(selectedSeats);
            toast.error(err.response?.data?.message || 'Seat reservation conflict encountered.');
            fetchEventDetails();
        } finally {
            setSeatSyncing(false);
        }
    };

    const handleRequestOTP = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (selectedSeats.length === 0) {
            toast.error('Please select at least 1 seat first.');
            return;
        }

        setOtpLoading(true);
        try {
            const { data } = await api.post('/bookings/send-otp');
            setOtpSent(true);
            toast.success(data.message || 'Verification code sent successfully.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send verification code.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!otp || otp.trim().length !== 6) {
            toast.error('Please enter a valid 6-digit OTP.');
            return;
        }

        if (!bookerDetails.name.trim() || !bookerDetails.phone.trim() || !bookerDetails.email.trim()) {
            toast.error('Please complete all booking details.');
            return;
        }

        if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat.');
            return;
        }

        setBookingLoading(true);
        try {
            await api.post('/bookings', {
                eventId: id,
                otp: otp.trim(),
                selectedSeatIds: selectedSeats,
                bookerName: bookerDetails.name,
                bookerPhone: bookerDetails.phone,
                bookerEmail: bookerDetails.email
            });

            toast.success('Booking completed successfully.');
            setTimeout(() => navigate('/payment-success'), 1200);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction processing failure.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            toast.error('Please write a review comment.');
            return;
        }

        setReviewSubmitLoading(true);
        try {
            const { data } = await api.post(`/events/${id}/reviews`, {
                rating: newRating,
                comment: newComment.trim()
            });

            toast.success(data.message || 'Review submitted successfully.');
            setNewComment('');
            fetchEventReviews();
            fetchEventDetails();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    'You can only review events you successfully booked and attended.'
            );
        } finally {
            setReviewSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-shell min-h-screen flex items-center justify-center">
                <div className="text-center text-[var(--app-muted)]">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--app-accent)] border-t-transparent mx-auto mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="page-shell min-h-screen flex items-center justify-center p-4">
                <div className="panel-surface max-w-md w-full p-6 text-center shadow-2xl">
                    <p className="text-red-500 font-bold mb-4">Event not found</p>
                    <Link
                        to="/"
                        className="inline-block px-4 py-2 bg-[var(--app-button)] text-[var(--app-button-text)] rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const colsCount =
        event.seatMapLayout?.reduce((max, s) => Math.max(max, s.colNumber), 0) || 10;

    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container py-4">

                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--app-muted)] hover:text-[var(--app-text)] mb-6 transition-colors group"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    Back to Catalog
                </Link>

                {event.isBookingClosed && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm">
                        <AlertTriangle size={16} className="text-red-500" />
                        Booking closed for this event.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="panel-surface overflow-hidden shadow-2xl">
                            <div className="h-52 sm:h-72 bg-[var(--app-bg)] relative border-b border-[color:var(--app-border)]">
                                {event.image ? (
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--app-surface-soft)] text-[var(--app-brand)] font-black text-xl uppercase tracking-widest">
                                        {event.category}
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 bg-[var(--app-button)] text-[var(--app-button-text)] text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-transparent">
                                    {event.category}
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-[var(--app-text)] mb-1.5">
                                        {event.title}
                                    </h1>
                                    <p className="text-[var(--app-muted)] text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                        <MapPin size={12} className="text-[var(--app-brand)]" /> {event.location}
                                    </p>
                                </div>

                                <p className="text-[var(--app-muted)] text-sm leading-relaxed border-t border-[color:var(--app-border)] pt-4 font-medium">
                                    {event.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--app-muted)] pt-2 uppercase tracking-wider">
                                    <span className="flex items-center gap-1 bg-[var(--app-bg)] border border-[color:var(--app-border)] px-2.5 py-1 rounded-md">
                                        <Star size={12} className="text-amber-500 fill-amber-500" />
                                        {event.averageRating || '5.0'}
                                    </span>
                                    <span className="bg-[var(--app-bg)] border border-[color:var(--app-border)] px-2.5 py-1 rounded-md">
                                        {event.reviewsCount || reviews.length} Reviews
                                    </span>
                                    <span className="bg-[var(--app-bg)] border border-[color:var(--app-border)] px-2.5 py-1 rounded-md">
                                        Popularity: {event.popularityScore || 0}
                                    </span>
                                </div>

                                {event.tags && event.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {event.tags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 border border-[color:var(--app-border)] text-[var(--app-brand)] text-[10px] uppercase tracking-wider rounded-md font-bold"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {event.imageGallery && event.imageGallery.length > 0 && (
                            <div className="panel-surface p-6 shadow-2xl space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-text)] flex items-center gap-1.5">
                                    <Image size={14} className="text-[var(--app-brand)]" /> Experience Gallery
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {event.imageGallery.map((imgUrl, i) => (
                                        <div
                                            key={i}
                                            className="h-24 rounded-xl overflow-hidden border border-[color:var(--app-border)] bg-[var(--app-bg)] shadow-md group cursor-pointer"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Gallery node ${i}`}
                                                onClick={() => window.open(imgUrl, '_blank')}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!event.isBookingClosed && (
                            <div className="panel-surface p-6 shadow-2xl space-y-4 flex flex-col items-center overflow-hidden">
                                <div className="w-full text-center text-[var(--app-brand)] font-black uppercase tracking-[0.3em] text-[9px] py-2 bg-[var(--app-bg)]/70 border border-[color:var(--app-border)] rounded-xl mb-8">
                                    Screen / Stage Direction
                                </div>

                                <div
                                    className="grid gap-2 max-w-full overflow-x-auto p-1"
                                    style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
                                >
                                    {event.seatMapLayout?.map((seat) => {
                                        const isSelected = selectedSeats.includes(seat.seatId);
                                        let styleClasses =
                                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20';
                                        let isButtonDisabled = seatSyncing;

                                        if (seat.status === 'Booked') {
                                            styleClasses =
                                                'bg-red-500/10 text-red-500/50 border-red-500/20 cursor-not-allowed shadow-none';
                                            isButtonDisabled = true;
                                        } else if (seat.status === 'Reserved') {
                                            styleClasses =
                                                'bg-amber-500/10 text-amber-500/50 border-transparent cursor-not-allowed';
                                            isButtonDisabled = true;
                                        } else if (seat.status === 'Disabled') {
                                            styleClasses =
                                                'bg-[var(--app-bg)] text-[var(--app-muted)] border-transparent line-through cursor-not-allowed';
                                            isButtonDisabled = true;
                                        } else if (seat.status === 'Locked' && !isSelected) {
                                            styleClasses =
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-not-allowed animate-pulse';
                                            isButtonDisabled = true;
                                        } else if (isSelected) {
                                            styleClasses =
                                                'bg-[var(--app-button)] text-[var(--app-button-text)] border-transparent font-black ring-2 ring-[var(--app-accent)] shadow-lg';
                                        }

                                        return (
                                            <button
                                                key={seat.seatId}
                                                disabled={isButtonDisabled}
                                                onClick={() => handleSeatToggleSelection(seat.seatId)}
                                                className={`w-8 h-8 rounded-lg border font-mono text-[9px] font-bold transition-all flex items-center justify-center shadow-sm ${styleClasses}`}
                                                title={`Seat ${seat.seatId} (${seat.category})`}
                                            >
                                                {seat.seatId}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold text-[var(--app-muted)] mt-8 pt-4 border-t border-[color:var(--app-border)] w-full uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-md" /> Available</div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[var(--app-button)] rounded-md" /> Selected</div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-md" /> Sold</div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-md" /> Locked</div>
                                </div>
                            </div>
                        )}

                        <div className="panel-surface p-6 shadow-2xl space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-text)] flex items-center gap-2">
                                <MessageSquare size={14} className="text-[var(--app-brand)]" /> Community Reviews
                            </h3>

                            {user ? (
                                <form
                                    onSubmit={handleReviewSubmit}
                                    className="space-y-4 bg-[var(--app-bg)]/45 p-4 rounded-xl border border-[color:var(--app-border)] shadow-inner"
                                >
                                    <span className="text-[9px] font-bold text-[var(--app-muted)] uppercase block tracking-widest">
                                        Leave Verified Review
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-[var(--app-text)] font-semibold">Rating:</label>
                                        <select
                                            value={newRating}
                                            onChange={(e) => setNewRating(Number(e.target.value))}
                                            className="input-surface px-2 py-1 text-xs font-bold"
                                        >
                                            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                                            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                                            <option value="3">⭐⭐⭐ 3 Stars</option>
                                            <option value="2">⭐⭐ 2 Stars</option>
                                            <option value="1">⭐ 1 Star</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <textarea
                                            placeholder="Write your review here..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            required
                                            className="input-surface w-full p-3 text-xs h-20 resize-none font-medium"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={reviewSubmitLoading}
                                        className="btn-surface px-4 py-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {reviewSubmitLoading ? 'Saving...' : 'Submit Review'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-4 bg-[var(--app-bg)]/35 rounded-xl border border-[color:var(--app-border)] text-center text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider">
                                    Please sign in to write a verified review.
                                </div>
                            )}

                            <div className="space-y-3 pt-1">
                                {reviews.length === 0 ? (
                                    <p className="text-center text-xs font-bold py-8 border border-dashed border-[color:var(--app-border)] rounded-xl bg-[var(--app-bg)]/20 text-[var(--app-muted)] uppercase tracking-wider">
                                        No reviews yet.
                                    </p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div
                                            key={rev._id}
                                            className="p-4 bg-[var(--app-bg)]/45 border border-[color:var(--app-border)] rounded-xl space-y-1 shadow-md"
                                        >
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-[var(--app-text)] uppercase tracking-wide text-[11px]">
                                                    {rev.userName}
                                                </span>
                                                <span className="text-amber-500 font-bold tracking-tight">
                                                    {'★'.repeat(rev.rating)}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-[var(--app-muted)] leading-relaxed pt-1">
                                                {rev.comment}
                                            </p>
                                            <span className="text-[9px] font-mono font-bold text-[var(--app-brand)] block pt-1">
                                                {new Date(rev.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Summary */}
                    <div className="space-y-6">
                        <div className="panel-surface p-6 shadow-2xl space-y-5">
                            <div>
                                <span className="text-[9px] font-bold text-[var(--app-brand)] uppercase tracking-widest block mb-1">
                                    Pass Summary
                                </span>
                                <div className="text-2xl font-black text-[var(--app-text)] tracking-tight font-mono">
                                    {event.ticketPrice === 0 ? (
                                        <span className="text-emerald-500 font-black text-xs tracking-widest">
                                            COMPLIMENTARY PASS
                                        </span>
                                    ) : (
                                        <span>
                                            ₹{event.ticketPrice * selectedSeats.length}{' '}
                                            <span className="text-xs text-[var(--app-muted)] font-bold tracking-normal">
                                                ({selectedSeats.length} Selected)
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-[color:var(--app-border)]" />

                            <div className="space-y-3 text-xs font-bold text-[var(--app-muted)] uppercase tracking-wide">
                                <div className="flex items-start gap-2.5">
                                    <Calendar className="text-[var(--app-brand)] shrink-0 mt-0.5" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[var(--app-brand)] text-[9px] tracking-widest">Timing</span>
                                        <span className="text-[var(--app-text)] mt-0.5 font-semibold text-[11px] tracking-normal">
                                            {new Date(event.date).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}{' '}
                                            at {event.time || '18:00'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Users className="text-[var(--app-brand)] shrink-0 mt-0.5" size={14} />
                                    <div className="flex flex-col">
                                        <span className="text-[var(--app-brand)] text-[9px] tracking-widest">Availability</span>
                                        <span className="text-[var(--app-text)] mt-0.5 font-semibold text-[11px] tracking-normal">
                                            {event.availableSeats} passes left
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!event.isBookingClosed && (
                                <div className="space-y-4 pt-4 border-t border-[color:var(--app-border)]">
                                    <span className="text-[9px] font-bold uppercase text-[var(--app-brand)] block tracking-widest">
                                        Booker Details
                                    </span>

                                    <div className="space-y-2">
                                        <div className="relative flex items-center">
                                            <User className="absolute left-3 text-[var(--app-brand)]" size={12} />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Full Name"
                                                value={bookerDetails.name}
                                                onChange={(e) =>
                                                    setBookerDetails({ ...bookerDetails, name: e.target.value })
                                                }
                                                className="input-surface w-full pl-9 pr-3 py-2.5 text-xs font-semibold"
                                            />
                                        </div>

                                        <div className="relative flex items-center">
                                            <Mail className="absolute left-3 text-[var(--app-brand)]" size={12} />
                                            <input
                                                required
                                                type="email"
                                                placeholder="Email Address"
                                                value={bookerDetails.email}
                                                onChange={(e) =>
                                                    setBookerDetails({ ...bookerDetails, email: e.target.value })
                                                }
                                                className="input-surface w-full pl-9 pr-3 py-2.5 text-xs font-mono"
                                            />
                                        </div>

                                        <div className="relative flex items-center">
                                            <Phone className="absolute left-3 text-[var(--app-brand)]" size={12} />
                                            <input
                                                required
                                                type="tel"
                                                placeholder="Contact Phone Number"
                                                value={bookerDetails.phone}
                                                onChange={(e) =>
                                                    setBookerDetails({ ...bookerDetails, phone: e.target.value })
                                                }
                                                className="input-surface w-full pl-9 pr-3 py-2.5 text-xs font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {selectedSeats.length > 0 && (
                                        <div className="p-2.5 bg-[var(--app-bg)]/60 border border-[color:var(--app-border)] rounded-xl text-[10px] font-mono font-black text-[var(--app-text)] text-center tracking-widest">
                                            SELECTED SEATS: {selectedSeats.join(', ')}
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleRequestOTP}
                                            disabled={otpLoading || selectedSeats.length === 0 || seatSyncing}
                                            className="w-full py-2.5 rounded-xl text-[10px] font-bold border border-[color:var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-soft)] uppercase tracking-widest transition-all disabled:opacity-30"
                                        >
                                            {otpLoading
                                                ? 'Sending...'
                                                : otpSent
                                                ? 'Resend OTP'
                                                : 'Generate Verification OTP'}
                                        </button>

                                        <AnimatePresence>
                                            {otpSent && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-2 pt-1 overflow-hidden"
                                                >
                                                    <div className="relative flex items-center">
                                                        <Key className="absolute left-3 text-[var(--app-brand)]" size={12} />
                                                        <input
                                                            type="text"
                                                            maxLength="6"
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            placeholder="Enter 6-Digit OTP"
                                                            className="input-surface w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleBooking}
                                                        disabled={bookingLoading || !otp || seatSyncing}
                                                        className="w-full bg-[var(--app-button)] text-[var(--app-button-text)] py-3 rounded-xl text-xs uppercase font-black tracking-widest disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-xl"
                                                    >
                                                        {bookingLoading ? (
                                                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Ticket size={14} /> Book {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
                                                            </>
                                                        )}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EventDetail;