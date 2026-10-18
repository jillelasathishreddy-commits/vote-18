import React, { useState, useEffect } from 'react';
import AadhaarStep1 from '../components/AadhaarStep1';
import OtpStep2 from '../components/OtpStep2';
import DetailsStep3 from '../components/DetailsStep3';
import DoneStep4 from '../components/DoneStep4';

const STEPS = [
  { id: 1, label: 'Aadhaar' },
  { id: 2, label: 'OTP' },
  { id: 3, label: 'Details' },
  { id: 4, label: 'Done' },
];

export default function ApplyPage({ onTrackNow }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  // Auto scroll to top when changing steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handlers
  const handleOtpSent = (data) => {
    setSessionData(data);
    setCurrentStep(2);
  };

  const handleVerified = (data) => {
    setVerificationData(data);
    setCurrentStep(3);
  };

  const handleSubmitted = (app) => {
    setSubmittedApplication(app);
    setCurrentStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* 4-Step Stepper Progress Bar matching screenshot */}
      <div className="mb-8 sm:mb-10">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                {/* Horizontal Progress bar above text matching screenshot */}
                <div
                  className={`w-full h-1 rounded-full mb-2.5 transition-colors duration-300 ${
                    isActive
                      ? 'bg-[#EA580C]'
                      : isCompleted
                      ? 'bg-stone-400'
                      : 'bg-stone-200'
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium tracking-tight transition-colors ${
                    isActive
                      ? 'text-stone-900 font-semibold'
                      : isCompleted
                      ? 'text-stone-600'
                      : 'text-stone-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Views */}
      <main>
        {currentStep === 1 && (
          <AadhaarStep1 onOtpSent={handleOtpSent} />
        )}

        {currentStep === 2 && sessionData && (
          <OtpStep2
            sessionData={sessionData}
            onVerified={handleVerified}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && verificationData && (
          <DetailsStep3
            verificationData={verificationData}
            onSubmitted={handleSubmitted}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && submittedApplication && (
          <DoneStep4
            application={submittedApplication}
            onTrackNow={onTrackNow}
          />
        )}
      </main>
    </div>
  );
}
