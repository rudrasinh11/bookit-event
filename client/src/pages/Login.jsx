import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (!showOTP) {
                const data = await login(email, password);
                toast.success(`Welcome back, ${data.name || 'User'}!`);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                toast.success('Account successfully validated.');
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                toast.custom((t) => (
                    <div className="bg-[#1F2937] border border-amber-500/30 p-4 rounded-xl flex gap-3 text-sm text-amber-400 max-w-sm shadow-2xl">
                        <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-bold">Verification Pending</p>
                            <p className="text-xs text-[#D1D5DB] mt-0.5">A dynamic entry key (OTP) has been dispatched to your inbox.</p>
                        </div>
                    </div>
                ));
            } else {
                toast.error(err.message || err || 'Authentication rejected.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[var(--app-bg)] transition-colors duration-300">
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[var(--app-surface)] p-8 rounded-2xl border border-[color:var(--app-border)] shadow-2xl relative overflow-hidden text-[var(--app-text)]"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-[var(--app-text)] tracking-tight mb-2">Access Portal</h2>
                    <p className="text-xs font-bold text-[var(--app-muted)] uppercase tracking-widest">Synchronize credentials with BookIT</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <AnimatePresence mode="wait">
                        {!showOTP ? (
                            <motion.div
                                key="credentials-fields"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider">Email Address</label>
                                    <div className="relative flex items-center">
                                        <Mail className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)] font-medium"
                                            placeholder="client@domain.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider">Password</label>
                                    <div className="relative flex items-center">
                                        <Lock className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="w-full pl-11 pr-11 py-3 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)]"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp-challenge"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5">
                                    <ShieldAlert size={16} className="shrink-0" /> Dual-Factor Challenge Triggered.
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider text-center">Validation Code (OTP)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="000000"
                                        className="w-full px-4 py-3.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] tracking-[0.5em] text-center text-xl font-black focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)]"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength="6"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--app-button)] text-[var(--app-button-text)] font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90 shadow-xl"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : showOTP ? (
                            'Confirm Verification'
                        ) : (
                            <>Authenticate Signature <ArrowRight size={14} /></>
                        )}
                    </button>
                </form>

                <div className="h-px bg-[color:var(--app-border)] my-6" />

                <p className="text-center text-xs font-bold text-[var(--app-muted)]">
                    Need an account?{' '}
                    <Link to="/register" className="text-[var(--app-text)] hover:underline">
                        Establish credentials
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;