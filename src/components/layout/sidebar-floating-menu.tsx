'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FloatingMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface FloatingMenuProps {
  items: FloatingMenuItem[];
  isVisible: boolean;
  position: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClose: () => void;
}

export function FloatingMenu({ 
  items, 
  isVisible, 
  position, 
  onMouseEnter,
  onMouseLeave,
  onClose 
}: FloatingMenuProps) {
  const pathname = usePathname();

  if (!isVisible || items.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Menú flotante - sin backdrop para evitar conflictos */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-50 min-w-[200px] rounded-lg border bg-popover shadow-lg backdrop-blur-sm"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className="p-1.5">
              {items.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      // Cerrar el menú al hacer click en un link
                      onClose();
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      'hover:bg-primary/15 hover:text-foreground',
                      isActive && 'bg-primary/15 text-foreground font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

