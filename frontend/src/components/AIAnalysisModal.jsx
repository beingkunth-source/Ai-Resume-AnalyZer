import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 1, text: 'Extracting resume text & structure' },
  { id: 2, text: 'Identifying technical & soft skills' },
  { id: 3, text: 'Evaluating ATS rule compatibility' },
  { id: 4, text: 'Detecting missing sections & weak keywords' },
  { id: 5, text: 'Generating AI recommendations' },
];

export default function AIAnalysisModal({ isOpen }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length) return prev + 1;
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-backdrop">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="modal-card"
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={28} className="animate-spin-slow" />
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Analyzing Your Resume</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
            Our AI engine is evaluating your resume for ATS compliance and impact.
          </p>

          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            {STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`processing-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  ) : isActive ? (
                    <Loader2 size={18} className="spinner" style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span>{step.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
