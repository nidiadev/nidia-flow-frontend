'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface SidebarThemeToggleProps {
  isCollapsed: boolean;
}

export function SidebarThemeToggle({ isCollapsed }: SidebarThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (isCollapsed) {
    return (
      <div className="px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 w-full"
          aria-label="Toggle theme"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-sidebar-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-sidebar-foreground" />
            )}
          </motion.div>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0 text-sidebar-foreground" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-sidebar-foreground" />
          )}
        </motion.div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium">Tema</p>
          <p className="text-xs text-muted-foreground">
            {isDark ? 'Oscuro' : 'Claro'}
          </p>
        </div>
      </Button>
    </div>
  );
}

