import React from 'react';
import { ShieldAlert, FileText, Scale } from 'lucide-react';

const Terms = () => {
    return (
        <div className="w-full bg-[#2B2621] text-[#F4EFEA] min-h-screen pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                <div className="border-b border-[#8C7A6B]/20 pb-4">
                    <h1 className="text-3xl font-black uppercase tracking-wide">Legal Compliance Matrix</h1>
                    <p className="text-xs font-black text-[#A32A2A] uppercase tracking-widest mt-1">Platform Rules & Privacy Safeguards</p>
                </div>

                {/* Section 1 */}
                <div className="space-y-3 bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#F4EFEA] flex items-center gap-2">
                        <Scale size={14} className="text-[#A32A2A]" /> 1. Atomic Seat Reservation Windows
                    </h3>
                    <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-semibold">
                        When selecting coordinates inside our 3D Spatial Allocation grid, target nodes register an atomic database timeout lock. Users must finalize payment sequences before the tracking pool index expires. Releasing locked nodes automatically restores them back to public availability.
                    </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#F4EFEA] flex items-center gap-2">
                        <ShieldAlert size={14} className="text-[#A32A2A]" /> 2. Strict Cancellation Safeguards
                    </h3>
                    <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-semibold">
                        Refund eligibility cycles enforce a systematic 24-hour baseline rule. Booking cancel methods lock out exactly 24 hours prior to live event execution. Any override configurations or processing variations require explicit permissions from an Admin or Organizer node.
                    </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-3 bg-[#3D352E] border border-[#A32A2A]/20 p-5 rounded-2xl shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#F4EFEA] flex items-center gap-2">
                        <FileText size={14} className="text-[#A32A2A]" /> 3. Data Confidentiality Ledger
                    </h3>
                    <p className="text-[#F4EFEA]/70 text-xs leading-relaxed font-semibold">
                        We prioritize complete parameter confidentiality. User emails, validation signatures, and transaction data records undergo strict verification checking layers. Real-time WebSocket connection telemetry tracking handles socket streams seamlessly without exposing unencrypted personal context strings.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Terms;