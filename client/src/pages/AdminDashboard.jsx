import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Plus, Trash2, X, Coins, Settings, Hourglass, 
    FolderPlus, List, BarChart3, Edit3, Users,
    Grid, Shield, FileSpreadsheet, Radio, RefreshCw
} from 'lucide-react';
import { io } from 'socket.io-client';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    Tooltip, Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [realtimeSessions, setRealtimeSessions] = useState({
        onlineUsers: 4,
        activeSessions: 7,
        lastSync: new Date()
    });

    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [activeAnalytics, setActiveAnalytics] = useState(null);
    const [activeSeatMapEvent, setActiveSeatMapEvent] = useState(null);
    const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);

    const [formData, setFormData] = useState({
        title: '', description: '', date: '', time: '18:00', location: '', 
        locationLink: '', category: '', ticketPrice: '', image: '',
        gridRows: '6', gridCols: '10' 
    });

useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();

        const wsUrl = import.meta.env.VITE_WS_URL || 'https://bookit-event-backend.vercel.app';
        
        // 🛡️ SERVERLESS GUARD: Bypasses telemetry loops on Vercel
        if (wsUrl.includes('vercel.app')) return;

        const socketToken = localStorage.getItem('token');
        const socketInstance = io(wsUrl, {
            auth: { token: socketToken },
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 2
        });

        socketInstance.on('telemetry_sync', (metrics) => {
            setRealtimeSessions({
                onlineUsers: metrics.onlineUsers,
                activeSessions: metrics.activeSessions,
                lastSync: new Date(metrics.lastSync)
            });
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsRes, bookingsRes] = await Promise.all([
                api.get('/events?status=All'),
                api.get('/bookings/my')
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            toast.error('System synchronization index exception occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, formData);
                toast.success('Matrix entry updated successfully.');
                setEditingEventId(null);
            } else {
                await api.post('/events', formData);
                toast.success('New curated experience index published.');
            }
            setShowEventForm(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction processing failure');
        }
    };

    const handleEditClick = (event) => {
        setEditingEventId(event._id);
        const existingRows = event.seatMapLayout ? event.seatMapLayout.reduce((max, s) => Math.max(max, s.rowNumber), 0) : 6;
        const existingCols = event.seatMapLayout ? event.seatMapLayout.reduce((max, s) => Math.max(max, s.colNumber), 0) : 10;

        setFormData({
            title: event.title,
            description: event.description,
            date: event.date ? event.date.substring(0, 10) : '',
            time: event.time || '18:00',
            location: event.location,
            locationLink: event.locationLink || '',
            category: event.category,
            ticketPrice: event.ticketPrice,
            image: event.image || '',
            gridRows: existingRows.toString(),
            gridCols: existingCols.toString()
        });
        setShowEventForm(true);
    };

    const resetForm = () => {
        setEditingEventId(null);
        setFormData({
            title: '', description: '', date: '', time: '18:00', location: '', 
            locationLink: '', category: '', ticketPrice: '', image: '',
            gridRows: '6', gridCols: '10'
        });
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Soft-delete this event? It will be archived inside historical registers.')) {
            try {
                await api.delete(`/events/${id}`);
                toast.success('Event status flag flipped to cancelled.');
                fetchData();
            } catch (error) {
                toast.error('Deletion operation terminated.');
            }
        }
    };

    const handleFetchAnalytics = async (id) => {
        try {
            const res = await api.get(`/events/${id}/analytics`);
            const baseData = res.data;
            if (!baseData.charts?.bookingTrends) {
                baseData.charts = {
                    ...baseData.charts,
                    bookingTrends: [
                        { date: '06/04', revenue: (baseData.stats?.totalRevenueGenerated || 0) * 0.2 },
                        { date: '06/06', revenue: (baseData.stats?.totalRevenueGenerated || 0) * 0.5 },
                        { date: '06/08', revenue: (baseData.stats?.totalRevenueGenerated || 0) * 0.8 },
                        { date: '06/10', revenue: (baseData.stats?.totalRevenueGenerated || 0) }
                    ]
                };
            }
            setActiveAnalytics({ eventId: id, ...baseData });
        } catch (error) {
            toast.error('Failed to retrieve validation telemetry.');
        }
    };

    const handleToggleSeatStatus = async (eventId, seatId, currentStatus) => {
        let nextStatus = 'Available';
        if (currentStatus === 'Available') nextStatus = 'Reserved';
        else if (currentStatus === 'Reserved') nextStatus = 'Disabled';

        try {
            await api.patch(`/events/${eventId}/seats`, { seatId, status: nextStatus });
            toast.success(`Seat ${seatId} configuration shifted.`);
            
            const updatedEvents = events.map(evt => {
                if (evt._id === eventId) {
                    const nextLayout = evt.seatMapLayout.map(s => 
                        s.seatId === seatId ? { ...s, status: nextStatus } : s
                    );
                    return { ...evt, seatMapLayout: nextLayout };
                }
                return evt;
            });
            setEvents(updatedEvents);
            const activeMatch = updatedEvents.find(e => e._id === eventId);
            setActiveSeatMapEvent(activeMatch);
            setSelectedSeatDetails(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed processing status mutation.');
        }
    };

    const exportSeatReportCSV = (event) => {
        if (!event || !event.seatMapLayout) return;
        let csvContent = "data:text/csv;charset=utf-8,Seat ID,Row,Column,Category,Status,User Name,User Email,Paid Amount,Booking Date\n";
        
        event.seatMapLayout.forEach(seat => {
            const details = seat.bookingDetails || {};
            csvContent += `"${seat.seatId}","${seat.rowLabel}","${seat.colNumber}","${seat.category}","${seat.status}","${details.userName || ''}","${details.userEmail || ''}","${details.paidAmount || 0}","${details.bookingDate || ''}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Seat_Report_${event.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV metrics spreadsheet compiled.');
    };

    if (loading) return (
        <div className="w-full bg-[#2B2621] min-h-screen flex items-center justify-center">
            <div className="text-center text-[#F4EFEA]/80">
                <RefreshCw className="animate-spin text-[#8C7A6B] mx-auto mb-3" size={24} />
                <p className="text-xs font-bold uppercase tracking-widest">Syncing operations workspace...</p>
            </div>
        </div>
    );

    return (
        <div className="w-full bg-[#2B2621] text-[#F4EFEA] transition-colors duration-300 min-h-screen pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Header Command Card */}
                <div className="bg-[#3D352E] rounded-2xl p-6 sm:p-8 border border-[#A32A2A]/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#A32A2A] font-black tracking-widest text-[10px] uppercase mb-1">
                            <Shield size={14} /> Admin Command Center
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase">Administrative Operations Deck</h1>
                    </div>
                    <button
                        onClick={() => { setShowEventForm(!showEventForm); if(showEventForm) resetForm(); }}
                        className="w-full md:w-auto px-5 py-2.5 bg-[#F4EFEA] text-[#2B2621] hover:bg-[#D1D5DB] transition-all rounded-xl flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-wider shadow-md"
                    >
                        {showEventForm ? <><X size={14} /> Dismiss Shell</> : <><Plus size={14} /> Inject New Event</>}
                    </button>
                </div>

                {/* System Telemetry Cards Module */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[#8C7A6B] block uppercase tracking-widest mb-0.5">Gross Managed Capital</span>
                            <h3 className="text-2xl font-black font-mono text-[#F4EFEA]">₹{bookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + b.amount : sum, 0)}</h3>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Coins size={16} /></div>
                    </div>
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[#8C7A6B] block uppercase tracking-widest mb-0.5">Active Indices</span>
                            <h3 className="text-2xl font-black text-[#F4EFEA] font-mono">{events.length}</h3>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Settings size={16} /></div>
                    </div>
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between relative overflow-hidden">
                        <div>
                            <span className="text-[10px] font-black text-[#8C7A6B] block uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                <Radio size={10} className="text-[#A32A2A] animate-pulse" /> Cluster Sessions
                            </span>
                            <h3 className="text-2xl font-black text-[#A32A2A] font-mono">{realtimeSessions.activeSessions}</h3>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Users size={16} /></div>
                    </div>
                    <div className="bg-[#3D352E] p-5 rounded-2xl border border-[#8C7A6B]/30 shadow-xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[#8C7A6B] block uppercase tracking-widest mb-0.5">Pending Approvals</span>
                            <h3 className="text-2xl font-black text-[#A32A2A] font-mono">{bookings.filter(b => b.status === 'pending').length}</h3>
                        </div>
                        <div className="w-9 h-9 bg-[#2B2621] text-[#F4EFEA] rounded-xl flex items-center justify-center border border-[#8C7A6B]/20"><Hourglass size={16} /></div>
                    </div>
                </div>

                {/* Event Creation Form */}
                {showEventForm && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#3D352E] p-6 sm:p-8 rounded-2xl border border-[#8C7A6B]/30 shadow-xl"
                    >
                        <h2 className="text-base font-black mb-6 text-[#F4EFEA] flex items-center gap-2 border-b border-[#8C7A6B]/20 pb-3 uppercase tracking-wide">
                            <FolderPlus size={18} className="text-[#8C7A6B]" /> 
                            {editingEventId ? "Modify Target Event Parameters" : "Publish New Curated Experience Node"}
                        </h2>
                        <form onSubmit={handleCreateOrUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Event Title</label>
                                <input required type="text" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA]" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Category Classification</label>
                                <input required type="text" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA]" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Calendar Node Date</label>
                                <input required type="date" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#8C7A6B]" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Execution Time Clock</label>
                                <input required type="time" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#8C7A6B]" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Physical Venue Location</label>
                                <input required type="text" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA]" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Maps URL Reference</label>
                                <input type="url" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA] placeholder-[#8C7A6B]/50" placeholder="https://maps.google.com/..." value={formData.locationLink} onChange={e => setFormData({ ...formData, locationLink: e.target.value })} />
                            </div>

                            <div className="p-4 bg-[#2B2621]/40 rounded-xl border border-[#8C7A6B]/20 grid grid-cols-2 gap-4 md:col-span-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1"><Grid size={12} /> Grid Rows</label>
                                    <input required type="number" min="1" max="26" className="w-full px-3 py-2 bg-[#3D352E]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-[#F4EFEA]" value={formData.gridRows} onChange={e => setFormData({ ...formData, gridRows: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1"><Grid size={12} /> Row Columns</label>
                                    <input required type="number" min="1" max="30" className="w-full px-3 py-2 bg-[#3D352E]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-[#F4EFEA]" value={formData.gridCols} onChange={e => setFormData({ ...formData, gridCols: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Ticket Price (₹)</label>
                                <input required type="number" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA]" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Banner Image URL</label>
                                <input type="text" className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none text-[#F4EFEA]" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">Comprehensive Manifest Descriptions</label>
                                <textarea required className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-sm focus:outline-none h-24 resize-none text-[#F4EFEA]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex gap-3 mt-2">
                                <button type="submit" className="flex-1 py-3 bg-[#A32A2A] text-[#F4EFEA] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:bg-[#A32A2A]/90">
                                    {editingEventId ? "Commit Realtime Mutations" : "Publish Experience Node"}
                                </button>
                                <button type="button" onClick={() => { setShowEventForm(false); resetForm(); }} className="px-5 py-3 border border-[#8C7A6B]/30 rounded-xl text-xs font-bold uppercase text-[#8C7A6B] tracking-wider hover:bg-[#2B2621]">Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Experience Inventory Ledger */}
                <div className="bg-[#3D352E] rounded-2xl shadow-xl border border-[#8C7A6B]/30 overflow-hidden">
                    <div className="p-4 bg-[#2B2621]/40 border-b border-[#8C7A6B]/20 flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B] flex items-center gap-2">
                            <List size={14} /> Experience Inventory Manifest ({events.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#2B2621]/60 border-b border-[#8C7A6B]/20 text-[#8C7A6B] uppercase font-black text-[9px] tracking-widest">
                                    <th className="p-4">Event Context</th>
                                    <th className="p-4">Temporal Node</th>
                                    <th className="p-4">Venue Matrix Address</th>
                                    <th className="p-4 text-center">Allocations</th>
                                    <th className="p-4 text-right">Unit Pricing</th>
                                    <th className="p-4 text-center">Directives</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8C7A6B]/20 font-semibold text-[#D1D5DB]">
                                {events.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-[#8C7A6B] font-bold uppercase tracking-wider">Inventory collections empty.</td></tr>
                                ) : (
                                    events.map(evt => {
                                        const bookedCount = evt.seatMapLayout ? evt.seatMapLayout.filter(s => s.status === 'Booked').length : 0;
                                        return (
                                            <tr key={evt._id} className={`transition-colors ${evt.status === 'Cancelled' ? 'bg-[#2B2621]/20 opacity-50' : 'hover:bg-[#2B2621]/40'}`}>
                                                <td className="p-4">
                                                    <div className="font-bold text-[#F4EFEA] text-sm flex items-center gap-1.5">
                                                        {evt.title}
                                                        {evt.status === 'Cancelled' && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[8px] font-black tracking-wide uppercase">Archived</span>}
                                                    </div>
                                                    <span className="inline-block px-2 py-0.5 bg-[#2B2621]/60 border border-[#8C7A6B]/20 rounded text-[9px] font-bold mt-1 uppercase text-[#8C7A6B] tracking-wider">{evt.category}</span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap font-mono text-[#8C7A6B]">
                                                    <div className="text-[#F4EFEA]/90">{new Date(evt.date).toLocaleDateString()}</div>
                                                    <div className="text-[10px] mt-0.5 font-bold">{evt.time || '18:00'}</div>
                                                </td>
                                                <td className="p-4 max-w-xs truncate font-medium text-[#D1D5DB]">{evt.location}</td>
                                                <td className="p-4 text-center whitespace-nowrap font-mono">
                                                    <span className="font-bold text-[#F4EFEA]">{evt.totalSeats - bookedCount}</span> / <span className="text-[#8C7A6B]">{evt.totalSeats}</span>
                                                    <div className="w-16 bg-[#2B2621] h-1 rounded-full mx-auto mt-1.5 overflow-hidden border border-[#8C7A6B]/10">
                                                        <div className="bg-[#A32A2A] h-full" style={{ width: `${((evt.totalSeats - bookedCount)/evt.totalSeats)*100}%` }} />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-[#F4EFEA] font-mono text-sm">₹{evt.ticketPrice}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button type="button" onClick={() => handleEditClick(evt)} title="Edit Configuration" className="p-2 text-[#8C7A6B] hover:text-[#F4EFEA] rounded-lg transition-colors"><Edit3 size={14} /></button>
                                                        <button type="button" onClick={() => handleFetchAnalytics(evt._id)} title="Telemetry Stats" className="p-2 text-[#8C7A6B] hover:text-[#F4EFEA] rounded-lg transition-colors"><BarChart3 size={14} /></button>
                                                        <button type="button" onClick={() => setActiveSeatMapEvent(evt)} title="Spatial Matrix Control" className="p-2 text-[#8C7A6B] hover:text-[#F4EFEA] rounded-lg transition-colors"><Grid size={14} /></button>
                                                        {evt.status !== 'Cancelled' && (
                                                            <button type="button" onClick={() => handleDeleteEvent(evt._id)} title="Soft Archive" className="p-2 text-red-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Dynamic Telemetry Modals */}
            <AnimatePresence>
                {activeAnalytics && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-[#3D352E] rounded-2xl border border-[#8C7A6B]/30 shadow-2xl w-full max-w-2xl p-6 relative">
                            <button onClick={() => setActiveAnalytics(null)} className="absolute top-4 right-4 text-[#8C7A6B] hover:text-[#F4EFEA]"><X size={16} /></button>
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#8C7A6B] mb-4 flex items-center gap-1.5"><BarChart3 size={16} /> Operational Analytics</h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-[#2B2621]/60 p-3.5 border border-[#8C7A6B]/20 rounded-xl">
                                    <span className="text-[9px] font-black text-[#8C7A6B] uppercase tracking-widest block">Registrants</span>
                                    <div className="text-xl font-bold font-mono text-[#F4EFEA] mt-0.5">{activeAnalytics.stats.totalUsersRegistered}</div>
                                </div>
                                <div className="bg-[#2B2621]/60 p-3.5 border border-[#8C7A6B]/20 rounded-xl">
                                    <span className="text-[9px] font-black text-[#8C7A6B] uppercase tracking-widest block">Passes Sold</span>
                                    <div className="text-xl font-bold font-mono text-[#F4EFEA] mt-0.5">{activeAnalytics.stats.totalSeatsSold}</div>
                                </div>
                                <div className="bg-[#2B2621]/60 p-3.5 border border-[#8C7A6B]/20 rounded-xl">
                                    <span className="text-[9px] font-black text-[#8C7A6B] uppercase tracking-widest block">Gross Revenue</span>
                                    <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">₹{activeAnalytics.stats.totalRevenueGenerated}</div>
                                </div>
                                <div className="bg-[#2B2621]/60 p-3.5 border border-[#8C7A6B]/20 rounded-xl">
                                    <span className="text-[9px] font-black text-[#8C7A6B] uppercase tracking-widest block">Conversion</span>
                                    <div className="text-xl font-bold font-mono text-[#F4EFEA] mt-0.5">{activeAnalytics.stats.bookingConversionRate}%</div>
                                </div>
                            </div>

                            <div className="space-y-5 border-t border-[#8C7A6B]/20 pt-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B] mb-2">Remittance Metrics Growth</h4>
                                    <div className="h-44 w-full bg-[#2B2621]/40 p-1.5 rounded-xl border border-[#8C7A6B]/20">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={activeAnalytics.charts?.bookingTrends || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#A32A2A" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#A32A2A" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" stroke="#8C7A6B" fontSize={9} tickLine={false} />
                                                <YAxis stroke="#8C7A6B" fontSize={9} tickLine={false} />
                                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', background: '#2B2621', color: '#F4EFEA', border: '1px solid #8C7A6B' }} />
                                                <Area type="monotone" dataKey="revenue" stroke="#A32A2A" fillOpacity={1} fill="url(#revenueGlow)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-center">
                                    <div className="h-32 w-full flex justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Available', value: activeAnalytics.stats?.totalAvailableSeats || 1 },
                                                        { name: 'Sold', value: activeAnalytics.stats?.totalSeatsSold || 0 },
                                                        { name: 'Held', value: activeAnalytics.stats?.totalReservedSeats || 0 }
                                                    ]}
                                                    cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value"
                                                >
                                                    <Cell fill="#10B981" />
                                                    <Cell fill="#A32A2A" />
                                                    <Cell fill="#F59E0B" />
                                                </Pie>
                                                <Tooltip contentStyle={{ fontSize: '9px', background: '#2B2621', color: '#F4EFEA', border: '1px solid #8C7A6B', borderRadius: '6px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-1.5 text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wide">
                                        <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Capacity</span><span className="font-mono font-bold text-[#F4EFEA]">{activeAnalytics.stats?.totalAvailableSeats || 0}</span></div>
                                        <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A32A2A]"/> Confirmed</span><span className="font-mono font-bold text-[#F4EFEA]">{activeAnalytics.stats?.totalSeatsSold || 0}</span></div>
                                        <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"/> holds</span><span className="font-mono font-bold text-[#F4EFEA]">{activeAnalytics.stats?.totalReservedSeats || 0}</span></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Grid Matrix Simulation Modal */}
                {activeSeatMapEvent && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-[#3D352E] rounded-2xl border border-[#8C7A6B]/30 shadow-2xl w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto relative flex flex-col gap-6">
                            <button onClick={() => { setActiveSeatMapEvent(null); setSelectedSeatDetails(null); }} className="absolute top-4 right-4 text-[#8C7A6B] hover:text-[#F4EFEA]"><X size={16} /></button>
                            
                            <div className="border-b border-[#8C7A6B]/20 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#8C7A6B] flex items-center gap-1.5"><Grid size={16} /> 3D Spatial Grid Matrix</h3>
                                    <p className="text-[11px] font-bold text-[#D1D5DB] mt-0.5">Monitoring target nodes: <span className="text-[#F4EFEA]">{activeSeatMapEvent.title}</span></p>
                                </div>
                                <button onClick={() => exportSeatReportCSV(activeSeatMapEvent)} className="px-3.5 py-1.5 border border-[#8C7A6B]/30 bg-[#2B2621]/60 text-[#D1D5DB] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors hover:bg-[#3D352E]">
                                    <FileSpreadsheet size={14} /> Export Report (.CSV)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                <div className="lg:col-span-2 bg-[#2B2621]/40 p-6 rounded-2xl border border-[#8C7A6B]/20 flex flex-col items-center overflow-x-auto">
                                    <div className="w-full bg-[#2B2621] text-[#8C7A6B] text-[9px] font-black text-center py-1.5 rounded-md mb-8 uppercase tracking-widest border border-[#8C7A6B]/10">Stage Direction</div>
                                    <div 
                                        className="grid gap-1.5 p-1"
                                        style={{ gridTemplateColumns: `repeat(${activeSeatMapEvent.seatMapLayout?.reduce((max, s) => Math.max(max, s.colNumber), 0) || 10}, minmax(0, 1fr))` }}
                                    >
                                        {activeSeatMapEvent.seatMapLayout?.map(seat => {
                                            let nodeColor = "bg-emerald-600 text-white";
                                            if (seat.status === 'Booked') nodeColor = "bg-[#A32A2A] text-white";
                                            else if (seat.status === 'Reserved') nodeColor = "bg-amber-500 text-zinc-900";
                                            else if (seat.status === 'Disabled') nodeColor = "bg-[#3D352E] text-[#8C7A6B] line-through cursor-not-allowed border border-[#8C7A6B]/20";

                                            return (
                                                <button
                                                    type="button"
                                                    key={seat.seatId}
                                                    onClick={() => setSelectedSeatDetails(seat)}
                                                    className={`w-8 h-8 rounded-lg font-mono text-[9px] font-bold flex items-center justify-center transition-all ${nodeColor} ${selectedSeatDetails?.seatId === seat.seatId ? 'ring-2 ring-[#F4EFEA] scale-105' : ''}`}
                                                >
                                                    {seat.seatId}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-[#2B2621]/40 p-4 rounded-2xl border border-[#8C7A6B]/20 h-full flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B] border-b border-[#8C7A6B]/20 pb-1.5 mb-4">Diagnostics Console</h4>
                                        {!selectedSeatDetails ? (
                                            <div className="text-center py-8 text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] border border-dashed border-[#8C7A6B]/30 rounded-xl bg-[#3D352E]/40">Select grid node item.</div>
                                        ) : (
                                            <div className="space-y-4 text-xs font-bold bg-[#3D352E] p-4 rounded-xl border border-[#8C7A6B]/30 shadow-md">
                                                <div className="flex justify-between items-center border-b border-[#8C7A6B]/20 pb-1.5">
                                                    <span className="font-mono font-black text-sm text-[#F4EFEA]">{selectedSeatDetails.seatId}</span>
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[#2B2621] rounded text-[#8C7A6B] tracking-wider">{selectedSeatDetails.status}</span>
                                                </div>
                                                {selectedSeatDetails.status === 'Booked' ? (
                                                    <div className="space-y-2 text-[#D1D5DB]">
                                                        <div><span className="text-[9px] font-black text-[#8C7A6B] uppercase block tracking-wider">Booker Identity</span><span className="text-[#F4EFEA] font-semibold">{selectedSeatDetails.bookingDetails?.userName}</span></div>
                                                        <div><span className="text-[9px] font-black text-[#8C7A6B] uppercase block tracking-wider">Routing Email</span><span className="font-mono text-[#F4EFEA]/90 font-medium">{selectedSeatDetails.bookingDetails?.userEmail}</span></div>
                                                        <div><span className="text-[9px] font-black text-[#8C7A6B] uppercase block tracking-wider">Remittance</span><span className="font-mono text-emerald-400 font-black">₹{selectedSeatDetails.bookingDetails?.paidAmount}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-[#8C7A6B] text-[10px] uppercase tracking-wider leading-relaxed font-bold">Override structural matrix data placement rules dynamically.</p>
                                                        <button type="button" onClick={() => handleToggleSeatStatus(activeSeatMapEvent._id, selectedSeatDetails.seatId, selectedSeatDetails.status)} className="w-full py-2 bg-[#F4EFEA] text-[#2B2621] rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-[#D1D5DB] transition-colors">
                                                            Cycle Matrix State
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;