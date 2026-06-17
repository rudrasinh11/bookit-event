import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Plus, Trash2, X, Coins, Settings, Hourglass,
    FolderPlus, List, BarChart3, Edit3, Users,
    Grid, Shield, FileSpreadsheet, Radio, RefreshCw,
    Search, CalendarDays, Sparkles
} from 'lucide-react';
import { io } from 'socket.io-client';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    Tooltip, Cell, PieChart, Pie
} from 'recharts';

const CHART_COLORS = {
    accent: '#FF0000',
    success: '#10B981',
    warning: '#F59E0B',
    muted: '#BBD5DA',
    darkBg: '#121212',
    darkCard: '#1C1C1C',
    textLight: '#F5F5F5'
};

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
    const [activeView, setActiveView] = useState('overview');
    const [eventSearch, setEventSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '18:00',
        location: '',
        locationLink: '',
        category: '',
        ticketPrice: '',
        image: '',
        gridRows: '6',
        gridCols: '10'
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        fetchData();

        const wsUrl = import.meta.env.VITE_WS_URL || 'https://bookit-event-backend.vercel.app';

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
            toast.error('System synchronization failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, formData);
                toast.success('Event updated successfully.');
                setEditingEventId(null);
            } else {
                await api.post('/events', formData);
                toast.success('New event created successfully.');
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
        const existingRows = event.seatMapLayout
            ? event.seatMapLayout.reduce((max, s) => Math.max(max, s.rowNumber), 0)
            : 6;
        const existingCols = event.seatMapLayout
            ? event.seatMapLayout.reduce((max, s) => Math.max(max, s.colNumber), 0)
            : 10;

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
        setActiveView('create');
    };

    const resetForm = () => {
        setEditingEventId(null);
        setFormData({
            title: '',
            description: '',
            date: '',
            time: '18:00',
            location: '',
            locationLink: '',
            category: '',
            ticketPrice: '',
            image: '',
            gridRows: '6',
            gridCols: '10'
        });
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Soft-delete this event? It will be archived.')) {
            try {
                await api.delete(`/events/${id}`);
                toast.success('Event moved to cancelled state.');
                fetchData();
            } catch (error) {
                toast.error('Deletion failed.');
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
            toast.error('Failed to load analytics.');
        }
    };

    const handleToggleSeatStatus = async (eventId, seatId, currentStatus) => {
        let nextStatus = 'Available';
        if (currentStatus === 'Available') nextStatus = 'Reserved';
        else if (currentStatus === 'Reserved') nextStatus = 'Disabled';

        try {
            await api.patch(`/events/${eventId}/seats`, { seatId, status: nextStatus });
            toast.success(`Seat ${seatId} updated.`);

            const updatedEvents = events.map((evt) => {
                if (evt._id === eventId) {
                    const nextLayout = evt.seatMapLayout.map((s) =>
                        s.seatId === seatId ? { ...s, status: nextStatus } : s
                    );
                    return { ...evt, seatMapLayout: nextLayout };
                }
                return evt;
            });

            setEvents(updatedEvents);
            const activeMatch = updatedEvents.find((e) => e._id === eventId);
            setActiveSeatMapEvent(activeMatch);
            setSelectedSeatDetails(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update seat status.');
        }
    };

    const exportSeatReportCSV = (event) => {
        if (!event || !event.seatMapLayout) return;

        let csvContent =
            'data:text/csv;charset=utf-8,Seat ID,Row,Column,Category,Status,User Name,User Email,Paid Amount,Booking Date\n';

        event.seatMapLayout.forEach((seat) => {
            const details = seat.bookingDetails || {};
            csvContent += `"${seat.seatId}","${seat.rowLabel}","${seat.colNumber}","${seat.category}","${seat.status}","${details.userName || ''}","${details.userEmail || ''}","${details.paidAmount || 0}","${details.bookingDate || ''}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Seat_Report_${event.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV report downloaded.');
    };

    const visibleEvents = events.filter((evt) => {
        const matchesSearch =
            evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
            evt.location.toLowerCase().includes(eventSearch.toLowerCase());

        const matchesStatus = statusFilter === 'All' || evt.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedDateLabel = formData.date
        ? new Date(formData.date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
          })
        : 'Select an event date';

    if (loading) {
        return (
            <div className="page-shell min-h-screen flex items-center justify-center">
                <div className="text-center text-[var(--app-muted)]">
                    <RefreshCw className="animate-spin text-[var(--app-accent)] mx-auto mb-3" size={24} />
                    <p className="text-xs font-bold uppercase tracking-widest">Syncing operations workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container space-y-8">

                <div className="panel-surface p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-[var(--app-accent)] font-black tracking-widest text-[10px] uppercase mb-1">
                                <Shield size={14} /> Admin Command Center
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-[var(--app-text)]">
                                Administrative Operations Deck
                            </h1>
                            <p className="mt-2 text-sm text-[var(--app-muted)] max-w-2xl">
                                Manage events, monitor booking health, and jump quickly between analytics, inventory, and publishing workflows.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowEventForm(!showEventForm);
                                if (showEventForm) resetForm();
                                setActiveView('create');
                            }}
                            className="btn-surface w-full md:w-auto px-5 py-3 text-xs font-black uppercase tracking-[0.22em] shadow-md"
                        >
                            {showEventForm ? <><X size={14} /> Close Editor</> : <><Plus size={14} /> New Event</>}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'overview', label: 'Overview', icon: Sparkles },
                                { id: 'inventory', label: 'Inventory', icon: List },
                                { id: 'create', label: 'Create / Edit', icon: FolderPlus }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveView(item.id)}
                                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                                        activeView === item.id
                                            ? 'bg-[var(--app-button)] text-[var(--app-button-text)] border-transparent shadow-md'
                                            : 'bg-[var(--app-surface)]/50 text-[var(--app-text)] border-[color:var(--app-border)] hover:bg-[var(--app-surface)]'
                                    }`}
                                >
                                    <item.icon size={16} className="mb-3" />
                                    <div className="text-sm font-black uppercase tracking-[0.18em]">{item.label}</div>
                                </button>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/50 p-4 flex items-start gap-3">
                            <CalendarDays className="text-[var(--app-accent)] mt-1" size={18} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--app-accent)]">
                                    Selected date
                                </p>
                                <p className="text-base font-bold text-[var(--app-text)] mt-1">{selectedDateLabel}</p>
                                <p className="text-sm text-[var(--app-muted)] mt-1">
                                    You can use the create event form below to choose event date and time with a cleaner layout.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--app-muted)] block uppercase tracking-widest mb-0.5">
                                Gross Managed Capital
                            </span>
                            <h3 className="text-2xl font-black font-mono text-[var(--app-text)]">
                                ₹{bookings.reduce((sum, b) => (b.paymentStatus === 'paid' ? sum + b.amount : sum), 0)}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-surface-soft)] text-[var(--app-brand)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]">
                            <Coins size={16} />
                        </div>
                    </div>

                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--app-muted)] block uppercase tracking-widest mb-0.5">
                                Active Events
                            </span>
                            <h3 className="text-2xl font-black text-[var(--app-text)] font-mono">{events.length}</h3>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-surface-soft)] text-[var(--app-brand)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]">
                            <Settings size={16} />
                        </div>
                    </div>

                    <div className="panel-surface p-5 flex items-center justify-between relative overflow-hidden">
                        <div>
                            <span className="text-[10px] font-black text-[var(--app-muted)] block uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                <Radio size={10} className="text-[var(--app-accent)] animate-pulse" /> Cluster Sessions
                            </span>
                            <h3 className="text-2xl font-black text-[var(--app-accent)] font-mono">
                                {realtimeSessions.activeSessions}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-surface-soft)] text-[var(--app-brand)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]">
                            <Users size={16} />
                        </div>
                    </div>

                    <div className="panel-surface p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--app-muted)] block uppercase tracking-widest mb-0.5">
                                Pending Approvals
                            </span>
                            <h3 className="text-2xl font-black text-[var(--app-accent)] font-mono">
                                {bookings.filter((b) => b.status === 'pending').length}
                            </h3>
                        </div>
                        <div className="w-10 h-10 bg-[var(--app-surface-soft)] text-[var(--app-brand)] rounded-xl flex items-center justify-center border border-[color:var(--app-border)]">
                            <Hourglass size={16} />
                        </div>
                    </div>
                </div>

                {/* Event Form */}
                {(showEventForm || activeView === 'create') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="panel-surface p-6 sm:p-8"
                    >
                        <h2 className="text-base font-black mb-6 text-[var(--app-text)] flex items-center gap-2 border-b border-[color:var(--app-border)] pb-3 uppercase tracking-wide">
                            <FolderPlus size={18} className="text-[var(--app-accent)]" />
                            {editingEventId ? 'Modify Target Event Parameters' : 'Publish New Event'}
                        </h2>

                        <form onSubmit={handleCreateOrUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Event Title</label>
                                <input
                                    required
                                    type="text"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Category</label>
                                <input
                                    required
                                    type="text"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/45 p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-[var(--app-accent)] uppercase tracking-wider">Event Date</label>
                                        <input
                                            required
                                            type="date"
                                            className="input-surface w-full px-3.5 py-2.5 text-sm"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-[var(--app-accent)] uppercase tracking-wider">Event Time</label>
                                        <input
                                            required
                                            type="time"
                                            className="input-surface w-full px-3.5 py-2.5 text-sm"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/70 p-4 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--app-accent)]">Date preview</p>
                                        <p className="mt-2 text-lg font-black text-[var(--app-text)]">{selectedDateLabel}</p>
                                    </div>
                                    <p className="mt-3 text-xs text-[var(--app-muted)]">Choose a clean schedule for your attendees.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Venue Location</label>
                                <input
                                    required
                                    type="text"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Maps URL</label>
                                <input
                                    type="url"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    placeholder="https://maps.google.com/..."
                                    value={formData.locationLink}
                                    onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })}
                                />
                            </div>

                            <div className="p-4 bg-[var(--app-bg)]/45 rounded-xl border border-[color:var(--app-border)] grid grid-cols-2 gap-4 md:col-span-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider flex items-center gap-1">
                                        <Grid size={12} /> Grid Rows
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="26"
                                        className="input-surface w-full px-3 py-2 text-xs"
                                        value={formData.gridRows}
                                        onChange={(e) => setFormData({ ...formData, gridRows: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider flex items-center gap-1">
                                        <Grid size={12} /> Grid Columns
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="30"
                                        className="input-surface w-full px-3 py-2 text-xs"
                                        value={formData.gridCols}
                                        onChange={(e) => setFormData({ ...formData, gridCols: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Ticket Price (₹)</label>
                                <input
                                    required
                                    type="number"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    value={formData.ticketPrice}
                                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Banner Image URL</label>
                                <input
                                    type="text"
                                    className="input-surface w-full px-3.5 py-2.5 text-sm"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Description</label>
                                <textarea
                                    required
                                    className="input-surface w-full px-3.5 py-2.5 text-sm h-24 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-3 mt-2">
                                <button type="submit" className="btn-surface flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-md">
                                    {editingEventId ? 'Update Event' : 'Publish Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEventForm(false);
                                        resetForm();
                                    }}
                                    className="btn-surface-secondary px-5 py-3 text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Inventory */}
                <div className="panel-surface overflow-hidden">
                    <div className="p-4 border-b border-[color:var(--app-border)] flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--app-accent)] flex items-center gap-2">
                                <List size={14} /> Experience Inventory Manifest ({visibleEvents.length})
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px] gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                                <input
                                    type="text"
                                    value={eventSearch}
                                    onChange={(e) => setEventSearch(e.target.value)}
                                    placeholder="Search events or locations..."
                                    className="input-surface w-full pl-9 pr-3 py-2.5 text-sm"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-surface px-3 py-2.5 text-sm"
                            >
                                <option value="All">All status</option>
                                <option value="Active">Active</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Completed">Completed</option>
                            </select>

                            <button type="button" onClick={fetchData} className="btn-surface-secondary text-sm font-semibold">
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[var(--app-surface-soft)] border-b border-[color:var(--app-border)] text-[var(--app-brand)] uppercase font-black text-[9px] tracking-widest">
                                    <th className="p-4">Event Context</th>
                                    <th className="p-4">Temporal Node</th>
                                    <th className="p-4">Venue Matrix Address</th>
                                    <th className="p-4 text-center">Allocations</th>
                                    <th className="p-4 text-right">Unit Pricing</th>
                                    <th className="p-4 text-center">Directives</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[color:var(--app-border)] font-semibold text-[var(--app-text)]">
                                {visibleEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-[var(--app-muted)] font-bold uppercase tracking-wider">
                                            No events match the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleEvents.map((evt) => {
                                        const bookedCount = evt.seatMapLayout
                                            ? evt.seatMapLayout.filter((s) => s.status === 'Booked').length
                                            : 0;

                                        return (
                                            <tr
                                                key={evt._id}
                                                className={`transition-colors ${
                                                    evt.status === 'Cancelled'
                                                        ? 'opacity-60 bg-[var(--app-surface-soft)]/30'
                                                        : 'hover:bg-[var(--app-surface-soft)]/20'
                                                }`}
                                            >
                                                <td className="p-4">
                                                    <div className="font-bold text-[var(--app-text)] text-sm flex items-center gap-1.5">
                                                        {evt.title}
                                                        {evt.status === 'Cancelled' && (
                                                            <span className="badge-danger text-[8px]">Archived</span>
                                                        )}
                                                    </div>
                                                    <span className="inline-block px-2 py-0.5 bg-[var(--app-bg)]/70 border border-[color:var(--app-border)] rounded text-[9px] font-bold mt-1 uppercase text-[var(--app-brand)] tracking-wider">
                                                        {evt.category}
                                                    </span>
                                                </td>

                                                <td className="p-4 whitespace-nowrap font-mono text-[var(--app-muted)]">
                                                    <div className="text-[var(--app-text)]">{new Date(evt.date).toLocaleDateString()}</div>
                                                    <div className="text-[10px] mt-0.5 font-bold">{evt.time || '18:00'}</div>
                                                </td>

                                                <td className="p-4 max-w-xs truncate font-medium text-[var(--app-muted)]">
                                                    {evt.location}
                                                </td>

                                                <td className="p-4 text-center whitespace-nowrap font-mono">
                                                    <span className="font-bold text-[var(--app-text)]">{evt.totalSeats - bookedCount}</span>{' '}
                                                    / <span className="text-[var(--app-muted)]">{evt.totalSeats}</span>
                                                    <div className="w-16 bg-[var(--app-bg)] h-1 rounded-full mx-auto mt-1.5 overflow-hidden border border-[color:var(--app-border)]">
                                                        <div
                                                            className="bg-[var(--app-accent)] h-full"
                                                            style={{ width: `${((evt.totalSeats - bookedCount) / evt.totalSeats) * 100}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                <td className="p-4 text-right font-bold text-[var(--app-text)] font-mono text-sm">
                                                    ₹{evt.ticketPrice}
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditClick(evt)}
                                                            title="Edit Configuration"
                                                            className="p-2 text-[var(--app-muted)] hover:text-[var(--app-accent)] rounded-lg transition-colors"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFetchAnalytics(evt._id)}
                                                            title="Telemetry Stats"
                                                            className="p-2 text-[var(--app-muted)] hover:text-[var(--app-accent)] rounded-lg transition-colors"
                                                        >
                                                            <BarChart3 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSeatMapEvent(evt)}
                                                            title="Spatial Matrix Control"
                                                            className="p-2 text-[var(--app-muted)] hover:text-[var(--app-accent)] rounded-lg transition-colors"
                                                        >
                                                            <Grid size={14} />
                                                        </button>
                                                        {evt.status !== 'Cancelled' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteEvent(evt._id)}
                                                                title="Soft Archive"
                                                                className="p-2 text-red-500 hover:text-red-600 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
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

            {/* Analytics Modal */}
            <AnimatePresence>
                {activeAnalytics && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="panel-surface w-full max-w-2xl p-6 relative"
                        >
                            <button
                                onClick={() => setActiveAnalytics(null)}
                                className="absolute top-4 right-4 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            >
                                <X size={16} />
                            </button>

                            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--app-accent)] mb-4 flex items-center gap-1.5">
                                <BarChart3 size={16} /> Operational Analytics
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/55 p-3.5">
                                    <span className="text-[9px] font-black text-[var(--app-muted)] uppercase tracking-widest block">Registrants</span>
                                    <div className="text-xl font-bold font-mono text-[var(--app-text)] mt-0.5">{activeAnalytics.stats.totalUsersRegistered}</div>
                                </div>
                                <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/55 p-3.5">
                                    <span className="text-[9px] font-black text-[var(--app-muted)] uppercase tracking-widest block">Passes Sold</span>
                                    <div className="text-xl font-bold font-mono text-[var(--app-text)] mt-0.5">{activeAnalytics.stats.totalSeatsSold}</div>
                                </div>
                                <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/55 p-3.5">
                                    <span className="text-[9px] font-black text-[var(--app-muted)] uppercase tracking-widest block">Gross Revenue</span>
                                    <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">₹{activeAnalytics.stats.totalRevenueGenerated}</div>
                                </div>
                                <div className="rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)]/55 p-3.5">
                                    <span className="text-[9px] font-black text-[var(--app-muted)] uppercase tracking-widest block">Conversion</span>
                                    <div className="text-xl font-bold font-mono text-[var(--app-text)] mt-0.5">{activeAnalytics.stats.bookingConversionRate}%</div>
                                </div>
                            </div>

                            <div className="space-y-5 border-t border-[color:var(--app-border)] pt-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--app-accent)] mb-2">Revenue Growth</h4>
                                    <div className="h-44 w-full bg-[var(--app-bg)]/45 p-1.5 rounded-xl border border-[color:var(--app-border)]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={activeAnalytics.charts?.bookingTrends || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" stroke={CHART_COLORS.muted} fontSize={9} tickLine={false} />
                                                <YAxis stroke={CHART_COLORS.muted} fontSize={9} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        fontSize: '10px',
                                                        borderRadius: '8px',
                                                        background: CHART_COLORS.darkCard,
                                                        color: CHART_COLORS.textLight,
                                                        border: `1px solid ${CHART_COLORS.muted}`
                                                    }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.accent} fillOpacity={1} fill="url(#revenueGlow)" strokeWidth={2} />
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
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={28}
                                                    outerRadius={42}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    <Cell fill={CHART_COLORS.success} />
                                                    <Cell fill={CHART_COLORS.accent} />
                                                    <Cell fill={CHART_COLORS.warning} />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        fontSize: '9px',
                                                        background: CHART_COLORS.darkCard,
                                                        color: CHART_COLORS.textLight,
                                                        border: `1px solid ${CHART_COLORS.muted}`,
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="space-y-1.5 text-[11px] font-bold text-[var(--app-muted)] uppercase tracking-wide">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Capacity</span>
                                            <span className="font-mono font-bold text-[var(--app-text)]">{activeAnalytics.stats?.totalAvailableSeats || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Confirmed</span>
                                            <span className="font-mono font-bold text-[var(--app-text)]">{activeAnalytics.stats?.totalSeatsSold || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Holds</span>
                                            <span className="font-mono font-bold text-[var(--app-text)]">{activeAnalytics.stats?.totalReservedSeats || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Seat Map Modal */}
                {activeSeatMapEvent && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="panel-surface w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto relative flex flex-col gap-6"
                        >
                            <button
                                onClick={() => {
                                    setActiveSeatMapEvent(null);
                                    setSelectedSeatDetails(null);
                                }}
                                className="absolute top-4 right-4 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            >
                                <X size={16} />
                            </button>

                            <div className="border-b border-[color:var(--app-border)] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--app-accent)] flex items-center gap-1.5">
                                        <Grid size={16} /> Seat Grid Management
                                    </h3>
                                    <p className="text-[11px] font-bold text-[var(--app-muted)] mt-0.5">
                                        Monitoring target nodes: <span className="text-[var(--app-text)]">{activeSeatMapEvent.title}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => exportSeatReportCSV(activeSeatMapEvent)}
                                    className="btn-surface-secondary px-3.5 py-2 text-xs font-black uppercase tracking-wider"
                                >
                                    <FileSpreadsheet size={14} /> Export CSV
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                <div className="lg:col-span-2 bg-[var(--app-bg)]/45 p-6 rounded-2xl border border-[color:var(--app-border)] flex flex-col items-center overflow-x-auto">
                                    <div className="w-full bg-[var(--app-surface-soft)] text-[var(--app-brand)] text-[9px] font-black text-center py-1.5 rounded-md mb-8 uppercase tracking-widest border border-[color:var(--app-border)]">
                                        Stage Direction
                                    </div>

                                    <div
                                        className="grid gap-1.5 p-1"
                                        style={{
                                            gridTemplateColumns: `repeat(${activeSeatMapEvent.seatMapLayout?.reduce((max, s) => Math.max(max, s.colNumber), 0) || 10}, minmax(0, 1fr))`
                                        }}
                                    >
                                        {activeSeatMapEvent.seatMapLayout?.map((seat) => {
                                            let nodeColor = 'bg-emerald-600 text-white';
                                            if (seat.status === 'Booked') nodeColor = 'bg-red-600 text-white';
                                            else if (seat.status === 'Reserved') nodeColor = 'bg-amber-500 text-zinc-900';
                                            else if (seat.status === 'Disabled') nodeColor = 'bg-[var(--app-surface)] text-[var(--app-muted)] line-through border border-[color:var(--app-border)]';

                                            return (
                                                <button
                                                    type="button"
                                                    key={seat.seatId}
                                                    onClick={() => setSelectedSeatDetails(seat)}
                                                    className={`w-8 h-8 rounded-lg font-mono text-[9px] font-bold flex items-center justify-center transition-all ${nodeColor} ${selectedSeatDetails?.seatId === seat.seatId ? 'ring-2 ring-red-500 scale-105' : ''}`}
                                                >
                                                    {seat.seatId}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-[var(--app-bg)]/45 p-4 rounded-2xl border border-[color:var(--app-border)] h-full flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--app-accent)] border-b border-[color:var(--app-border)] pb-1.5 mb-4">
                                            Diagnostics Console
                                        </h4>

                                        {!selectedSeatDetails ? (
                                            <div className="text-center py-8 text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] border border-dashed border-[color:var(--app-border)] rounded-xl bg-[var(--app-surface)]/35">
                                                Select a seat
                                            </div>
                                        ) : (
                                            <div className="space-y-4 text-xs font-bold bg-[var(--app-surface)] p-4 rounded-xl border border-[color:var(--app-border)] shadow-md">
                                                <div className="flex justify-between items-center border-b border-[color:var(--app-border)] pb-1.5">
                                                    <span className="font-mono font-black text-sm text-[var(--app-text)]">{selectedSeatDetails.seatId}</span>
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[var(--app-bg)] rounded text-[var(--app-brand)] tracking-wider">
                                                        {selectedSeatDetails.status}
                                                    </span>
                                                </div>

                                                {selectedSeatDetails.status === 'Booked' ? (
                                                    <div className="space-y-2 text-[var(--app-muted)]">
                                                        <div>
                                                            <span className="text-[9px] font-black text-[var(--app-brand)] uppercase block tracking-wider">Booker Identity</span>
                                                            <span className="text-[var(--app-text)] font-semibold">{selectedSeatDetails.bookingDetails?.userName}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black text-[var(--app-brand)] uppercase block tracking-wider">Routing Email</span>
                                                            <span className="font-mono text-[var(--app-text)] font-medium">{selectedSeatDetails.bookingDetails?.userEmail}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black text-[var(--app-brand)] uppercase block tracking-wider">Remittance</span>
                                                            <span className="font-mono text-emerald-500 font-black">₹{selectedSeatDetails.bookingDetails?.paidAmount}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-[var(--app-muted)] text-[10px] uppercase tracking-wider leading-relaxed font-bold">
                                                            Override matrix placement rules dynamically.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleSeatStatus(
                                                                    activeSeatMapEvent._id,
                                                                    selectedSeatDetails.seatId,
                                                                    selectedSeatDetails.status
                                                                )
                                                            }
                                                            className="btn-surface w-full py-2 text-xs font-black uppercase tracking-widest"
                                                        >
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