import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';

const PaymentFailed = () => {
    return (
        <div className="page-shell flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="panel-surface p-8 md:p-10 max-w-md w-full text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <XCircle size={32} />
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--app-text)] mb-2">Payment Failed</h1>
                <p className="text-[var(--app-muted)] text-sm leading-7 mb-8">
                    We could not complete your payment. Please review your details and try again.
                </p>

                <div className="space-y-2.5">
                    <Link to="/" className="btn-surface w-full py-3 text-xs font-black uppercase tracking-[0.22em]">
                        <ArrowLeft size={12} /> Back to Events
                    </Link>
                    <Link to="/dashboard" className="btn-surface-secondary w-full py-3 text-xs font-black uppercase tracking-[0.22em]">
                        <LayoutDashboard size={12} /> Go to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailed;
