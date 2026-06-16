import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        toast.success("Message dispatched safely to our network operators.");
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="w-full bg-[#2B2621] text-[#F4EFEA] min-h-screen pt-24 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center mb-12 space-y-2">
                    <h1 className="text-4xl font-black tracking-tight uppercase">Contact Core Support</h1>
                    <p className="text-xs font-black text-[#A32A2A] uppercase tracking-widest">Connect directly with BookIT Operations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    
                    {/* Information Channels */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                            <Mail className="text-[#A32A2A] shrink-0 mt-1" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#F4EFEA]">Network Registry Mail</h4>
                                <p className="text-xs text-[#F4EFEA]/80 font-mono mt-1">bookit@mail.com</p>
                            </div>
                        </div>

                        <div className="bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                            <Phone className="text-[#A32A2A] shrink-0 mt-1" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#F4EFEA]">Live Helpdesk Router</h4>
                                <p className="text-xs text-[#F4EFEA]/80 font-mono mt-1">+91 9876543210</p>
                            </div>
                        </div>

                        <div className="bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                            <MapPin className="text-[#A32A2A] shrink-0 mt-1" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#F4EFEA]">HQ Cluster Matrix</h4>
                                <p className="text-xs text-[#F4EFEA]/70 leading-relaxed font-medium mt-1">
                                    Surat, Gujarat, India - 394130
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Form Desk */}
                    <div className="lg:col-span-3 bg-[#3D352E] border border-[#A32A2A]/20 p-6 rounded-2xl shadow-2xl">
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest">Identity Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Your Name" 
                                    className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs text-[#F4EFEA] focus:border-[#A32A2A] outline-none font-bold placeholder-[#8C7A6B]/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest">Return Routing Email</label>
                                <input 
                                    required 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="youremail@domain.com" 
                                    className="w-full px-3.5 py-2.5 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs text-[#F4EFEA] focus:border-[#A32A2A] outline-none font-mono placeholder-[#8C7A6B]/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest">Query Context Payload</label>
                                <textarea 
                                    required 
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    placeholder="Describe your operational or transactional support requirements in detail..." 
                                    className="w-full p-3 bg-[#2B2621]/60 border border-[#8C7A6B]/30 rounded-xl text-xs text-[#F4EFEA] focus:border-[#A32A2A] outline-none h-28 resize-none font-semibold placeholder-[#8C7A6B]/50"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3 bg-[#F4EFEA] text-[#2B2621] font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#D1D5DB] transition-colors shadow-md"
                            >
                                <Send size={12} /> Dispatch Transmission
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Contact;