import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Search, Clock, ShieldCheck, 
    ArrowRight, Layers, Sparkles, AlertCircle, SlidersHorizontal, ChevronDown
} from 'lucide-react';

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [city, setCity] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('popularity');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 150);
        return () => clearTimeout(timeoutId);
    }, [search, selectedCategory, city, maxPrice, dateFilter, sortBy]);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get('/events', {
                params: {
                    compact: true,
                    search: search.trim(),
                    category: selectedCategory,
                    city: city.trim(),
                    maxPrice,
                    date: dateFilter,
                    sortBy
                }
            });
            
            let refinedData = data || [];
            if (search.trim() !== '') {
                refinedData = refinedData.filter((event) =>
                    event.title?.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            setEvents(refinedData);
        } catch (error) {
            console.error('Error fetching optimized events catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { label: 'All', value: 'All' },
        { label: 'Tech', value: 'Technology' },
        { label: 'Music', value: 'Music' },
        { label: 'Comedy', value: 'Comedy' },
        { label: 'Business', value: 'Business' },
        { label: 'Arts', value: 'Art' },
        { label: 'Workshops', value: 'Workshop' }
    ];

    return (
        <div className="w-full bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300 min-h-screen pt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Immersive Vintage Hero Frame */}
                <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/40">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay sepia" />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, var(--app-bg), rgba(43, 38, 33, 0.35), transparent)' }}
                    />
                    
                    <div className="relative z-10 px-4 py-12 sm:px-6 sm:py-16 md:p-20 text-center max-w-4xl mx-auto flex flex-col items-center overflow-hidden">
                        <span className="inline-flex items-center gap-1.5 bg-[var(--app-surface)]/90 text-[var(--app-muted)] border border-[color:var(--app-border)] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                            <Sparkles size={12} className="text-[var(--app-accent)] animate-pulse" /> Reimagining Experiences
                        </span>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[var(--app-text)] mb-6 leading-[1.1] tracking-tight max-w-3xl break-words">
                            <span className="block">Your Elite Events</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--app-text)] via-[var(--app-accent)] to-[var(--app-muted)]">One Singular Click Away</span>
                        </h1>
                        <p className="text-[color:var(--app-muted)] text-sm md:text-base mb-8 max-w-xl font-medium leading-relaxed px-1">
                            Discover and guarantee secure passage to world-class enterprise technology summits, premier live performance productions, and intensive design accelerators.
                        </p>

                        {/* Omnibar Input Interface */}
                        <div className="w-full max-w-xl bg-[var(--app-surface)]/80 p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-[color:var(--app-border)] backdrop-blur-md">
                            <div className="w-full flex items-center pl-3 gap-2.5 py-1.5 sm:py-0">
                                <Search className="text-[var(--app-accent)] shrink-0" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by event title or keyword..."
                                    className="w-full text-xs text-[var(--app-text)] bg-transparent focus:outline-none placeholder-[color:var(--app-muted)] font-bold"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="w-full sm:w-auto px-5 py-3 shrink-0 bg-[var(--app-button)] text-[var(--app-button-text)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-sm">
                                Find Tickets
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Matrix Selector */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[#F4EFEA]/80">
                            <Layers size={14} className="text-[#8C7A6B]" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest">Curated Classifications</h3>
                        </div>
                        <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#8C7A6B]/30 bg-[#3D352E]/30 text-[10px] font-bold uppercase tracking-widest text-[#F4EFEA]/80 hover:text-[#F4EFEA] transition-all shadow-sm"
                        >
                            <SlidersHorizontal size={12} /> Filter Engine <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat.label}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap border ${
                                    selectedCategory === cat.value
                                        ? 'bg-[var(--app-button)] text-[var(--app-button-text)] border-transparent shadow-md'
                                        : 'bg-[var(--app-surface)]/40 text-[color:var(--app-muted)] border-[color:var(--app-border)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)]'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Filter Control Hub */}
                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-10"
                        >
                            <div className="bg-[#3D352E]/30 border border-[#8C7A6B]/30 p-5 rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-[#8C7A6B] uppercase tracking-widest">Target Venue / City</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Mumbai, Bangalore"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-zinc-200 placeholder-[#8C7A6B]/60 font-medium"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-[#8C7A6B] uppercase tracking-widest">Price Ceiling Limit (₹)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Maximum budget threshold"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-zinc-200 placeholder-[#8C7A6B]/60 font-medium"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-[#8C7A6B] uppercase tracking-widest">Calendar Date Target</label>
                                    <input 
                                        type="date" 
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-zinc-400 font-medium"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-[#8C7A6B] uppercase tracking-widest">Prioritize Sorting Order</label>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs focus:outline-none text-zinc-300 font-bold bg-[#2B2621]"
                                    >
                                        <option value="popularity">Popularity Score Hierarchy</option>
                                        <option value="date">Timeline: Earliest First</option>
                                        <option value="price_low">Pricing: Low to High</option>
                                        <option value="price_high">Pricing: High to Low</option>
                                        <option value="rating">Customer Reviews Weights</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Core Proposition Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-[#3D352E]/20 border border-[#8C7A6B]/30 p-6 rounded-2xl shadow-md">
                        <div className="w-10 h-10 bg-[#3D352E]/60 text-[#F4EFEA] rounded-xl flex items-center justify-center mb-4 border border-[#8C7A6B]/40">
                            <Clock size={16} />
                        </div>
                        <h4 className="text-sm font-bold text-[#F4EFEA]/90 uppercase tracking-wide mb-1.5">Instant Allocation</h4>
                        <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-medium">High-frequency ticket clearing engine designed to securely settle transactions in millisecond frames.</p>
                    </div>
                    <div className="bg-[#3D352E]/20 border border-[#8C7A6B]/30 p-6 rounded-2xl shadow-md">
                        <div className="w-10 h-10 bg-[#3D352E]/60 text-[#F4EFEA] rounded-xl flex items-center justify-center mb-4 border border-[#8C7A6B]/40">
                            <Sparkles size={16} />
                        </div>
                        <h4 className="text-sm font-bold text-[#F4EFEA]/90 uppercase tracking-wide mb-1.5">Centralized Wallet</h4>
                        <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-medium">Review credentials, download dynamic passes, or invoke automated registration parameters smoothly.</p>
                    </div>
                    <div className="bg-[#3D352E]/20 border border-[#8C7A6B]/30 p-6 rounded-2xl shadow-md">
                        <div className="w-10 h-10 bg-[#3D352E]/60 text-[#F4EFEA] rounded-xl flex items-center justify-center mb-4 border border-[#8C7A6B]/40">
                            <ShieldCheck size={16} />
                        </div>
                        <h4 className="text-sm font-bold text-[#F4EFEA]/90 uppercase tracking-wide mb-1.5">Cryptographic Security</h4>
                        <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-medium">Comprehensive secure transactions backed by modern configurations and mandatory OTP safeguards.</p>
                    </div>
                </div>

                {/* Presentation Header Block */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-[#8C7A6B]/30 pb-5">
                    <div>
                        <h2 className="text-xl font-bold tracking-wider uppercase text-zinc-100">Upcoming Experiences</h2>
                        <p className="text-xs text-[#8C7A6B] mt-0.5 font-medium">Explore validated events cataloged under premium operational metrics.</p>
                    </div>
                    <div className="bg-[#3D352E] text-zinc-300 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border border-[#8C7A6B]/40 font-mono">
                        {events.length} AVAILABILITIES RESERVED
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-96 bg-[#3D352E]/40 rounded-2xl border border-[#8C7A6B]/30" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-[#3D352E]/10 rounded-2xl border border-dashed border-[#8C7A6B]/30 flex flex-col items-center justify-center p-6">
                        <AlertCircle className="text-zinc-700 mb-3" size={32} />
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">No events matching the selected criteria were found in our directory.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <motion.div 
                                key={event._id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col rounded-2xl overflow-hidden bg-[#3D352E]/20 border border-[#8C7A6B]/30 shadow-xl transition-all group hover:border-[#8C7A6B]"
                            >
                                <div className="relative w-full aspect-video sm:aspect-[16/10] lg:aspect-[16/9] bg-[#2B2621] overflow-hidden border-b border-[#8C7A6B]/30">
                                    {event.image ? (
                                        <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110 grayscale-[15%] sepia-[10%]" />
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#2B2621] text-[#8C7A6B] font-black text-[10px] uppercase tracking-widest">
                                            {event.category || 'Curated'}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-[#2B2621]/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono font-bold border border-[#8C7A6B]/40 z-10">
                                        {event.ticketPrice === 0 ? (
                                            <span className="text-emerald-500 font-black text-[9px] tracking-wider">FREE ACCESS</span>
                                        ) : (
                                            <span className="text-[#F4EFEA] font-black">₹{event.ticketPrice}</span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-[#F4EFEA] text-[#2B2621] text-[9px] font-black px-2.5 py-0.5 rounded uppercase tracking-widest z-10">
                                        {event.category || 'General'}
                                    </div>
                                </div>
                                
                                <div className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-[#3D352E]/10">
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-200 line-clamp-1 group-hover:text-zinc-50 transition-colors tracking-wide">{event.title}</h3>
                                        
                                        <div className="space-y-1.5 mt-3 text-[#F4EFEA]/70 text-xs font-semibold">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={13} className="text-zinc-500" />
                                                <span className="text-[11px]">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={13} className="text-zinc-500" />
                                                <span className="truncate text-[11px] text-[#F4EFEA]/70">{event.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[#8C7A6B]/30">
                                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 mb-1.5">
                                            <span>{event.availableSeats} open entries</span>
                                            <span>Cap: {event.totalSeats}</span>
                                        </div>
                                        <div className="w-full bg-[#2B2621] rounded-full h-1.5 mb-4 overflow-hidden border border-[#8C7A6B]/20">
                                            <div 
                                                className="bg-zinc-300 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.min(100, Math.max(0, (event.availableSeats / event.totalSeats) * 100))}%` }}
                                            />
                                        </div>
                                        
                                        <Link 
                                            to={`/events/${event._id}`} 
                                            className="w-full text-center py-2.5 bg-[#2B2621] border border-[#8C7A6B]/40 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#F4EFEA] hover:text-[#2B2621] flex items-center justify-center gap-1.5 transition-all shadow-inner"
                                        >
                                            Request Access <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Footer Layer */}
                <footer className="mt-24 pt-12 pb-6 border-t border-[#8C7A6B]/30 text-center space-y-6">
                    <div className="flex justify-center items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#F4EFEA]/80">
                        <Link to="/about" className="hover:text-[#F4EFEA] transition-colors">About Us</Link>
                        <Link to="/contact" className="hover:text-[#F4EFEA] transition-colors">Contact Support</Link>
                        <Link to="/terms" className="hover:text-[#F4EFEA] transition-colors">Legal Matrix</Link>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-widest text-zinc-300">Book<span className="text-zinc-600">IT</span></p>
                        <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed font-medium">
                            An institutional-grade transactional interface architectural stack designed to host and book local events securely.
                        </p>
                    </div>
                    
                    <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest pt-4 font-mono">
                        &copy; {new Date().getFullYear()} BookIT Inc. Distributed Architecture. All rights reserved.
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default Home;