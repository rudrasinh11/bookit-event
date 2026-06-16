import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
    Menu, X, LogOut, Shield, LayoutDashboard, 
    Compass, Ticket, Sun, Moon, User, Bell, CheckCheck, Circle,
    Phone, Scale, Users
} from 'lucide-react';

import logoImg from '../assets/logo.png';

const Navbar = ({ darkMode, toggleTheme }) => {
    const { user, logout, liveNotification } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setDropdownOpen(false);
        setNotifDropdownOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Synchronize global notifications coming from our main context layer
    useEffect(() => {
        if (liveNotification) {
            setNotifications(prev => [liveNotification, ...prev]);
        }
    }, [liveNotification]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const wsUrl = import.meta.env.VITE_WS_URL || 'https://bookit-event-backend.vercel.app';
        
        // 🛡️ SERVERLESS GUARD: Prevents duplicate component connections on Vercel
        if (wsUrl.includes('vercel.app')) return;

        const socketToken = localStorage.getItem('token');
        const socket = io(wsUrl, {
            auth: { token: socketToken },
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 2
        });

        socket.on('user_notification_alert', (newAlert) => {
            setNotifications(prev => [newAlert, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleThemeToggleClick = () => {
        if (typeof toggleTheme === 'function') {
            toggleTheme();
        }
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin';
        return '/dashboard';
    };

    const isActive = (path) => location.pathname === path;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Extracted Notification Bell Trigger for desktop/mobile consistency reuse
    const NotificationBellTrigger = () => (
        <div className="relative" ref={notifRef}>
            <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 text-[color:var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)] transition-colors relative flex items-center justify-center"
                aria-label="View Alerts Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {notifDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl z-50 bg-[var(--app-surface)] border border-[color:var(--app-border)] shadow-2xl overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-[color:var(--app-border)] flex justify-between items-center bg-[var(--app-bg)]/40">
                        <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text)]">Notification Ledger</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllNotificationsAsRead}
                                className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text)] hover:opacity-80 flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={12} /> Clear Flags
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#8C7A6B]/20">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs font-medium text-[var(--app-muted)]">
                                No alerts logged inside session channels.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif._id || Math.random()} className={`p-4 transition-colors ${!notif.isRead ? 'bg-[var(--app-bg)]/40' : ''}`}>
                                    <div className="flex gap-2.5 items-start">
                                        {!notif.isRead && <Circle size={6} className="text-[var(--app-text)] fill-[var(--app-text)] mt-1.5 shrink-0" />}
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-[var(--app-text)]">{notif.title}</p>
                                            <p className="text-[11px] leading-relaxed text-[color:var(--app-muted)] font-normal">{notif.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <header
                className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b ${
                    scrolled 
                        ? 'bg-[var(--app-bg)]/95 border-[color:var(--app-border)] shadow-xl' 
                        : 'bg-[var(--app-bg)]/70 border-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        
                        <Link to="/" className="flex items-center h-full py-2 select-none min-w-0 flex-1 md:flex-none">
                            <div className="h-12 sm:h-14 w-full max-w-[230px] sm:max-w-[240px] md:w-56 bg-[var(--app-button)] border border-[color:var(--app-border)] rounded-xl px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-md overflow-hidden">
                                <img 
                                    src={logoImg} 
                                    alt="BookIT" 
                                    className="h-11 w-11 object-contain filter drop-shadow-[0_2px_4px_rgba(43,38,33,0.12)]"
                                />
                                <span className="text-xl sm:text-2xl font-black tracking-[0.2em] sm:tracking-widest uppercase text-[var(--app-button-text)] font-sans select-none leading-none">
                                    Book<span className="text-[#A32A2A]">IT</span>
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-2">
                            <Link
                                to="/"
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                    isActive('/') 
                                        ? 'bg-[var(--app-button)] text-[var(--app-button-text)] shadow-md' 
                                        : 'text-[color:var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)]/60'
                                }`}
                            >
                                <Compass size={15} /> Explore Events
                            </Link>

                            {user && (
                                <Link
                                    to={getDashboardPath()}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                        isActive(getDashboardPath()) 
                                            ? 'bg-[var(--app-button)] text-[var(--app-button-text)] shadow-md' 
                                            : 'text-[color:var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)]/60'
                                    }`}
                                >
                                    {user.role === 'admin' ? <Shield size={15} /> : <LayoutDashboard size={15} />}
                                    {user.role === 'admin' ? 'Admin Suite' : 'My Dashboard'}
                                </Link>
                            )}
                        </nav>

                        {/* Desktop Controls Container */}
                        <div className="hidden md:flex items-center space-x-3">
                            {user && <NotificationBellTrigger />}

                            <button
                                onClick={handleThemeToggleClick}
                                className="p-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 text-[color:var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)] transition-colors"
                                aria-label="Toggle theme identity"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 hover:bg-[var(--app-surface)] transition-all text-left"
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F4EFEA] text-[#2B2621] text-xs font-black">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col pr-1">
                                            <span className="text-xs font-bold text-[var(--app-text)] max-w-[100px] truncate uppercase tracking-wider">
                                                {user.name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl py-2 z-50 bg-[var(--app-surface)] border border-[color:var(--app-border)] shadow-2xl">
                                            <div className="px-4 py-3 border-b border-[color:var(--app-border)]">
                                                <p className="text-[9px] font-bold text-[var(--app-muted)] uppercase tracking-widest">Account Profile</p>
                                                <p className="text-xs font-semibold text-[var(--app-text)] truncate mt-0.5">{user.email}</p>
                                            </div>
                                            <Link
                                                to={getDashboardPath()}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[var(--app-text)] hover:opacity-80 hover:bg-[var(--app-bg)]/30 transition-colors"
                                            >
                                                <User size={14} /> Terminal Workspace
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold w-full text-left text-red-400 hover:bg-red-950/20 transition-colors border-t border-[#8C7A6B]/20 mt-2 pt-2.5"
                                            >
                                                <LogOut size={14} /> Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-[color:var(--app-muted)] hover:text-[var(--app-text)] px-3 py-2 transition-colors">
                                        Sign In
                                    </Link>
                                    <Link to="/register" className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--app-button)] text-[var(--app-button-text)] hover:opacity-90 transition-colors shadow-md">
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Controllers Bar (Fixed Issue 2: Now displays Notification system on Mobile layouts smoothly) */}
                        <div className="flex items-center space-x-1.5 md:hidden shrink-0 ml-3">
                            {user && <NotificationBellTrigger />}
                            <button 
                                onClick={handleThemeToggleClick} 
                                className="p-2.5 rounded-xl text-[color:var(--app-muted)] hover:bg-[var(--app-surface)]/40 active:scale-95 transition-all flex items-center justify-center"
                                aria-label="Toggle Theme mobile"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button 
                                className="p-2.5 rounded-xl text-[color:var(--app-muted)] hover:bg-[var(--app-surface)]/40 active:scale-95 transition-all flex items-center justify-center" 
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Toggle Menu mobile"
                            >
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>

                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay Drawer Container */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full z-50 md:hidden w-[85vw] max-w-xs bg-[var(--app-bg)] border-l border-[color:var(--app-border)] shadow-2xl transition-transform duration-300 ease-out ${
                    mobileOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-5 border-b border-[#A32A2A]/20">
                    <div className="h-11 w-auto bg-[#F4EFEA] border border-[#8C7A6B]/20 rounded-xl px-3 flex items-center justify-start gap-2 shadow-inner">
                        <img 
                            src={logoImg} 
                            alt="BookIT" 
                            className="h-8 w-8 object-contain" 
                        />
                        <span className="text-sm font-black tracking-wider uppercase text-[#2B2621] font-sans">
                            Book<span className="text-[#A32A2A]">IT</span>
                        </span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-[#F4EFEA]/80 hover:bg-[#3D352E]/40">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex flex-col h-[calc(100%-5rem)] justify-between overflow-y-auto">
                    <div className="space-y-1">
                        {user && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#3D352E]/30 border border-[#8C7A6B]/20 mb-4">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F4EFEA] text-[#2B2621] font-black text-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-[#F4EFEA] text-sm truncate uppercase tracking-wide">{user.name}</p>
                                    <p className="text-xs text-[#8C7A6B] truncate">{user.email}</p>
                                </div>
                            </div>
                        )}

                        <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F4EFEA]/80 hover:bg-[#3D352E]/40 hover:text-[#F4EFEA] transition-colors">
                            <Ticket size={15} /> Browse Events
                        </Link>

                        {user && (
                            <Link to={getDashboardPath()} className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F4EFEA]/80 hover:bg-[#3D352E]/40 hover:text-[#F4EFEA] transition-colors">
                                {user.role === 'admin' ? <Shield size={15} /> : <LayoutDashboard size={15} />}
                                {user.role === 'admin' ? 'Admin Suite' : 'My Dashboard'}
                            </Link>
                        )}

                        <div className="h-px bg-[#8C7A6B]/20 my-4" />
                        <span className="text-[9px] font-black tracking-widest text-[#8C7A6B] uppercase block px-3 mb-2">Company Matrix</span>

                        <Link to="/about" className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F4EFEA]/80 hover:bg-[#3D352E]/40 hover:text-[#F4EFEA] transition-colors">
                            <Users size={15} className="text-[#8C7A6B]" /> About Platform
                        </Link>

                        <Link to="/contact" className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F4EFEA]/80 hover:bg-[#3D352E]/40 hover:text-[#F4EFEA] transition-colors">
                            <Phone size={15} className="text-[#8C7A6B]" /> Contact Support
                        </Link>

                        <Link to="/terms" className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#F4EFEA]/80 hover:bg-[#3D352E]/40 hover:text-[#F4EFEA] transition-colors">
                            <Scale size={15} className="text-[#8C7A6B]" /> Legal Matrix
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-[#8C7A6B]/20">
                        {user ? (
                            <button 
                                onClick={handleLogout} 
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-950/20 w-full text-left transition-colors"
                            >
                                <LogOut size={15} /> Sign Out Terminal
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link to="/login" className="w-full text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-[color:var(--app-border)] text-[color:var(--app-muted)] hover:text-[var(--app-text)]">Sign In</Link>
                                <Link to="/register" className="w-full text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--app-button)] text-[var(--app-button-text)] hover:opacity-90">Get Started</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;