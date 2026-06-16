import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Eye } from 'lucide-react';

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
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notification indicators cleared.');
        } catch (err) {
            toast.error('Failed to update alert statuses.');
        }
    };

    return (
        <div className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 min-h-screen pt-20 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                            <Bell size={22} className="text-zinc-400" /> System Message Ledger
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">Historical verification summaries and transaction alerts logged here.</p>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:opacity-90 flex items-center gap-1.5 shadow-sm"
                        >
                            <Eye size={12} /> Clear Pending Flags
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-6">
                        <Bell className="text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Your notification pipeline index is completely clear.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => {
                            let iconElement = <Info className="text-blue-500" size={16} />;
                            if (notif.type === 'SUCCESS') iconElement = <CheckCircle2 className="text-emerald-500" size={16} />;
                            if (notif.type === 'ALERT') iconElement = <AlertCircle className="text-red-500" size={16} />;

                            return (
                                <div 
                                    key={notif._id}
                                    className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 transition-all flex items-start gap-3 shadow-sm ${
                                        !notif.isRead ? 'border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800/80 opacity-80'
                                    }`}
                                >
                                    <div className="mt-0.5 shrink-0">{iconElement}</div>
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{notif.title}</h3>
                                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">{notif.message}</p>
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