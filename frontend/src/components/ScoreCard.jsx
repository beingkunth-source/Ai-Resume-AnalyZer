import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

function getScoreVariant(score) {
  if (score >= 70) return 'score-high';
  if (score >= 45) return 'score-medium';
  return 'score-low';
}

export default function ScoreCard({ title, score = 0, size = 'lg', subtitle, atsChecks = null }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, Math.round(score)));
    if (end === 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 1000;
    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [score]);

  const variantClass = getScoreVariant(score);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card text-center flex flex-col items-center justify-center p-6"
    >
      {title && <h3 className="text-sm uppercase tracking-wider text-muted font-bold mb-3">{title}</h3>}
      <div className={`score-badge ${size} ${variantClass} my-2`}>
        {displayScore}
      </div>
      {subtitle && <p className="text-sm text-secondary mt-2">{subtitle}</p>}

      {atsChecks && (
        <div className="w-full mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 text-left">ATS Rule Breakdown</h4>
          <div className="ats-grid">
            {Object.entries(atsChecks).map(([key, passed]) => (
              <div key={key} className={`ats-item ${passed ? 'pass' : 'fail'}`}>
                <span>{key.replace(/_/g, ' ')}</span>
                {passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
