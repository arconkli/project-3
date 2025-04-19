import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  seconds, 
  onComplete 
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [isCompleted, setIsCompleted] = useState(false);
  
  useEffect(() => {
    // Update timer when seconds prop changes
    setRemainingSeconds(seconds);
    setIsCompleted(false);
  }, [seconds]);
  
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setIsCompleted(true);
      if (onComplete) onComplete();
      return;
    }
    
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [remainingSeconds, onComplete]);
  
  // Calculate progress percentage
  const progress = isCompleted ? 100 : Math.round(((seconds - remainingSeconds) / seconds) * 100);
  
  return (
    <div className="bg-black/30 border border-yellow-900/50 rounded-md p-4 flex items-center gap-3">
      <div className="relative h-10 w-10 flex-shrink-0">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full border-2 border-yellow-900/30"></div>
        
        {/* Progress circle */}
        <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40">
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="2"
            stroke="rgba(234, 179, 8, 0.5)"
            strokeDasharray="113.1"  // 2 * PI * 18 (circumference)
            strokeDashoffset={113.1 - (113.1 * progress) / 100}
            strokeLinecap="round"
            initial={{ strokeDashoffset: 113.1 }}
            animate={{ strokeDashoffset: 113.1 - (113.1 * progress) / 100 }}
            transition={{ duration: 1 }}
          />
        </svg>
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer className="h-5 w-5 text-yellow-500" />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-yellow-500">Rate Limited</span>
          <span className="text-sm font-mono text-yellow-500">
            {remainingSeconds > 0 ? `${remainingSeconds}s` : 'Ready'}
          </span>
        </div>
        
        <div className="h-2 bg-yellow-900/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-yellow-500/50 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer; 