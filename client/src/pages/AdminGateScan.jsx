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
            return toast.error('Please input both the booking ID and seat ID.');
        }

        setProcessing(true);
        try {
            const { data } = await api.post('/bookings/verify-checkin', {
                bookingId: scanData.bookingId.trim(),
                seatId: scanData.seatId.trim().toUpperCase()
            });

            toast.success(data.message || 'Check-in authorized.');
            setLastValidated({ seatId: scanData.seatId.toUpperCase(), timestamp: new Date(), success: true });
            setScanData({ bookingId: '', seatId: '' });
        } catch (error) {
            const errorText = error.response?.data?.message || 'Check-in validation failure.';
            toast.error(errorText);
            setLastValidated({ seatId: scanData.seatId.toUpperCase(), timestamp: new Date(), success: false, reason: errorText });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="page-shell min-h-screen pt-20 pb-16 flex items-center justify-center px-4">
            <div className="panel-surface max-w-md w-full p-6 md:p-8 space-y-6">
                <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm bg-[var(--app-button)] text-[var(--app-button-text)]">
                        <Scan size={22} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-[var(--app-text)]">Gate Check-In Validation</h1>
                    <p className="text-sm text-[var(--app-muted)]">Verify attendee entry using booking and seat information.</p>
                </div>

                <form onSubmit={handleVerifyCheckIn} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Booking ID</label>
                        <div className="relative flex items-center">
                            <QrCode className="absolute left-3 text-[var(--app-muted)]" size={14} />
                            <input
                                type="text"
                                placeholder="Booking ID"
                                value={scanData.bookingId}
                                onChange={(e) => setScanData({ ...scanData, bookingId: e.target.value })}
                                className="input-surface w-full pl-9 pr-3 py-3 text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Seat ID</label>
                        <div className="relative flex items-center">
                            <ShieldCheck className="absolute left-3 text-[var(--app-muted)]" size={14} />
                            <input
                                type="text"
                                placeholder="A-1, B-12"
                                value={scanData.seatId}
                                onChange={(e) => setScanData({ ...scanData, seatId: e.target.value })}
                                className="input-surface w-full pl-9 pr-3 py-3 text-sm font-mono"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={processing} className="btn-surface w-full py-3.5 text-xs font-black uppercase tracking-[0.22em] disabled:opacity-60">
                        {processing ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Authorize Check-In'}
                    </button>
                </form>

                {lastValidated && (
                    <div className={`rounded-xl border p-4 flex gap-3 text-sm ${lastValidated.success ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}>
                        {lastValidated.success ? <CheckCircle2 className="shrink-0" size={16} /> : <AlertTriangle className="shrink-0" size={16} />}
                        <div>
                            <p className="font-bold uppercase tracking-wide text-[var(--app-text)]">Last Result</p>
                            <p className="text-[var(--app-muted)] mt-1">
                                {lastValidated.success ? `Seat ${lastValidated.seatId} checked in successfully.` : `Seat ${lastValidated.seatId} rejected: ${lastValidated.reason}`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGateScan;
