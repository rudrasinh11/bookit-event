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
    const [notifications, setNotifications] = useState([]);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
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

    useEffect(() => {
        if (liveNotification) {
            setNotifications((prev) => [liveNotification, ...prev]);
        }
    }, [liveNotification]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const wsUrl = import.meta.env.VITE_WS_URL || 'https://bookit-event-backend.vercel.app';

        if (wsUrl.includes('vercel.app')) return;

        const socketToken = localStorage.getItem('token');
        const socket = io(wsUrl, {
            auth: { token: socketToken },
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 2
        });

        socket.on('user_notification_alert', (newAlert) => {
            setNotifications((prev) => [newAlert, ...prev]);
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
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin';
        return '/dashboard';
    };

    const isActive = (path) => location.pathname === path;
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const navBtnBase =
        'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2';

    const navBtnActive =
        'bg-[var(--app-button)] text-[var(--app-button-text)] shadow-md';

    const navBtnIdle =
        'text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)]/70';

    const NotificationBellTrigger = () => (
        <div className="relative" ref={notifRef}>
            <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)] transition-colors relative flex items-center justify-center"
                aria-label="View notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[var(--app-accent)] text-white rounded-full text-[9px] font-black flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {notifDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl z-50 bg-[var(--app-surface)] border border-[color:var(--app-border)] shadow-2xl overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-[color:var(--app-border)] flex justify-between items-center bg-[var(--app-bg)]/40">
                        <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text)]">
                            Notification Ledger
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllNotificationsAsRead}
                                className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text)] hover:opacity-80 flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={12} /> Mark Read
                            </button>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[color:var(--app-border)]">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs font-medium text-[var(--app-muted)]">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id || Math.random()}
                                    className={`p-4 transition-colors ${!notif.isRead ? 'bg-[var(--app-bg)]/40' : ''}`}
                                >
                                    <div className="flex gap-2.5 items-start">
                                        {!notif.isRead && (
                                            <Circle
                                                size={6}
                                                className="text-[var(--app-accent)] fill-[var(--app-accent)] mt-1.5 shrink-0"
                                            />
                                        )}
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-[var(--app-text)]">{notif.title}</p>
                                            <p className="text-[11px] leading-relaxed text-[var(--app-muted)] font-normal">
                                                {notif.message}
                                            </p>
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
                        : 'bg-[var(--app-bg)]/72 border-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" className="flex items-center h-full py-2 select-none min-w-0 flex-1 md:flex-none">
                            <div className="h-12 sm:h-14 w-full max-w-[230px] sm:max-w-[240px] md:w-56 bg-[var(--app-button)] border border-[color:var(--app-border)] rounded-xl px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md overflow-hidden">
                          <span className="text-xl sm:text-2xl font-black tracking-[0.18em] sm:tracking-widest uppercase text-[var(--app-button-text)] font-sans leading-none">
                                    Book<span className="text-white">IT</span>
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-2">
                            <Link
                                to="/"
                                className={`${navBtnBase} ${isActive('/') ? navBtnActive : navBtnIdle}`}
                            >
                                <Compass size={15} /> Explore Events
                            </Link>

                            {user && (
                                <Link
                                    to={getDashboardPath()}
                                    className={`${navBtnBase} ${isActive(getDashboardPath()) ? navBtnActive : navBtnIdle}`}
                                >
                                    {user.role === 'admin' ? <Shield size={15} /> : <LayoutDashboard size={15} />}
                                    {user.role === 'admin' ? 'Admin Suite' : 'My Dashboard'}
                                </Link>
                            )}
                        </nav>

                        <div className="hidden md:flex items-center space-x-3">
                            {user && <NotificationBellTrigger />}

                            <button
                                onClick={handleThemeToggleClick}
                                className="p-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)] transition-colors"
                                aria-label="Toggle theme"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-surface)]/60 hover:bg-[var(--app-surface)] transition-all text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--app-surface-soft)] text-[var(--app-brand)] text-xs font-black">
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
                                                <p className="text-[9px] font-bold text-[var(--app-muted)] uppercase tracking-widest">
                                                    Account Profile
                                                </p>
                                                <p className="text-xs font-semibold text-[var(--app-text)] truncate mt-0.5">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <Link
                                                to={getDashboardPath()}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[var(--app-text)] hover:opacity-80 hover:bg-[var(--app-bg)]/30 transition-colors"
                                            >
                                                <User size={14} /> Dashboard
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold w-full text-left text-[var(--app-accent)] hover:bg-red-500/10 transition-colors border-t border-[color:var(--app-border)] mt-2 pt-2.5"
                                            >
                                                <LogOut size={14} /> Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        to="/login"
                                        className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:text-[var(--app-text)] px-3 py-2 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--app-button)] text-[var(--app-button-text)] hover:opacity-90 transition-colors shadow-md"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-1.5 md:hidden shrink-0 ml-3">
                            {user && <NotificationBellTrigger />}

                            <button
                                onClick={handleThemeToggleClick}
                                className="p-2.5 rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 active:scale-95 transition-all flex items-center justify-center"
                                aria-label="Toggle theme mobile"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <button
                                className="p-2.5 rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 active:scale-95 transition-all flex items-center justify-center"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Toggle menu mobile"
                            >
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

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
                <div className="flex items-center justify-between p-5 border-b border-[color:var(--app-border)]">
                    <div className="h-11 w-auto bg-[var(--app-surface)] border border-[color:var(--app-border)] rounded-xl px-3 flex items-center justify-start gap-2 shadow-inner">
                        <img
                            src={logoImg}
                            alt="BookIT"
                            className="h-8 w-8 object-contain"
                        />
                        <span className="text-sm font-black tracking-wider uppercase text-[var(--app-text)] font-sans">
                            Book<span className="text-[var(--app-accent)]">IT</span>
                        </span>
                    </div>

                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex flex-col h-[calc(100%-5rem)] justify-between overflow-y-auto">
                    <div className="space-y-1">
                        {user && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--app-surface)]/50 border border-[color:var(--app-border)] mb-4">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--app-surface-soft)] text-[var(--app-brand)] font-black text-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-[var(--app-text)] text-sm truncate uppercase tracking-wide">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-[var(--app-muted)] truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Link
                            to="/"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 hover:text-[var(--app-text)] transition-colors"
                        >
                            <Ticket size={15} /> Browse Events
                        </Link>

                        {user && (
                            <Link
                                to={getDashboardPath()}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 hover:text-[var(--app-text)] transition-colors"
                            >
                                {user.role === 'admin' ? <Shield size={15} /> : <LayoutDashboard size={15} />}
                                {user.role === 'admin' ? 'Admin Suite' : 'My Dashboard'}
                            </Link>
                        )}

                        <div className="h-px bg-[color:var(--app-border)] my-4" />
                        <span className="text-[9px] font-black tracking-widest text-[var(--app-brand)] uppercase block px-3 mb-2">
                            Company Matrix
                        </span>

                        <Link
                            to="/about"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 hover:text-[var(--app-text)] transition-colors"
                        >
                            <Users size={15} className="text-[var(--app-brand)]" /> About Platform
                        </Link>

                        <Link
                            to="/contact"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 hover:text-[var(--app-text)] transition-colors"
                        >
                            <Phone size={15} className="text-[var(--app-brand)]" /> Contact Support
                        </Link>

                        <Link
                            to="/terms"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] hover:bg-[var(--app-surface)]/40 hover:text-[var(--app-text)] transition-colors"
                        >
                            <Scale size={15} className="text-[var(--app-brand)]" /> Legal Matrix
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-[color:var(--app-border)]">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--app-accent)] hover:bg-red-500/10 w-full text-left transition-colors"
                            >
                                <LogOut size={15} /> Sign Out Terminal
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    to="/login"
                                    className="w-full text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-[color:var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--app-button)] text-[var(--app-button-text)] hover:opacity-90"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;