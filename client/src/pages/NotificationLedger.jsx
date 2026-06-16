import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { Bell, CheckCircle2, AlertCircle, Info, Eye } from 'lucide-react';

const NotificationLedger = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/users/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Failed to parse historical notification logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/users/notifications/mark-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            toast.success('All notification indicators cleared.');
        } catch (err) {
            toast.error('Failed to update alert statuses.');
        }
    };

    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container max-w-3xl py-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[color:var(--app-border)] pb-5">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-[var(--app-text)]">
                            <Bell size={22} className="text-[var(--app-accent)]" /> Notification Ledger
                        </h1>
                        <p className="text-sm text-[var(--app-muted)] mt-1">Historical booking alerts and verification updates.</p>
                    </div>
                    {notifications.some((n) => !n.isRead) && (
                        <button onClick={handleMarkAllRead} className="btn-surface text-xs font-black uppercase tracking-[0.22em]">
                            <Eye size={12} /> Mark All Read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-16 panel-surface" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="panel-surface text-center py-16 flex flex-col items-center justify-center p-6">
                        <Bell className="text-[var(--app-muted)] mb-3" size={32} />
                        <p className="text-[var(--app-muted)] text-sm font-medium">Your notifications are clear.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => {
                            let iconElement = <Info className="text-blue-500" size={16} />;
                            if (notif.type === 'SUCCESS') iconElement = <CheckCircle2 className="text-emerald-500" size={16} />;
                            if (notif.type === 'ALERT') iconElement = <AlertCircle className="text-red-500" size={16} />;

                            return (
                                <div key={notif._id} className={`panel-surface p-4 flex items-start gap-3 ${!notif.isRead ? 'ring-1 ring-blue-500/30' : 'opacity-90'}`}>
                                    <div className="mt-0.5 shrink-0">{iconElement}</div>
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-sm font-bold text-[var(--app-text)] tracking-tight">{notif.title}</h3>
                                            <span className="text-[10px] font-mono text-[var(--app-muted)] whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-[var(--app-muted)] leading-6">{notif.message}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationLedger;
