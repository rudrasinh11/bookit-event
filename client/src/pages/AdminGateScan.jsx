import React, { useState } from 'react';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Scan, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AdminGateScan = () => {
    const [scanData, setScanData] = useState({ bookingId: '', seatId: '' });
    const [processing, setProcessing] = useState(false);
    const [lastValidated, setLastValidated] = useState(null);

    const handleVerifyCheckIn = async (e) => {
        e.preventDefault();
        if (!scanData.bookingId.trim() || !scanData.seatId.trim()) {
            return toast.error('Please input both the booking tracking token and seat ID mapping.');
        }

        setProcessing(true);
        try {
            const { data } = await api.post('/bookings/verify-checkin', {
                bookingId: scanData.bookingId.trim(),
                seatId: scanData.seatId.trim().toUpperCase()
            });

            toast.success(data.message || 'Check-in entry authorized!');
            setLastValidated({
                seatId: scanData.seatId.toUpperCase(),
                timestamp: new Date(),
                success: true
            });
            setScanData({ bookingId: '', seatId: '' }); // Clear input buffer slots
        } catch (error) {
            const errorText = error.response?.data?.message || 'Check-in validation failure.';
            toast.error(errorText);
            setLastValidated({
                seatId: scanData.seatId.toUpperCase(),
                timestamp: new Date(),
                success: false,
                reason: errorText
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 min-h-screen pt-20 pb-16 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
                
                <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Scan size={22} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Venue Gate Check-In Validation</h1>
                    <p className="text-xs text-zinc-400">Scan entry ticket pass credentials atomically.</p>
                </div>

                {/* Simulation input form fields matrix */}
                <form onSubmit={handleVerifyCheckIn} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Booking ID Token Ptr</label>
                        <div className="relative flex items-center">
                            <QrCode className="absolute left-3 text-zinc-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="e.g., 65f1abcd1234ef..."
                                value={scanData.bookingId}
                                onChange={(e) => setScanData({ ...scanData, bookingId: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-50 outline-none focus:border-zinc-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Seat Identifier Number</label>
                        <div className="relative flex items-center">
                            <ShieldCheck className="absolute left-3 text-zinc-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="e.g., A-1, B-12"
                                value={scanData.seatId}
                                onChange={(e) => setScanData({ ...scanData, seatId: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-50 outline-none focus:border-zinc-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                    >
                        {processing ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Authorize Ticket Status'}
                    </button>
                </form>

                {/* Telemetry log callback tracking panel view */}
                {lastValidated && (
                    <div className={`p-4 rounded-xl border flex gap-3 text-xs font-medium ${
                        lastValidated.success 
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-500'
                    }`}>
                        {lastValidated.success ? <CheckCircle2 className="shrink-0" size={16} /> : <AlertTriangle className="shrink-0" size={16} />}
                        <div className="space-y-0.5">
                            <p className="font-bold uppercase tracking-wide">Last Transaction Callback:</p>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                {lastValidated.success 
                                    ? `Seat ${lastValidated.seatId} authorized pass clear check.` 
                                    : `Seat ${lastValidated.seatId} rejected: ${lastValidated.reason}`}
                            </p>
                            <span className="text-[10px] text-zinc-400 block pt-1">Timestamp: {lastValidated.timestamp.toLocaleTimeString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGateScan;