import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';

export default function RecommendationCard({ weakness }) {
  if (!weakness) return null;

  const problem = typeof weakness === 'string' ? weakness : weakness.problem;
  const whyItMatters = typeof weakness === 'object' ? weakness.why_it_matters : null;
  const recommendation = typeof weakness === 'object' ? weakness.recommendation : null;
  const improvedExample = typeof weakness === 'object' ? weakness.improved_example : null;

  // Split example if it contains "Before: ... | After: ..."
  let beforeEx = null;
  let afterEx = null;
  if (improvedExample) {
    if (improvedExample.includes('|')) {
      const parts = improvedExample.split('|');
      beforeEx = parts[0]?.replace(/^Before:\s*/i, '').trim();
      afterEx = parts[1]?.replace(/^After:\s*/i, '').trim();
    } else {
      afterEx = improvedExample;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rec-card"
    >
      <div className="rec-problem">
        <AlertCircle size={16} />
        <span>{problem}</span>
      </div>

      {whyItMatters && (
        <div className="rec-why">
          <strong>Why it matters:</strong> {whyItMatters}
        </div>
      )}

      {recommendation && (
        <div className="rec-action">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
            <Lightbulb size={16} />
            <span>Actionable Recommendation:</span>
          </div>
          <div>{recommendation}</div>
        </div>
      )}

      {(beforeEx || afterEx) && (
        <div className="rec-example-box">
          {beforeEx && (
            <div className="rec-example-before">
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 2 }}>Before</div>
              <div>"{beforeEx}"</div>
            </div>
          )}
          {afterEx && (
            <div className="rec-example-after">
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 2 }}>After (Improved)</div>
              <div>"{afterEx}"</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
