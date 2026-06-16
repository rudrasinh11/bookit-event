import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

const panelMotion = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' }
};

const fieldMotion = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' }
};

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
                navigate(data.role === 'admin' ? '/admin' : '/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                toast.success('Account successfully validated.');
                navigate(data.role === 'admin' ? '/admin' : '/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                toast.custom(() => (
                    <div className="panel-surface max-w-sm px-4 py-3 flex items-start gap-3 text-sm text-amber-500">
                        <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-bold text-[var(--app-text)]">Verification Pending</p>
                            <p className="text-xs text-[var(--app-muted)] mt-0.5">A one-time code has been sent to your inbox.</p>
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
        <div className="page-shell relative overflow-hidden py-10 md:py-16 px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(163,42,42,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(140,122,107,0.16),_transparent_30%)]" />
            <motion.div
                {...panelMotion}
                className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[32px] border border-[color:var(--app-border)] bg-[var(--app-surface)]/88 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-md"
            >
                <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,var(--app-accent),color-mix(in_srgb,var(--app-accent)_68%,black))] text-white p-10 xl:p-12">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_42%),radial-gradient(circle_at_bottom_left,_white,_transparent_36%)]" />
                    <div className="relative space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] backdrop-blur-md">
                            <Sparkles size={14} /> Secure Access
                        </span>
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">Welcome Back</h1>
                            <p className="max-w-md text-sm leading-7 text-white/80">
                                Sign in to manage your bookings, download tickets, monitor event activity and continue with a polished BookIT experience.
                            </p>
                        </div>
                    </div>

                    <div className="relative rounded-3xl border border-white/14 bg-white/10 p-6 backdrop-blur-md">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">What you get</p>
                        <div className="mt-4 space-y-3 text-sm text-white/85">
                            <div>• Instant access to your booking dashboard</div>
                            <div>• Smooth OTP verification flow</div>
                            <div>• Fast seat booking with cleaner UX</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 md:p-10 xl:p-12">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-8 text-center lg:text-left space-y-2">
                            <p className="section-eyebrow">Authentication</p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--app-text)]">
                                {showOTP ? 'Verify Your Login' : 'Sign In'}
                            </h2>
                            <p className="text-sm text-[var(--app-muted)] leading-6">
                                {showOTP
                                    ? 'Enter the 6-digit code sent to your email to complete your secure login.'
                                    : 'Use your registered email and password to continue.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="wait">
                                {!showOTP ? (
                                    <motion.div key="login-fields" {...fieldMotion} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Email Address</label>
                                            <div className="relative flex items-center">
                                                <Mail className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                                <input
                                                    type="email"
                                                    required
                                                    className="input-surface w-full pl-11 pr-4 py-3.5 text-sm font-medium"
                                                    placeholder="admin@bookit.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Password</label>
                                            <div className="relative flex items-center">
                                                <Lock className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    className="input-surface w-full pl-11 pr-11 py-3.5 text-sm"
                                                    placeholder="Enter your password"
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
                                    <motion.div key="otp-fields" {...fieldMotion} className="space-y-4">
                                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-500 flex items-start gap-3">
                                            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Verification required</p>
                                                <p className="text-xs text-[var(--app-muted)] mt-1">We sent a secure OTP to {email || 'your email'}.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-[0.24em] text-center">Verification Code</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                className="input-surface w-full px-4 py-4 text-center text-2xl font-black tracking-[0.55em]"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={loading} className="btn-surface w-full py-3.5 text-xs font-black uppercase tracking-[0.24em] shadow-lg hover:translate-y-[-1px] disabled:opacity-60">
                                {loading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : showOTP ? (
                                    'Confirm Verification'
                                ) : (
                                    <>Sign In <ArrowRight size={14} /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 border-t border-[color:var(--app-border)] pt-6 text-center text-sm text-[var(--app-muted)]">
                            Need an account?{' '}
                            <Link to="/register" className="font-semibold text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors">
                                Create one now
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
