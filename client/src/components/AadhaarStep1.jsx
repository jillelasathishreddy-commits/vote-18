import React, { useState } from 'react';
import { AlertCircle, Shield, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

export default function AadhaarStep1({ onOtpSent }) {
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format with spaces: 4 4 4 digits
  const handleInputChange = (e) => {
    setError('');
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < rawVal.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += rawVal[i];
    }
    setAadhaarInput(formatted);
  };

  const handleQuickFill = () => {
    setAadhaarInput('2345 6789 0123');
    setConsent(true);
    setError('');
  };

  const digitsOnly = aadhaarInput.replace(/\s+/g, '');
  const isLengthValid = digitsOnly.length === 12;
  const startsValid = digitsOnly.length > 0 ? parseInt(digitsOnly[0], 10) >= 2 : false;
  const isReady = isLengthValid && startsValid && consent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('Please provide consent for simulated identity verification.');
      return;
    }

    if (digitsOnly.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const firstDigit = parseInt(digitsOnly[0], 10);
    if (firstDigit < 2 || firstDigit > 9) {
      setError('Aadhaar number must start with a digit between 2 and 9 (UIDAI rule: cannot start with 0 or 1).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/aadhaar/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: digitsOnly,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP.');
      }

      onOtpSent({
        sessionId: data.sessionId,
        aadhaarLast4: data.aadhaarLast4,
        maskedAadhaar: data.maskedAadhaar,
        demoOtp: data.demoOtp,
      });
    } catch (err) {
      setError(err.message || 'Network error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-8 sm:p-10 transition-all">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight mb-2">
          Verify identity
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Demo only — use any 12 digits starting 2–9. Only the last 4 digits are stored.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="aadhaar-input" className="block text-sm font-medium text-stone-800">
              Aadhaar number
            </label>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs text-[#EA580C] hover:text-[#C2410C] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill sample: 2345 6789 0123
            </button>
          </div>

          <div className="relative">
            <input
              id="aadhaar-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={aadhaarInput}
              onChange={handleInputChange}
              placeholder="2345 6789 0123"
              className={`w-full px-4 py-3 rounded-lg border text-stone-900 placeholder:text-stone-400 font-mono tracking-wider text-base transition-colors focus:outline-none ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-stone-300 focus:border-stone-800 focus:ring-1 focus:ring-stone-800'
              }`}
            />
            {isLengthValid && startsValid && (
              <span className="absolute right-3.5 top-3.5 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
          </div>

          {digitsOnly.length > 0 && !startsValid && (
            <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              UIDAI rule: Aadhaar number must start with a digit between 2 and 9.
            </p>
          )}
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="aadhaar-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-[#EA580C] focus:ring-[#EA580C] cursor-pointer"
          />
          <label htmlFor="aadhaar-consent" className="text-sm text-stone-700 select-none cursor-pointer">
            I consent to simulated identity verification for this prototype.
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button matching screenshot */}
        <div>
          <button
            type="submit"
            disabled={!isReady || loading}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              isReady && !loading
                ? 'bg-[#E86A33] hover:bg-[#d65b25] text-white shadow-sm cursor-pointer active:scale-98'
                : 'bg-[#F4C59E] text-white/90 cursor-not-allowed'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Send OTP</span>
          </button>
        </div>
      </form>

      {/* Privacy compliance footer card */}
      <div className="mt-8 pt-6 border-t border-stone-100 flex items-center gap-2.5 text-xs text-stone-400">
        <Shield className="w-4 h-4 text-stone-400 shrink-0" />
        <span>Privacy Notice: Full Aadhaar is never saved in the database. Only masked digits (XXXX-XXXX-XXXX) are retained.</span>
      </div>
    </div>
  );
}
