import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Sparkles } from 'lucide-react';

const About = () => {
    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container max-w-5xl space-y-12">
                <div className="text-center space-y-4">
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="section-eyebrow">About the platform</p>
                        <h1 className="text-4xl font-black tracking-tight uppercase text-[var(--app-text)]">
                            About Book<span className="text-[var(--app-accent)]">IT</span>
                        </h1>
                    </motion.div>
                    <p className="text-[var(--app-muted)] text-sm max-w-2xl mx-auto leading-7 font-medium">
                        We build next-generation event infrastructure with secure ticketing, smooth booking flows, and dashboard tools designed for both organizers and attendees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="panel-surface p-6 space-y-3">
                        <div className="w-11 h-11 rounded-2xl bg-[var(--app-bg)] border border-[color:var(--app-border)] text-[var(--app-accent)] flex items-center justify-center">
                            <Target size={18} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-[var(--app-text)]">Our Mission</h3>
                        <p className="text-[var(--app-muted)] text-sm leading-7 font-medium">
                            To reduce fraud, simplify booking, and deliver a clean event experience through secure authentication, booking visibility, and reliable event management.
                        </p>
                    </div>

                    <div className="panel-surface p-6 space-y-3">
                        <div className="w-11 h-11 rounded-2xl bg-[var(--app-bg)] border border-[color:var(--app-border)] text-[var(--app-accent)] flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-[var(--app-text)]">Security First</h3>
                        <p className="text-[var(--app-muted)] text-sm leading-7 font-medium">
                            OTP verification, role-aware access, and seat protection workflows help organizers and users interact in a more trusted environment.
                        </p>
                    </div>
                </div>

                <div className="panel-surface p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    <div>
                        <div className="text-3xl font-black text-[var(--app-text)] font-mono">₹4.9M+</div>
                        <div className="section-eyebrow mt-2">Processed</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[var(--app-text)] font-mono">150K+</div>
                        <div className="section-eyebrow mt-2">Passes</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[var(--app-text)] font-mono">99.9%</div>
                        <div className="section-eyebrow mt-2">Uptime</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[var(--app-text)] font-mono">12ms</div>
                        <div className="section-eyebrow mt-2">Lock Speed</div>
                    </div>
                </div>

                <div className="panel-surface p-6 flex items-start gap-4">
                    <Sparkles className="text-[var(--app-accent)] mt-1" size={18} />
                    <p className="text-sm leading-7 text-[var(--app-muted)] font-medium">
                        BookIT is built to feel smoother across mobile and desktop, with a stronger focus on responsiveness, dashboard clarity, and modern UI feedback.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;
