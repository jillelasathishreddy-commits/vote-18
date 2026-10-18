import React from 'react';
import { ShieldCheck, Download, Printer, QrCode } from 'lucide-react';

export default function EpicCard({ application }) {
  if (!application || application.status !== 'Approved') return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-stone-300 shadow-xl overflow-hidden max-w-md mx-auto my-6 font-sans relative">
      {/* Top tricolor stripe */}
      <div className="h-2 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Header */}
      <div className="bg-[#1e293b] text-white p-4 text-center relative border-b border-stone-200">
        <div className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
          ELECTION COMMISSION OF INDIA · भारत निर्वाचन आयोग
        </div>
        <div className="text-xs text-stone-300 font-medium mt-0.5">
          ELECTOR PHOTO IDENTITY CARD · मतदाता पहचान पत्र (VOTE 18 SIMULATION)
        </div>
        <div className="mt-2 inline-block px-3 py-1 bg-white/10 rounded border border-white/20 text-white font-mono font-bold text-sm tracking-widest">
          {application.epicNumber || 'V18-1234567'}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 bg-gradient-to-br from-amber-50/20 via-white to-stone-50">
        <div className="flex gap-4">
          {/* Photo & Hologram */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-24 h-30 bg-stone-100 border-2 border-stone-400 rounded overflow-hidden shadow-sm">
              <img
                src={application.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                alt={application.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Holographic strip simulation */}
            <div className="w-24 h-4 mt-2 rounded bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-300 opacity-80 flex items-center justify-center text-[8px] font-bold text-stone-700 tracking-tighter">
              ★ VOTE 18 VERIFIED ★
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1.5 text-xs text-stone-800">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block">Name / नाम:</span>
              <strong className="text-sm font-bold text-stone-900">{application.fullName}</strong>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase block">
                {application.relationType}'s Name:
              </span>
              <span className="font-semibold text-stone-800">{application.relativeName}</span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1">
              <div>
                <span className="text-[10px] text-stone-500 block">Gender / लिंग:</span>
                <span className="font-medium">{application.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">DOB / जन्म तिथि:</span>
                <span className="font-medium">
                  {new Date(application.dob).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Polling Station & Constituency */}
        <div className="mt-4 pt-3 border-t border-dashed border-stone-300 text-xs text-stone-700 space-y-1">
          <div>
            <span className="text-[10px] text-stone-500 block">Assembly Constituency:</span>
            <span className="font-semibold text-stone-900">{application.assemblyConstituency}, {application.state}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block">Polling Station / मतदान केंद्र:</span>
            <span className="text-stone-800">{application.pollingStation || 'Govt High School, Room 2'}</span>
          </div>
          <div className="flex justify-between items-center pt-1 text-[11px] text-stone-500 font-mono">
            <span>Part No: {application.partNumber || '142'}</span>
            <span>Serial No: {application.serialNumber || '587'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-stone-100 p-2.5 text-center text-[10px] text-stone-500 border-t border-stone-200 flex items-center justify-between px-4">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Aadhaar-Verified Citizen (18+)
        </span>
        <span className="font-mono text-stone-400">Ref: {application.applicationId}</span>
      </div>
    </div>
  );
}
