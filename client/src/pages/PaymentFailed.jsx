import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';

const PaymentFailed = () => {
    return (
        <div className="w-full bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 min-h-screen flex items-center justify-center px-4 py-12">
            <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />

                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                    <XCircle size={32} />
                </div>
                
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Transaction Declined</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                    We could not process your seating reservation payment request. Please verify your funding sources, token properties, or balance metrics and try again.
                </p>
                
                <div className="space-y-2.5">
                    <Link 
                        to="/" 
                        className="w-full py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all block text-center active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                    >
                        <ArrowLeft size={12} /> Return to Event Catalog
                    </Link>
                    <Link 
                        to="/dashboard" 
                        className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors block text-center flex items-center justify-center gap-1.5"
                    >
                        <LayoutDashboard size={12} /> Go to My Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailed;