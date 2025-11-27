'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLoadingProps {
  message?: string;
  fullScreen?: boolean;
  showLogo?: boolean;
  className?: string;
}

export function AppLoading({ 
  message = 'Cargando...', 
  fullScreen = true,
  showLogo = true,
  className 
}: AppLoadingProps) {
  const containerClasses = fullScreen 
    ? 'min-h-screen bg-background flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(containerClasses, className)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.16, 1, 0.3, 1] // Custom easing for smooth entrance
        }}
        className="flex flex-col items-center justify-center space-y-8"
      >
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.1, 
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative"
          >
            {/* Logo container with animated ring */}
            <div className="relative h-20 w-20">
              {/* Outer pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-nidia-green/30"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Middle rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-nidia-green/50"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Inner pulsing glow */}
              <motion.div
                className="absolute inset-2 rounded-xl bg-nidia-green/10"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Logo */}
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10 flex h-full w-full items-center justify-center"
              >
                <Image
                  src="/isotipo.svg"
                  alt="NIDIA Flow"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain drop-shadow-lg"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Message and loading indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Loading dots with improved animation */}
          <motion.div
            className="flex items-center space-x-2"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="h-2.5 w-2.5 rounded-full bg-nidia-green"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: [0.4, 0, 0.6, 1],
                }}
              />
            ))}
          </motion.div>
          
          {/* Message text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              delay: 0.5, 
              duration: 0.4,
              ease: 'easeOut'
            }}
            className="text-sm font-medium text-muted-foreground tracking-wide"
          >
            {message}
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

