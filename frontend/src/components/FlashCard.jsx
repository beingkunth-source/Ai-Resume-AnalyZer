import { motion } from 'framer-motion';

export default function FlashCard({ children, title, icon: Icon, action, className = '', style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.12)' }}
      className={`card ${className}`}
      style={style}
    >
      {(title || action) && (
        <div className="card-header">
          {title && (
            <div className="card-title">
              {Icon && <Icon size={18} className="text-accent" />}
              <span>{title}</span>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
