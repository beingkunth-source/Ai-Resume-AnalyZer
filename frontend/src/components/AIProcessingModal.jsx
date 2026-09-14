import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const DEFAULT_STEPS = [
  'Reading your resume data',
  'Extracting skills & competencies',
  'Analyzing work experience & impact',
  'Reviewing GitHub activity & repositories',
  'Reviewing LinkedIn positioning',
  'Building Unified AI Career Profile',
  'Finding relevant job recommendations',
  'Preparing personalized career roadmap',
];

export default function AIProcessingModal({
  isOpen,
  title = 'Building your professional profile',
  subtitle = 'Our AI engine is combining your resume, LinkedIn, GitHub, and preferences...',
  steps = DEFAULT_STEPS,
  onComplete,
  durationPerStep = 600,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex < steps.length - 1) {
          return prevIndex + 1;
        } else {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return prevIndex;
        }
      });
    }, durationPerStep);

    return () => clearInterval(interval);
  }, [isOpen, steps, durationPerStep, onComplete]);

  if (!isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / steps.length) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 text-slate-800 transition-all">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
            <ArrowPathIcon className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-slate-600">
            <span>Overall Progress</span>
            <span className="text-emerald-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Checklist */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 text-sm p-2.5 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <ArrowPathIcon className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
