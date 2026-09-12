import { motion } from 'framer-motion';

export default function Card({ children, title, icon: Icon, action, className = '', style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
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
