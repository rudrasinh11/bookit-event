import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        toast.success('Message sent successfully.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container max-w-6xl">
                <div className="text-center mb-12 space-y-2">
                    <p className="section-eyebrow">Need support?</p>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--app-text)]">Contact BookIT Support</h1>
                    <p className="text-sm text-[var(--app-muted)] max-w-2xl mx-auto">Reach our team for booking help, admin questions, or platform assistance.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        {[
                            { icon: Mail, title: 'Email', value: 'bookit@mail.com' },
                            { icon: Phone, title: 'Phone', value: '+91 9876543210' },
                            { icon: MapPin, title: 'Office', value: 'Surat, Gujarat, India - 394130' }
                        ].map((item) => (
                            <div key={item.title} className="panel-surface p-5 flex items-start gap-4">
                                <item.icon className="text-[var(--app-accent)] shrink-0 mt-1" size={18} />
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--app-text)]">{item.title}</h4>
                                    <p className="text-sm text-[var(--app-muted)] mt-1 leading-6">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-3 panel-surface p-6">
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[var(--app-muted)] uppercase tracking-[0.24em]">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Your name"
                                    className="input-surface w-full px-4 py-3 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[var(--app-muted)] uppercase tracking-[0.24em]">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="input-surface w-full px-4 py-3 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[var(--app-muted)] uppercase tracking-[0.24em]">Message</label>
                                <textarea
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Describe your issue or requirement..."
                                    className="input-surface w-full px-4 py-3 text-sm min-h-32 resize-none"
                                />
                            </div>

                            <button type="submit" className="btn-surface w-full py-3.5 text-xs font-black uppercase tracking-[0.24em] shadow-md">
                                <Send size={14} /> Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
