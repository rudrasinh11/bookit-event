import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target } from 'lucide-react';

const About = () => {
    return (
        <div className="w-full bg-[#2B2621] text-[#F4EFEA] min-h-screen pt-24 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black tracking-tight uppercase"
                    >
                        About Book<span className="text-[#A32A2A]">IT</span>
                    </motion.h1>
                    <p className="text-[#F4EFEA]/80 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
                        We build next-generation event infrastructure. BookIT provides secure ticketing routing pipelines, millisecond-locked seat reservations, and real-time ledger auditing tools.
                    </p>
                </div>

                <div className="h-px bg-[#8C7A6B]/20" />

                {/* Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#3D352E] border border-[#A32A2A]/20 p-6 rounded-2xl shadow-xl space-y-3">
                        <div className="w-10 h-10 bg-[#2B2621] border border-[#8C7A6B]/20 text-[#A32A2A] rounded-xl flex items-center justify-center">
                            <Target size={18} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-[#F4EFEA]">Our Mission</h3>
                        <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-medium">
                            To eliminate secondary market ticket fraud and allocation duplication by tracking every seat transaction securely through our live multi-tenant workspace matrix.
                        </p>
                    </div>

                    <div className="bg-[#3D352E] border border-[#A32A2A]/20 p-6 rounded-2xl shadow-xl space-y-3">
                        <div className="w-10 h-10 bg-[#2B2621] border border-[#8C7A6B]/20 text-[#A32A2A] rounded-xl flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-[#F4EFEA]">Absolute Security</h3>
                        <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-medium">
                            With mandatory dual-factor validation protocols and absolute seat inventory locks, organizers and customers interact inside a completely trusted environment.
                        </p>
                    </div>
                </div>

                {/* Performance Stats Block */}
                <div className="bg-[#3D352E] border border-[#A32A2A]/20 rounded-2xl p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center shadow-inner">
                    <div>
                        <div className="text-3xl font-black text-[#F4EFEA] font-mono">₹4.9M+</div>
                        <div className="text-[10px] font-black text-[#A32A2A] uppercase tracking-widest mt-1">Processed Volume</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[#F4EFEA] font-mono">150K+</div>
                        <div className="text-[10px] font-black text-[#A32A2A] uppercase tracking-widest mt-1">Passes Allocated</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[#F4EFEA] font-mono">99.9%</div>
                        <div className="text-[10px] font-black text-[#A32A2A] uppercase tracking-widest mt-1">Uptime SLA</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[#F4EFEA] font-mono">12ms</div>
                        <div className="text-[10px] font-black text-[#A32A2A] uppercase tracking-widest mt-1">Lock Latency</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default About;