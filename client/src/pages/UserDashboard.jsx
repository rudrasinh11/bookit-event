import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Ticket, CalendarCheck, History, Wallet, Search,
    Download, MapPin, FileText, RefreshCw, XCircle, AlertCircle
} from 'lucide-react';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchUserBookings();
    }, [user, navigate]);

    const fetchUserBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching dashboard indexes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId, eventTitle) => {
        const displayTitle = eventTitle || 'this removed experience';
        if (!window.confirm(`Are you sure you want to cancel your passes for "${displayTitle}"?`)) return;

        setActionLoadingId(bookingId);
        try {
            await api.delete(`/bookings/${bookingId}`);
            toast.success('Pass cancelled successfully.');
            await fetchUserBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cancellation window has locked down.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRequestRefund = async (bookingId) => {
        setActionLoadingId(bookingId);
        try {
            const { data } = await api.post(`/bookings/${bookingId}/refund`);
            toast.success(data.message || 'Refund request submitted successfully.');
            await fetchUserBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initialize refund request.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const generateLocalPDF = (booking, type) => {
        const { jsPDF } = window.jspdf;

        if (!jsPDF) {
            alert('PDF engine is still loading. Please try again in a moment.');
            return;
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const eventTitle = booking.eventId?.title || 'BookIT Removed Event';
        const seatNumbersString = booking.seatNumbers?.join(', ') || 'N/A';
        const trackingToken = booking.transactionId || `TXN-${booking._id?.slice(-8).toUpperCase()}`;

        if (type === 'TICKET') {
            const seatMap = booking.eventId?.seatMapLayout || [];
            const maxRowNumber = seatMap.reduce((max, s) => Math.max(max, s.rowNumber || 1), 0) || 6;

            const startX = 15;
            const startY = 25;
            const ticketWidth = 180;
            const ticketHeight = 115 + (maxRowNumber * 8.5);

            doc.setDrawColor(140, 122, 107);
            doc.setLineWidth(0.3);
            doc.setFillColor(244, 239, 234);
            doc.rect(startX, startY, ticketWidth, ticketHeight, 'FD');

            doc.setFillColor(43, 38, 33);
            doc.rect(startX, startY, 15, ticketHeight, 'F');

            doc.setTextColor(244, 239, 234);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);

            const verticalLabelArray = ['A', 'D', 'M', 'I', 'T', ' ', 'O', 'N', 'E'];
            let initialVerticalYOffset = startY + (ticketHeight / 2) - 22;
            verticalLabelArray.forEach((char) => {
                doc.text(char, startX + 7.5, initialVerticalYOffset, { align: 'center' });
                initialVerticalYOffset += 5.5;
            });

            const contentX = startX + 22;

            doc.setTextColor(163, 42, 42);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('VIP ACCESS PASS', contentX, startY + 11);

            doc.setFont('Courier', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(140, 122, 107);
            doc.text(`PASS_REF: ${booking._id?.slice(-8).toUpperCase()}`, startX + ticketWidth - 10, startY + 11, { align: 'right' });

            doc.setDrawColor(140, 122, 107);
            doc.setLineWidth(0.2);
            doc.line(contentX, startY + 14, startX + ticketWidth - 10, startY + 14);

            doc.setTextColor(43, 38, 33);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(14);
            const wrappedTitleStringLines = doc.splitTextToSize(eventTitle.toUpperCase(), 138);
            doc.text(wrappedTitleStringLines, contentX, startY + 22);

            let contentGridYCursor = startY + 30 + ((wrappedTitleStringLines.length - 1) * 6);

            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(140, 122, 107);
            doc.text('DATE & TIME', contentX, contentGridYCursor);
            doc.text('SEAT MATRIX', contentX + 80, contentGridYCursor);

            contentGridYCursor += 4.5;
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(43, 38, 33);
            const formattedDateTimeStr = booking.eventId?.date ? `${new Date(booking.eventId.date).toLocaleDateString()} - ${booking.eventId?.time || '18:00'}` : 'N/A';
            doc.text(formattedDateTimeStr, contentX, contentGridYCursor);

            doc.setTextColor(163, 42, 42);
            doc.text(seatNumbersString, contentX + 80, contentGridYCursor);

            contentGridYCursor += 8;
            doc.setTextColor(140, 122, 107);
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.text('VENUE', contentX, contentGridYCursor);

            contentGridYCursor += 4.5;
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(43, 38, 33);
            const wrappedLocationLines = doc.splitTextToSize(booking.eventId?.location || 'Not available', 138);
            doc.text(wrappedLocationLines, contentX, contentGridYCursor);

            contentGridYCursor += (wrappedLocationLines.length * 4.5) + 2;
            doc.setTextColor(140, 122, 107);
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.text('BOOKED BY', contentX, contentGridYCursor);

            contentGridYCursor += 4.5;
            doc.setFontSize(9.5);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(43, 38, 33);
            const primaryPassengerStr = `${booking.userId?.name || user?.name} (${booking.userId?.email || user?.email})`;
            doc.text(primaryPassengerStr, contentX, contentGridYCursor);

            contentGridYCursor += 7;
            doc.setDrawColor(140, 122, 107);
            doc.setLineWidth(0.2);
            doc.line(contentX, contentGridYCursor, startX + ticketWidth - 10, contentGridYCursor);

            contentGridYCursor += 6;
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(140, 122, 107);
            doc.text('RESERVED SEAT MAP', contentX, contentGridYCursor);

            contentGridYCursor += 4;
            doc.setFillColor(219, 211, 201);
            doc.rect(contentX, contentGridYCursor, 138, 4, 'F');
            doc.setFontSize(6.5);
            doc.setTextColor(43, 38, 33);
            doc.text('STAGE / SCREEN', contentX + 69, contentGridYCursor + 3, { align: 'center' });

            contentGridYCursor += 8;
            const columnsCount = 10;
            const squareBoxSize = 6.2;
            const innerSpacingGap = 1.6;
            const alphabetRows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const activeRowsList = alphabetRows.slice(0, maxRowNumber);
            const gridTotalWidth = (columnsCount * squareBoxSize) + ((columnsCount - 1) * innerSpacingGap);
            const gridCenteringStartX = contentX + ((138 - gridTotalWidth) / 2);
            const cleanUserSeatsArray = booking.seatNumbers || [];

            activeRowsList.forEach((rowLabel, rowIndex) => {
                let currentBoxX = gridCenteringStartX;
                let currentBoxY = contentGridYCursor + (rowIndex * (squareBoxSize + innerSpacingGap));

                for (let colIndex = 1; colIndex <= columnsCount; colIndex++) {
                    const compiledTargetSeatCode = `${rowLabel}-${colIndex}`;
                    const isUserAllocatedSeat = cleanUserSeatsArray.includes(compiledTargetSeatCode);

                    if (isUserAllocatedSeat) {
                        doc.setFillColor(163, 42, 42);
                        doc.setDrawColor(120, 15, 8);
                        doc.rect(currentBoxX, currentBoxY, squareBoxSize, squareBoxSize, 'FD');
                        doc.setTextColor(244, 239, 234);
                        doc.setFont('Helvetica', 'bold');
                        doc.setFontSize(4.5);
                        doc.text(compiledTargetSeatCode, currentBoxX + (squareBoxSize / 2), currentBoxY + (squareBoxSize / 2) + 1.2, { align: 'center' });
                    } else {
                        doc.setFillColor(235, 229, 222);
                        doc.setDrawColor(200, 190, 180);
                        doc.rect(currentBoxX, currentBoxY, squareBoxSize, squareBoxSize, 'FD');
                        doc.setTextColor(140, 122, 107);
                        doc.setFont('Helvetica', 'normal');
                        doc.setFontSize(4);
                        doc.text(compiledTargetSeatCode, currentBoxX + (squareBoxSize / 2), currentBoxY + (squareBoxSize / 2) + 1.2, { align: 'center' });
                    }
                    currentBoxX += squareBoxSize + innerSpacingGap;
                }
            });

            const traceBarYMarker = contentGridYCursor + (maxRowNumber * (squareBoxSize + innerSpacingGap)) + 5;
            doc.setDrawColor(140, 122, 107);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(startX, traceBarYMarker, startX + ticketWidth, traceBarYMarker);
            doc.setLineDashPattern([], 0);

            doc.save(`Ticket_Pass_${booking._id?.slice(-6).toUpperCase()}.pdf`);
        } else {
            doc.setTextColor(43, 38, 33);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(26);
            doc.text('INVOICE RECEIPT', 15, 25);

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(140, 122, 107);
            doc.text(`Transaction Tracking Key: ${trackingToken}`, 15, 31);

            doc.setTextColor(163, 42, 42);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('BookIT Platform Inc.', 195, 23, { align: 'right' });
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(140, 122, 107);
            doc.text('Automated Clearing Node Control', 195, 29, { align: 'right' });

            doc.setTextColor(43, 38, 33);
            doc.setFont('Helvetica', 'bold');
            doc.text('Billed Remittance Account:', 15, 48);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Name: ${booking.userId?.name || user?.name}`, 15, 54);
            doc.text(`Email: ${booking.userId?.email || user?.email}`, 15, 60);
            doc.text(`Timestamp: ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : new Date().toLocaleString()}`, 15, 66);

            const tableColumns = ['Description', 'Qty', 'Amount'];
            const tableRows = [[`Admission pass for: ${eventTitle}\nSeats: ${seatNumbersString}`, booking.totalSeats || 1, `INR ${booking.amount}`]];

            doc.autoTable({
                startY: 75,
                head: [tableColumns],
                body: tableRows,
                theme: 'striped',
                tableWidth: 'auto',
                headStyles: { fillColor: [43, 38, 33], textColor: [244, 239, 234], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 4.5 },
                columnStyles: {
                    0: { cellWidth: 110 },
                    1: { cellWidth: 24, halign: 'center' },
                    2: { cellWidth: 32, halign: 'right' }
                }
            });

            const closingHeightMarker = doc.lastAutoTable.finalY + 15;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('Payment Status:', 130, closingHeightMarker);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(6, 95, 70);
            doc.text(booking.paymentStatus?.toUpperCase() || 'PAID', 178, closingHeightMarker);

            doc.setTextColor(43, 38, 33);
            doc.setFontSize(15);
            doc.text(`Grand Total: INR ${booking.amount}`, 195, closingHeightMarker + 10, { align: 'right' });

            doc.save(`Invoice_Receipt_${booking._id?.slice(-6).toUpperCase()}.pdf`);
        }
    };

    const processFiltersPipeline = () => {
        return bookings.filter((b) => {
            const isEventUnavailable = !b.eventId || b.eventId.status === 'Cancelled';

            if (isEventUnavailable) {
                const matchesUnavailableSearch = searchQuery.trim() === '' || 'deleted cancelled removed event'.includes(searchQuery.toLowerCase());
                if (!matchesUnavailableSearch) return false;
                if (statusFilter === 'UPCOMING' || statusFilter === 'COMPLIMENTARY') return false;
                return true;
            }

            const matchEventTitle = b.eventId.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
            if (!matchEventTitle) return false;

            const targetEventDate = b.eventId.date ? new Date(b.eventId.date) : new Date();
            const now = new Date();

            if (statusFilter === 'UPCOMING') return b.status === 'confirmed' && targetEventDate >= now;
            if (statusFilter === 'COMPLIMENTARY') return b.eventId.ticketPrice === 0 || false;
            if (statusFilter === 'CANCELLED') return b.status === 'cancelled' || isEventUnavailable;
            return true;
        });
    };

    const evaluatedFilterCollection = processFiltersPipeline();

    if (loading) return (
        <div className="page-shell min-h-screen flex items-center justify-center">
            <div className="text-center text-[var(--app-muted)]">
                <RefreshCw className="animate-spin text-[var(--app-accent)] mx-auto mb-3" size={24} />
                <p className="text-xs font-bold uppercase tracking-widest">Syncing your dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container space-y-8">
                <div className="panel-surface p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--app-button)] text-[var(--app-button-text)] rounded-xl flex items-center justify-center text-lg font-black shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="section-eyebrow mb-1">Personal dashboard</p>
                            <h1 className="text-xl font-black tracking-wide text-[var(--app-text)] uppercase">{user?.name}</h1>
                            <p className="text-sm text-[var(--app-muted)] mt-1">Role: <span className="font-semibold text-[var(--app-text)] capitalize">{user?.role}</span></p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/70 px-3 py-2 text-xs font-mono font-bold text-[var(--app-muted)]">
                        UID: {user?._id?.slice(-12)}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-0.5">Total Purchases</span>
                            <h4 className="text-2xl font-black text-[var(--app-text)] font-mono">{bookings.length}</h4>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]"><Ticket size={16} /></div>
                    </div>
                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-0.5">Active Passes</span>
                            <h4 className="text-2xl font-black text-emerald-500 font-mono">{bookings.filter((b) => b.status === 'confirmed').length}</h4>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20"><CalendarCheck size={16} /></div>
                    </div>
                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest mb-0.5">Total Spent</span>
                            <h4 className="text-2xl font-black text-[var(--app-text)] font-mono">₹{bookings.reduce((sum, b) => b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h4>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]"><Wallet size={16} /></div>
                    </div>
                </div>

                <div className="panel-surface p-3.5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" size={14} />
                        <input
                            type="text"
                            placeholder="Search your bookings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-surface w-full pl-9 pr-4 py-2.5 text-sm font-medium"
                        />
                    </div>

                    <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0">
                        {['ALL', 'UPCOMING', 'COMPLIMENTARY', 'CANCELLED'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setStatusFilter(mode)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${statusFilter === mode ? 'bg-[var(--app-button)] text-[var(--app-button-text)] border-transparent shadow-md' : 'bg-[var(--app-bg)]/70 text-[var(--app-muted)] border-[color:var(--app-border)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--app-accent)] flex items-center gap-2">
                        <History size={14} /> Transaction Ledger ({evaluatedFilterCollection.length})
                    </h2>

                    {evaluatedFilterCollection.length === 0 ? (
                        <div className="panel-surface p-12 text-center">
                            <p className="text-[var(--app-muted)] text-sm font-bold uppercase tracking-wider">No matching bookings found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {evaluatedFilterCollection.map((booking) => {
                                const isEventDeleted = !booking.eventId || booking.eventId?.status === 'Cancelled';
                                const targetEventDate = booking.eventId?.date ? new Date(booking.eventId.date) : new Date();
                                const hourDelta = (targetEventDate - new Date()) / (1000 * 60 * 60);
                                const isEligibleForRefund = !isEventDeleted && hourDelta >= 24 && booking.status === 'confirmed';

                                return (
                                    <div key={booking._id} className="panel-surface overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-200">
                                        <div className="p-5 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <span className="text-[9px] font-mono font-bold bg-[var(--app-bg)]/70 border border-[color:var(--app-border)] text-[var(--app-muted)] px-2 py-0.5 rounded uppercase">REF: #{booking._id?.slice(-8).toUpperCase()}</span>
                                                    <h3 className="text-base font-bold text-[var(--app-text)] mt-2 leading-tight tracking-wide">
                                                        {booking.eventId?.title || '⚠️ Experience Removed from Event Catalog'}
                                                    </h3>
                                                    {isEventDeleted && (
                                                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-500">
                                                            This event is no longer available on the platform.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>{booking.status}</span>
                                                    <span className="text-[9px] font-bold text-[var(--app-muted)] font-mono uppercase bg-[var(--app-bg)]/70 px-1.5 py-0.5 rounded border border-[color:var(--app-border)]">{booking.paymentStatus || 'Paid'}</span>
                                                </div>
                                            </div>

                                            {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                                                <div className="bg-[var(--app-bg)]/45 border border-[color:var(--app-border)] p-3 rounded-xl space-y-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--app-accent)] block">Seat Assignments ({booking.totalSeats || booking.seatNumbers.length})</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {booking.seatNumbers.map((seat, idx) => (
                                                            <span key={idx} className="inline-block px-2 py-0.5 bg-[var(--app-surface)] border border-[color:var(--app-border)] rounded text-[10px] font-medium text-[var(--app-text)] shadow-inner">
                                                                <span className="font-bold font-mono">{seat}</span>: {booking.attendees?.[idx]?.name || user?.name || 'Holder'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-sm text-[var(--app-muted)] space-y-1 font-medium">
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[var(--app-accent)]" /> {booking.eventId?.location || 'Venue unavailable'}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider font-mono">Booked: {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--app-bg)]/45 border-t border-[color:var(--app-border)] p-3 flex flex-col gap-2.5">
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    type="button"
                                                    disabled={booking.status === 'cancelled'}
                                                    onClick={() => generateLocalPDF(booking, 'TICKET')}
                                                    className="btn-surface flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    <Download size={12} /> Download Pass
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => generateLocalPDF(booking, 'INVOICE')}
                                                    className="btn-surface-secondary px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <FileText size={12} /> Invoice
                                                </button>
                                            </div>

                                            {booking.status === 'confirmed' && (
                                                <div className="flex gap-2 border-t border-dashed border-[color:var(--app-border)] pt-2 w-full">
                                                    {isEligibleForRefund ? (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === booking._id}
                                                            onClick={() => handleCancelBooking(booking._id, booking.eventId?.title)}
                                                            className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-500 font-bold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-red-500/20 disabled:opacity-60"
                                                        >
                                                            <XCircle size={11} /> Cancel & Refund
                                                        </button>
                                                    ) : (
                                                        <div className="w-full flex flex-col gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isEventDeleted || booking.paymentStatus === 'refund_pending' || actionLoadingId === booking._id}
                                                                onClick={() => handleRequestRefund(booking._id)}
                                                                className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-amber-500/20 disabled:opacity-40"
                                                            >
                                                                <AlertCircle size={11} /> {booking.paymentStatus === 'refund_pending' ? 'Refund Pending' : isEventDeleted ? 'Deleted Event' : 'Request Refund'}
                                                            </button>
                                                            <p className="text-[8px] font-bold text-[var(--app-muted)] text-center uppercase tracking-wider">
                                                                {isEventDeleted ? 'This event was removed by administration.' : 'Cancellation is locked within 24 hours of event start.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
