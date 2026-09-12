import { motion } from 'framer-motion';

export default function SkillBadge({ name, variant = 'blue', icon: Icon = null }) {
  const variantMap = {
    green: 'green',
    red: 'red',
    yellow: 'yellow',
    purple: 'purple',
    teal: 'teal',
    blue: '',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`tag ${variantMap[variant] || ''}`}
    >
      {Icon && <Icon size={12} />}
      {name}
    </motion.span>
  );
}
