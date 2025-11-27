'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  isEnabled?: boolean;
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
            <div className="p-2">
              {items.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                const itemIsEnabled = item.isEnabled !== false; // Default to true if not specified
                
                const itemContent = (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors mb-1',
                            itemIsEnabled
                              ? 'hover:bg-primary/15 hover:text-foreground cursor-pointer'
                              : 'opacity-60 cursor-not-allowed',
                            isActive && itemIsEnabled && 'bg-primary/15 text-foreground font-medium'
                          )}
                          onClick={() => {
                            if (itemIsEnabled) {
                              onClose();
                            }
                          }}
                        >
                          <div className="relative">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {!itemIsEnabled && (
                              <Lock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-orange-500" />
                            )}
                          </div>
                          <span>{item.title}</span>
                        </div>
                      </TooltipTrigger>
                      {!itemIsEnabled && (
                        <TooltipContent>
                          <p className="font-medium">Submódulo no disponible</p>
                          <p className="text-xs mt-1">Actualiza tu plan para acceder a "{item.title}"</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
                
                return itemIsEnabled ? (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    {itemContent}
                  </Link>
                ) : (
                  <div key={item.href}>
                    {itemContent}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

