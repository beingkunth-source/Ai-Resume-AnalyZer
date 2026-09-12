import { motion } from 'framer-motion';

export default function ProgressBar({ label, value = 0, color = 'var(--accent)', height = 8 }) {
  const rounded = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ color }}>{rounded}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rounded}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
          }}
        />
      </div>
    </div>
  );
}
