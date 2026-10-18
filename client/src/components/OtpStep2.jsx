import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Sparkles, KeyRound } from 'lucide-react';

export default function OtpStep2({ sessionData, onVerified, onBack }) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    setError('');
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const fullOtp = otpDigits.join('');
  const isComplete = fullOtp.length === 6;

  const handleAutofillDemo = () => {
    const code = sessionData?.demoOtp || '123456';
    const digits = code.split('').slice(0, 6);
    setOtpDigits(digits);
    setError('');
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!isComplete) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/aadhaar/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          otp: fullOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      onVerified(data.data);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError('');
    try {
      await fetch('/api/aadhaar/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: `23456789${sessionData.aadhaarLast4}`,
          consent: true,
        }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-8 sm:p-10 transition-all">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-4 cursor-pointer font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Aadhaar input
        </button>
        <h1 className="text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight mb-2">
          Enter OTP
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Simulated 6-digit verification code sent to mobile linked with Aadhaar ending in{' '}
          <span className="font-semibold text-stone-800 font-mono">
            {sessionData.aadhaarLast4 || 'XXXX'}
          </span>
          .
        </p>
      </div>

      {/* Demo testing banner */}
      <div className="mb-6 p-3.5 bg-orange-50/70 border border-orange-200/70 rounded-lg flex items-center justify-between text-xs text-orange-900">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#EA580C] shrink-0" />
          <span>
            Simulated Demo OTP: <strong className="font-mono text-sm tracking-widest">{sessionData.demoOtp || '123456'}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="px-2.5 py-1 bg-white text-[#EA580C] border border-orange-200 rounded font-semibold hover:bg-orange-100 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Auto-fill
        </button>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-800 mb-3">
            6-digit security code
          </label>
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono border rounded-lg border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all text-stone-900 outline-none"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={!isComplete || loading}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 ${
              isComplete && !loading
                ? 'bg-[#E86A33] hover:bg-[#d65b25] text-white shadow-sm cursor-pointer'
                : 'bg-[#F4C59E] text-white/90 cursor-not-allowed'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Verify & Continue</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </form>
    </div>
  );
}
