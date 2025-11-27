'use client';

import { LayoutGrid, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/use-view-mode';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-0.5 h-9 bg-background border border-border rounded-md p-0.5', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('table')}
        className={cn(
          'h-full px-3 transition-all rounded-sm',
          viewMode === 'table' 
            ? 'bg-accent text-accent-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <Table2 className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Tabla</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className={cn(
          'h-full px-3 transition-all rounded-sm',
          viewMode === 'cards' 
            ? 'bg-accent text-accent-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Cards</span>
      </Button>
    </div>
  );
}

