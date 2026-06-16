import React from 'react';
import { ShieldAlert, FileText, Scale } from 'lucide-react';

const sections = [
    {
        icon: Scale,
        title: 'Atomic Seat Reservation Windows',
        text: 'Seat selections are temporarily locked to prevent duplicate bookings. If a booking is not completed, those seats are released back into availability.'
    },
    {
        icon: ShieldAlert,
        title: 'Strict Cancellation Safeguards',
        text: 'Refunds and cancellations follow the platform timeline rules. Some actions may be restricted close to event start time for operational accuracy.'
    },
    {
        icon: FileText,
        title: 'Data Confidentiality',
        text: 'We aim to protect your login data, booking records, and account information through secure workflows and controlled access.'
    }
];

const Terms = () => {
    return (
        <div className="page-shell pt-24 pb-16">
            <div className="page-container max-w-4xl space-y-8">
                <div className="border-b border-[color:var(--app-border)] pb-4">
                    <p className="section-eyebrow">Legal & policy</p>
                    <h1 className="text-3xl font-black uppercase tracking-wide text-[var(--app-text)]">Terms & Platform Rules</h1>
                    <p className="text-sm text-[var(--app-muted)] mt-2">Simple rules to keep bookings secure and event operations smooth.</p>
                </div>

                {sections.map((section) => (
                    <div key={section.title} className="panel-surface p-5 space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--app-text)] flex items-center gap-2">
                            <section.icon size={14} className="text-[var(--app-accent)]" /> {section.title}
                        </h3>
                        <p className="text-[var(--app-muted)] text-sm leading-7 font-medium">{section.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Terms;
