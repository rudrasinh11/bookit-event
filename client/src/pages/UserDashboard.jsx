import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
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
        if (!user) { navigate('/login'); return; }
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
        if (!window.confirm(`Are you absolutely sure you want to cancel your passes for "${displayTitle}"? This process will completely free your allocated seats.`)) return;
        
        setActionLoadingId(bookingId);
        try {
            await api.delete(`/bookings/${bookingId}`);
            toast.success('Pass successfully cancelled. Structural grid cells released.');
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
            toast.success(data.message || 'Refund processing requested successfully.');
            await fetchUserBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed initializing refund settlement pipelines.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const generateLocalPDF = (booking, type) => {
        const { jsPDF } = window.jspdf;

        if (!jsPDF) {
            alert("System asset pipeline initializing. Please re-trigger download in a moment.");
            return;
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const eventTitle = booking.eventId?.title || 'BookIT Omitted/Deleted Event';
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
            verticalLabelArray.forEach(char => {
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
            doc.text('DATE & TIME CLOCK CONFIG', contentX, contentGridYCursor);
            doc.text('ALLOCATED SEAT MATRIX', contentX + 80, contentGridYCursor);

            contentGridYCursor += 4.5;
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(43, 38, 33);
            const formattedDateTimeStr = booking.eventId?.date ? `${new Date(booking.eventId.date).toLocaleDateString()} - ${booking.eventId?.time || '18:00'}` : 'N/A (Deleted Event)';
            doc.text(formattedDateTimeStr, contentX, contentGridYCursor);
            
            doc.setTextColor(163, 42, 42); 
            doc.text(seatNumbersString, contentX + 80, contentGridYCursor);

            contentGridYCursor += 8;
            doc.setTextColor(140, 122, 107);
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.text('PHYSICAL VENUE MAP LOCATION', contentX, contentGridYCursor);

            contentGridYCursor += 4.5;
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(43, 38, 33);
            const wrappedLocationLines = doc.splitTextToSize(booking.eventId?.location || 'Omitted from database parameters', 138);
            doc.text(wrappedLocationLines, contentX, contentGridYCursor);

            contentGridYCursor += (wrappedLocationLines.length * 4.5) + 2;
            doc.setTextColor(140, 122, 107);
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.text('PASSENGER MANIFEST ACCOUNT', contentX, contentGridYCursor);

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
            doc.text('YOUR RESERVED SEAT SPATIAL ASSIGNMENT MAP:', contentX, contentGridYCursor);

            contentGridYCursor += 4;
            doc.setFillColor(219, 211, 201);
            doc.rect(contentX, contentGridYCursor, 138, 4, 'F');
            doc.setFontSize(6.5);
            doc.setTextColor(43, 38, 33);
            doc.text('PERFORMANCE STAGE FOCUS ORIENTATION', contentX + 69, contentGridYCursor + 3, { align: 'center' });

            contentGridYCursor += 8;
            const columnsCount = 10;
            const squareBoxSize = 6.2;
            const innerSpacingGap = 1.6;

            const alphabetRows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
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
            doc.text('Billed Remittance Target Account:', 15, 48);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Name Identification: ${booking.userId?.name || user?.name}`, 15, 54);
            doc.text(`Communication Routing: ${booking.userId?.email || user?.email}`, 15, 60);
            doc.text(`Timestamp: ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : new Date().toLocaleString()}`, 15, 66);

            const tableColumns = ['Line Item Specification Description', 'Volume Pass Pool', 'Gross Price Net'];
            const tableRows = [
                [
                    `Admission Pass Credentials for: ${eventTitle}\nAllocated Coordinates: ${seatNumbersString}`,
                    booking.totalSeats || 1,
                    `INR ${booking.amount}`
                ]
            ];

            doc.autoTable({
                startY: 75,
                head: [tableColumns],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [43, 38, 33], textColor: [244, 239, 234], fontStyle: 'bold' },
                styles: { fontSize: 11, cellPadding: 6 },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 30, halign: 'center' },
                    2: { cellWidth: 30, halign: 'right' }
                }
            });

            const closingHeightMarker = doc.lastAutoTable.finalY + 15;
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(`Payment Status Protocol:`, 130, closingHeightMarker);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(6, 95, 70); 
            doc.text(booking.paymentStatus?.toUpperCase() || 'PAID', 178, closingHeightMarker);

            doc.setTextColor(43, 38, 33);
            doc.setFontSize(15);
            doc.text(`Grand Total Remitted: INR ${booking.amount}`, 195, closingHeightMarker + 10, { align: 'right' });

            doc.save(`Invoice_Receipt_${booking._id?.slice(-6).toUpperCase()}.pdf`);
        }
    };

    const processFiltersPipeline = () => {
        return bookings.filter((b) => {
            const isEventUnavailable = !b.eventId || b.eventId.status === 'Cancelled';

            if (isEventUnavailable) {
                const matchesUnavailableSearch = searchQuery.trim() === '' || 'deleted cancelled removed event'
                    .includes(searchQuery.toLowerCase());

                if (!matchesUnavailableSearch) return false;
                if (statusFilter === 'UPCOMING' || statusFilter === 'COMPLIMENTARY') return false;
                return true;
            }
            
            const matchEventTitle = b.eventId.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
            if (!matchEventTitle) return false;

            const targetEventDate = b.eventId.date ? new Date(b.eventId.date) : new Date();
            const executionTimeCheckCurrent = new Date();

            if (statusFilter === 'UPCOMING') return b.status === 'confirmed' && targetEventDate >= executionTimeCheckCurrent;
            if (statusFilter === 'COMPLIMENTARY') return b.eventId.ticketPrice === 0 || false;
            if (statusFilter === 'CANCELLED') return b.status === 'cancelled' || isEventUnavailable;
            return true;
        });
    };

    const evaluatedFilterCollection = processFiltersPipeline();

    if (loading) return (
        <div className="w-full bg-[#2B2621] min-h-screen flex items-center justify-center">
            <div className="text-center text-[#F4EFEA]/80">
                <RefreshCw className="animate-spin text-[#8C7A6B] mx-auto mb-3" size={24} />
                <p className="text-xs font-bold uppercase tracking-widest">Syncing workspace indices...</p>
            </div>
        </div>
    );

    return (
        <div className="w-full bg-[#2B2621] text-[#F4EFEA] transition-colors duration-300 min-h-screen pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Identity Profile Header Banner */}
                <div className="bg-[#3D352E] rounded-2xl p-6 md:p-8 border border-[#A32A2A]/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F4EFEA] text-[#2B2621] rounded-xl flex items-center justify-center text-lg font-black">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-wide text-[#F4EFEA] uppercase">{user?.name}</h1>
                            <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider mt-0.5">Clearance Role: <span className="font-mono text-[#F4EFEA]/90">{user?.role}</span></p>
                        </div>
                    </div>
                    <div className="bg-[#2B2621]/60 border border-[#8C7A6B]/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#8C7A6B]">
                        UID: {user?._id?.slice(-12)}
                    </div>
                </div>

                {/* Metrics Framework Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[#8C7A6B] uppercase tracking-widest mb-0.5">Total Purchases</span>
                            <h4 className="text-2xl font-black text-[#F4EFEA] font-mono">{bookings.length}</h4>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Ticket size={16} /></div>
                    </div>
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[#8C7A6B] uppercase tracking-widest mb-0.5">Active Passes</span>
                            <h4 className="text-2xl font-black text-emerald-400 font-mono">{bookings.filter(b => b.status === 'confirmed').length}</h4>
                        </div>
                        <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20"><CalendarCheck size={16} /></div>
                    </div>
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-bold text-[#8C7A6B] uppercase tracking-widest mb-0.5">Total Remitted</span>
                            <h4 className="text-2xl font-black text-[#F4EFEA] font-mono">₹{bookings.reduce((sum, b) => b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h4>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Wallet size={16} /></div>
                    </div>
                </div>

                {/* Filtration Toolbar Segment */}
                <div className="bg-[#3D352E] p-3.5 rounded-xl border border-[#8C7A6B]/30 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-3 text-[#8C7A6B]" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search workspace entries..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full pl-9 pr-4 py-2 bg-[#2B2621]/60 border border-[#8C7A6B]/30 text-xs font-bold focus:outline-none rounded-xl text-[#F4EFEA] placeholder-[#8C7A6B]" 
                        />
                    </div>
                    
                    <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0">
                        {['ALL', 'UPCOMING', 'COMPLIMENTARY', 'CANCELLED'].map((mode) => (
                            <button 
                                key={mode} 
                                onClick={() => setStatusFilter(mode)} 
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                                    statusFilter === mode 
                                        ? 'bg-[#A32A2A] text-[#F4EFEA] border-transparent shadow-md' 
                                        : 'bg-[#2B2621]/60 text-[#8C7A6B] border-[#8C7A6B]/20 hover:bg-[#3D352E] hover:text-[#F4EFEA]'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ledger Listing Section */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B] flex items-center gap-2">
                        <History size={14} /> Historical Transaction Ledger ({evaluatedFilterCollection.length})
                    </h2>

                    {evaluatedFilterCollection.length === 0 ? (
                        <div className="bg-[#3D352E] p-12 rounded-2xl text-center border border-[#8C7A6B]/30 shadow-xl">
                            <p className="text-[#8C7A6B] text-xs font-bold uppercase tracking-wider">No matching ledger entities correspond to the selected criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {evaluatedFilterCollection.map(booking => {
                                const isEventDeleted = !booking.eventId || booking.eventId?.status === 'Cancelled';
                                const targetEventDate = booking.eventId?.date ? new Date(booking.eventId.date) : new Date();
                                const hourDelta = (targetEventDate - new Date()) / (1000 * 60 * 60);
                                const isEligibleForRefund = !isEventDeleted && hourDelta >= 24 && booking.status === 'confirmed';

                                return (
                                    <div key={booking._id} className="bg-[#3D352E] border border-[#8C7A6B]/30 rounded-2xl shadow-xl hover:border-[#8C7A6B] transition-all flex flex-col justify-between overflow-hidden">
                                        <div className="p-5 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <span className="text-[9px] font-mono font-bold bg-[#2B2621]/60 border border-[#8C7A6B]/20 text-[#8C7A6B] px-2 py-0.5 rounded uppercase">REF: #{booking._id?.slice(-8).toUpperCase()}</span>
                                                    <h3 className="text-base font-bold text-[#F4EFEA] mt-2 leading-tight tracking-wide">
                                                        {booking.eventId?.title || '⚠️ Experience Removed from Event Catalog'}
                                                    </h3>
                                                    {isEventDeleted && (
                                                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-400">
                                                            This event is no longer available on the platform.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                                                        booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>{booking.status}</span>
                                                    <span className="text-[9px] font-bold text-[#8C7A6B] font-mono uppercase bg-[#2B2621]/60 px-1.5 py-0.5 rounded border border-[#8C7A6B]/20">{booking.paymentStatus || 'Paid'}</span>
                                                </div>
                                            </div>

                                            {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                                                <div className="bg-[#2B2621]/40 border border-[#8C7A6B]/20 p-3 rounded-xl space-y-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#8C7A6B] block">Manifest Assignments ({booking.totalSeats || booking.seatNumbers.length})</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {booking.seatNumbers.map((seat, idx) => (
                                                            <span key={idx} className="inline-block px-2 py-0.5 bg-[#3D352E] border border-[#8C7A6B]/30 rounded text-[10px] font-medium text-[#D1D5DB] shadow-inner">
                                                                <span className="font-bold font-mono text-[#F4EFEAexport]">{seat}</span>: {booking.attendees?.[idx]?.name || user?.name || "Holder"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-[#D1D5DB] space-y-1 font-medium">
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#8C7A6B]" /> {booking.eventId?.location || "Omitted Location Coordinate Node"}</div>
                                                <div className="text-[10px] text-[#8C7A6B] font-bold uppercase tracking-wider font-mono">Settled Block: {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className="bg-[#2B2621]/40 border-t border-[#8C7A6B]/20 p-3 flex flex-col gap-2.5">
                                            <div className="flex gap-2 w-full">
                                                <button 
                                                    type="button"
                                                    disabled={booking.status === 'cancelled'}
                                                    onClick={() => generateLocalPDF(booking, 'TICKET')} 
                                                    className="flex-1 py-2.5 bg-[#F4EFEA] text-[#2B2621] rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1 hover:bg-[#D1D5DB] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
                                                >
                                                    <Download size={12} /> Download Passes
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => generateLocalPDF(booking, 'INVOICE')} 
                                                    className="px-3.5 py-2.5 border border-[#8C7A6B]/30 bg-[#3D352E] text-[#D1D5DB] rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1 hover:bg-[#2B2621] transition-colors"
                                                >
                                                    <FileText size={12} /> Invoice
                                                </button>
                                            </div>

                                            {booking.status === 'confirmed' && (
                                                <div className="flex gap-2 border-t border-dashed border-[#8C7A6B]/20 pt-2 w-full">
                                                    {isEligibleForRefund ? (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === booking._id}
                                                            onClick={() => handleCancelBooking(booking._id, booking.eventId?.title)}
                                                            className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-opacity hover:bg-red-500/20"
                                                        >
                                                            <XCircle size={11} /> Cancel Seat Pass (Refund Eligible)
                                                        </button>
                                                    ) : (
                                                        <div className="w-full flex flex-col gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isEventDeleted || booking.paymentStatus === 'refund_pending' || actionLoadingId === booking._id}
                                                                onClick={() => handleRequestRefund(booking._id)}
                                                                className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-opacity hover:bg-amber-500/20 disabled:opacity-40"
                                                            >
                                                                <AlertCircle size={11} /> {booking.paymentStatus === 'refund_pending' ? 'Refund Review In Flight' : isEventDeleted ? 'Refund Action Forced (Deleted Event)' : 'File Operations Refund Request'}
                                                            </button>
                                                            <p className="text-[8px] font-bold text-[#8C7A6B] text-center uppercase tracking-wider">
                                                                {isEventDeleted ? 'Platform event was removed by administration.' : 'Cancellation locked. Show execution starts in under 24 hours.'}
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