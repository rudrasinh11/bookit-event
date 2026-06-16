import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const panelMotion = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' }
};

const stepMotion = {
    initial: { opacity: 0, x: -14 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 14 },
    transition: { duration: 0.32, ease: 'easeOut' }
};

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const evaluatePasswordStrength = (val) => {
        let score = 0;
        if (!val) return { score, label: 'None', color: 'bg-zinc-300' };
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/\d/.test(val)) score++;
        if (/[@$!%*?&]/.test(val)) score++;

        switch (score) {
            case 1: return { score, label: 'Weak', color: 'bg-red-500' };
            case 2: return { score, label: 'Fair', color: 'bg-amber-500' };
            case 3: return { score, label: 'Good', color: 'bg-blue-500' };
            case 4: return { score, label: 'Strong', color: 'bg-emerald-500' };
            default: return { score, label: 'Weak', color: 'bg-red-500' };
        }
    };

    const passwordStrength = evaluatePasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!showOTP && passwordStrength.score < 4) {
            setLoading(false);
            return toast.error('Please use a stronger password with uppercase, lowercase, number, and special character.');
        }

        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
                toast.success('Registration started. OTP sent to your email.');
            } else {
                await verifyOTP(email, otp);
                toast.success('Profile created successfully!');
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err || 'Registration pipeline rejected parameters.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-shell relative overflow-hidden py-10 md:py-16 px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,42,42,0.14),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(140,122,107,0.18),_transparent_30%)]" />
            <motion.div
                {...panelMotion}
                className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] overflow-hidden rounded-[32px] border border-[color:var(--app-border)] bg-[var(--app-surface)]/88 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-md"
            >
                <div className="order-2 lg:order-1 p-6 sm:p-8 md:p-10 xl:p-12">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-8 text-center lg:text-left space-y-2">
                            <p className="section-eyebrow">Join BookIT</p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--app-text)]">
                                {showOTP ? 'Confirm Your Account' : 'Create Account'}
                            </h2>
                            <p className="text-sm text-[var(--app-muted)] leading-6">
                                {showOTP
                                    ? 'Finish setup by entering the one-time password sent to your inbox.'
                                    : 'Create your account to book events faster, manage passes, and access your dashboard.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="wait">
                                {!showOTP ? (
                                    <motion.div key="register-step" {...stepMotion} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Full Name</label>
                                            <div className="relative flex items-center">
                                                <User className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                                <input
                                                    type="text"
                                                    required
                                                    className="input-surface w-full pl-11 pr-4 py-3.5 text-sm font-medium"
                                                    placeholder="Rudra Sinh"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-[0.24em]">Email Address</label>
                                            <div className="relative flex items-center">
                                                <Mail className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                                <input
                                                    type="email"
                                                    required
                                                    className="input-surface w-full pl-11 pr-4 py-3.5 text-sm font-medium"
                                                    placeholder="you@example.com"
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
                                                    type="password"
                                                    required
                                                    className="input-surface w-full pl-11 pr-4 py-3.5 text-sm"
                                                    placeholder="Create a secure password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </div>
                                            {password && (
                                                <div className="space-y-2 pt-1.5">
                                                    <div className="flex items-center justify-between text-[11px] font-semibold">
                                                        <span className="text-[var(--app-muted)]">Password strength</span>
                                                        <span className="text-[var(--app-text)] uppercase tracking-[0.18em]">{passwordStrength.label}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-[var(--app-bg)] border border-[color:var(--app-border)] overflow-hidden">
                                                        <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="otp-step" {...stepMotion} className="space-y-4">
                                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                                            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-[var(--app-text)]">Almost done</p>
                                                <p className="text-xs text-[var(--app-muted)] mt-1">Your verification code was sent to {email || 'your email'}.</p>
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
                                    'Verify Account'
                                ) : (
                                    <>Create Account <ArrowRight size={14} /></>
                                )}
                            </button>
                        </form>

                        {!showOTP && (
                            <div className="mt-8 border-t border-[color:var(--app-border)] pt-6 text-center text-sm text-[var(--app-muted)]">
                                Already registered?{' '}
                                <Link to="/login" className="font-semibold text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors">
                                    Sign in instead
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="order-1 lg:order-2 relative hidden lg:flex flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,var(--app-button),color-mix(in_srgb,var(--app-button)_82%,black))] text-[var(--app-button-text)] p-10 xl:p-12">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_white,_transparent_42%),radial-gradient(circle_at_bottom_right,_white,_transparent_36%)]" />
                    <div className="relative space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] backdrop-blur-md">
                            <Sparkles size={14} /> Fresh Start
                        </span>
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">Build Your Profile</h1>
                            <p className="max-w-md text-sm leading-7 opacity-80">
                                Join BookIT to unlock real-time event discovery, elegant ticket management, and a smoother booking experience across every screen.
                            </p>
                        </div>
                    </div>

                    <div className="relative rounded-3xl border border-white/14 bg-white/10 p-6 backdrop-blur-md">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-80">Highlights</p>
                        <div className="mt-4 space-y-3 text-sm opacity-90">
                            <div>• Clean registration with OTP security</div>
                            <div>• Better dashboard experience</div>
                            <div>• Dark / light theme ready UI</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
