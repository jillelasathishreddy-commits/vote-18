import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Check, ExternalLink, ArrowRight, Printer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DoneStep4({ application, onTrackNow }) {
  const { quickSwitchRole } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EA580C', '#10B981', '#3B82F6', '#F59E0B'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleCopyId = () => {
    if (application?.applicationId) {
      navigator.clipboard.writeText(application.applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-8 sm:p-12 transition-all">
      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
          Application Submitted!
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Your simulated Form 6 voter application has been submitted to Vote 18. It is currently awaiting approval by an Electoral Officer (Admin).
        </p>
      </div>

      {/* Reference Number Box */}
      <div className="max-w-md mx-auto p-5 bg-stone-50 border border-stone-200 rounded-xl mb-6 text-center">
        <span className="text-xs uppercase font-semibold tracking-wider text-stone-500 block mb-1">
          Application Reference Number
        </span>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tracking-wider">
            {application?.applicationId || 'V18-2026-00000'}
          </span>
          <button
            onClick={handleCopyId}
            title="Copy ID"
            className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Status: Submitted (Pending Officer Approval)
        </div>
      </div>

      {/* Evaluator Flow Box: Shows exact instructions */}
      <div className="max-w-md mx-auto mb-8 p-4 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-stone-800">
        <div className="font-bold text-[#EA580C] flex items-center gap-1.5 mb-1 text-sm">
          <ShieldCheck className="w-4 h-4" />
          Approval Lifecycle Step:
        </div>
        <p className="text-stone-600 leading-relaxed mb-3">
          As a Citizen User, your application is now lodged. To approve this application and generate the voter card, switch to the <strong>Admin</strong> role!
        </p>
        <button
          onClick={async () => {
            await quickSwitchRole('admin');
            onTrackNow(application?.applicationId);
          }}
          className="w-full py-2 px-3 bg-[#EA580C] hover:bg-[#d65b25] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>Switch to Admin & Review This Application 🛡️</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Duplicate alert if present */}
      {application?.duplicateFlag && (
        <div className="max-w-md mx-auto mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Demo Duplicate Detection Notice:</strong>
            <p className="mt-0.5">{application.duplicateReason}</p>
          </div>
        </div>
      )}

      {/* Summary grid */}
      <div className="max-w-md mx-auto border-t border-b border-stone-100 py-4 mb-8 text-xs grid grid-cols-2 gap-y-3">
        <div>
          <span className="text-stone-400 block">Applicant Name</span>
          <span className="font-semibold text-stone-800">{application?.fullName}</span>
        </div>
        <div>
          <span className="text-stone-400 block">Aadhaar (Last 4)</span>
          <span className="font-mono font-semibold text-stone-800">XXXX-XXXX-{application?.aadhaarLast4}</span>
        </div>
        <div>
          <span className="text-stone-400 block">Constituency</span>
          <span className="font-semibold text-stone-800">{application?.assemblyConstituency}</span>
        </div>
        <div>
          <span className="text-stone-400 block">System</span>
          <span className="font-semibold text-stone-800">Vote 18 Portal</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => onTrackNow(application?.applicationId)}
          className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <span>Track Application Status</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Acknowledgment</span>
        </button>
      </div>

      {/* Official advisory */}
      <div className="mt-10 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
        <p className="mb-2">
          Vote 18 is an academic engineering prototype. For real voter registration, visit:
        </p>
        <a
          href="https://voters.eci.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#EA580C] hover:underline inline-flex items-center gap-1 font-medium"
        >
          <span>Election Commission of India (voters.eci.gov.in)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
