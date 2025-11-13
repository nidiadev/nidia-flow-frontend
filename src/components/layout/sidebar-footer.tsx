'use client';

import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarFooterProps {
  isCollapsed: boolean;
  variant?: 'admin' | 'client';
  onToggleCollapse?: () => void;
}

export function SidebarFooter({ isCollapsed, variant = 'client', onToggleCollapse }: SidebarFooterProps) {

  if (isCollapsed) {
    return (
      <div className="border-t border-border p-3 space-y-2">
        {/* Botón para expandir */}
        {onToggleCollapse && (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-border p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {/* Branding Section */}
        <div className="flex items-center gap-2.5 rounded-lg bg-gradient-to-br from-nidia-green/10 to-nidia-purple/10 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-nidia-green to-nidia-purple">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">NIDIA Flow</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {variant === 'admin' ? 'Admin Panel' : 'Business Suite'}
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Versión</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
          {variant === 'client' && (
            <a
              href="https://nidiaflow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Visitar sitio web</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Copyright */}
        <p className="text-[10px] text-muted-foreground text-center">
          © {new Date().getFullYear()} NIDIA. Todos los derechos reservados.
        </p>

        {/* Botón para colapsar */}
        {onToggleCollapse && (
          <div className="flex items-center justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

