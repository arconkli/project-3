import React from 'react';
import { Mail, Check, AlertCircle, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationLoaderProps {
  type: 'loading' | 'success' | 'error' | 'waiting';
  size?: 'sm' | 'md' | 'lg';
}

const VerificationLoader: React.FC<VerificationLoaderProps> = ({ 
  type, 
  size = 'md' 
}) => {
  // Determine sizes based on the size prop
  const getSize = () => {
    switch (size) {
      case 'sm': return { outer: 'p-2', icon: 'h-4 w-4' };
      case 'lg': return { outer: 'p-5', icon: 'h-8 w-8' };
      default: return { outer: 'p-3', icon: 'h-6 w-6' };
    }
  };
  
  const { outer, icon } = getSize();
  
  // Different animations and colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-500/20',
          icon: <Check className={`${icon} text-green-500`} />,
          animation: {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: 'spring', stiffness: 300, damping: 20 }
          }
        };
      case 'error':
        return {
          container: 'bg-red-500/20',
          icon: <AlertCircle className={`${icon} text-red-500`} />,
          animation: {
            initial: { rotate: -10, opacity: 0 },
            animate: { rotate: 0, opacity: 1 },
            transition: { type: 'spring', stiffness: 300, damping: 20 }
          }
        };
      case 'waiting':
        return {
          container: 'bg-yellow-500/20',
          icon: <Timer className={`${icon} text-yellow-500`} />,
          animation: {
            initial: { opacity: 0.5 },
            animate: { opacity: 1 },
            transition: { 
              repeat: Infinity, 
              repeatType: 'reverse', 
              duration: 1 
            }
          }
        };
      case 'loading':
      default:
        return {
          container: 'bg-red-500/20',
          icon: <Mail className={`${icon} text-red-500`} />,
          animation: {
            initial: { opacity: 1 },
            animate: { opacity: 1 },
            transition: { duration: 0 }
          }
        };
    }
  };
  
  const { container, icon: IconComponent, animation } = getTypeStyles();
  
  return (
    <motion.div
      className={`${container} ${outer} rounded-full flex items-center justify-center`}
      initial={animation.initial}
      animate={animation.animate}
      transition={animation.transition}
    >
      {type === 'loading' ? (
        <div className={`${icon.replace('h-', '').replace('w-', '')} border-2 border-red-500 border-t-transparent rounded-full animate-spin`} />
      ) : IconComponent}
    </motion.div>
  );
};

export default VerificationLoader; 