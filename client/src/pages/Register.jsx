import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

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
        if (!val) return { score, label: 'None', color: 'bg-[#6B7280]/20' };
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
            return toast.error('Please fulfill all mandatory strong password structural prerequisites.');
        }

        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
                toast.success('Registration signature generated. Validation key dispatched.');
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
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[var(--app-bg)] transition-colors duration-300">
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[var(--app-surface)] p-8 rounded-2xl border border-[color:var(--app-border)] shadow-2xl relative overflow-hidden text-[var(--app-text)]"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-[var(--app-text)] tracking-tight mb-2">Create Account</h2>
                    <p className="text-xs font-bold text-[var(--app-muted)] uppercase tracking-widest">Initialize asset registration protocols</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        {!showOTP ? (
                            <motion.div
                                key="register-inputs"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider">Full Name</label>
                                    <div className="relative flex items-center">
                                        <User className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)] font-medium"
                                            placeholder="Alexander Wright"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider">Email Address</label>
                                    <div className="relative flex items-center">
                                        <Mail className="absolute left-4 text-[var(--app-muted)]" size={16} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)] font-medium"
                                            placeholder="alex@firm.com"
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
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[color:var(--app-border)] bg-[var(--app-bg)] text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent outline-none transition-all text-[var(--app-text)] placeholder-[color:var(--app-muted)]"
                                            placeholder="Fulfill security benchmarks"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    
                                    {password && (
                                        <div className="pt-1.5 space-y-1">
                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                <span className="text-[var(--app-muted)]">Entropy Complexity:</span>
                                                <span className="text-[var(--app-text)] uppercase tracking-wider">{passwordStrength.label}</span>
                                            </div>
                                            <div className="h-1 w-full bg-[var(--app-bg)] rounded-full overflow-hidden border border-[color:var(--app-border)]">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register-otp"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-2.5">
                                    <ShieldCheck size={16} className="mt-0.5 shrink-0" /> Validation key has been securely transmitted to your inbox.
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-[var(--app-muted)] uppercase tracking-wider text-center">Verification Token (OTP)</label>
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
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--app-button)] text-[var(--app-button-text)] font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90 shadow-md mt-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : showOTP ? (
                            'Authorize Vault profile'
                        ) : (
                            <>Generate Registry Node <ArrowRight size={14} /></>
                        )}
                    </button>
                </form>

                {!showOTP && (
                    <>
                        <div className="h-px bg-[color:var(--app-border)] my-6" />
                        <p className="text-center text-xs font-bold text-[var(--app-muted)]">
                            Already registered?{' '}
                            <Link to="/login" className="text-[var(--app-text)] hover:underline">
                                Return to Authenticator
                            </Link>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default Register;