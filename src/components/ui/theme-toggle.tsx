'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evitar hidratación incorrecta
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        aria-label="Toggle theme"
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }

  // Determinar si está en modo oscuro (considerando system)
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    // Si el tema es system, alternamos basado en el resolvedTheme
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      // Si ya está en light o dark, alternamos
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-nidia-green" />
        ) : (
          <Moon className="h-5 w-5 text-nidia-purple" />
        )}
      </motion.div>
    </Button>
  );
}

