'use client';

import { cn } from '@/lib/utils';

/**
 * Professional skeleton components for consistent loading states
 */

// Base skeleton pulse animation
const skeletonBase = 'animate-pulse bg-muted rounded';

/**
 * Card Skeleton - For card-based content
 */
export function CardSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(skeletonBase, 'h-5 w-3/4')} />
          <div className={cn(skeletonBase, 'h-4 w-1/2')} />
        </div>
        
        {/* Content lines */}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                skeletonBase,
                'h-4',
                i === lines - 1 ? 'w-5/6' : 'w-full'
              )}
            />
          ))}
        </div>
        
        {/* Footer (optional) */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className={cn(skeletonBase, 'h-4 w-20')} />
          <div className={cn(skeletonBase, 'h-9 w-24')} />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Skeleton - Professional table loading state
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className 
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      {showHeader && (
        <div className="border-b pb-4 mb-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div
                key={i}
                className={cn(skeletonBase, 'h-4 flex-1', i === 0 ? 'w-32' : '')}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center space-x-4 py-3"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  skeletonBase,
                  'h-4',
                  colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-20' : 'flex-1'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton - For individual table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonBase,
            'h-4',
            i === 0 ? 'w-32' : i === columns - 1 ? 'w-20' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Stats Card Skeleton - For metric cards
 */
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className={cn(skeletonBase, 'h-4 w-24')} />
          <div className={cn(skeletonBase, 'h-8 w-32')} />
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(skeletonBase, 'h-3 w-3 rounded-full')} />
            <div className={cn(skeletonBase, 'h-3 w-20')} />
          </div>
        </div>
        <div className={cn(skeletonBase, 'h-12 w-12 rounded-full')} />
      </div>
    </div>
  );
}

/**
 * Form Skeleton - For form loading states
 */
export function FormSkeleton({ fields = 5, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={cn(skeletonBase, 'h-4 w-24')} />
          <div className={cn(skeletonBase, 'h-10 w-full rounded-md')} />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <div className={cn(skeletonBase, 'h-10 w-24 rounded-md')} />
        <div className={cn(skeletonBase, 'h-10 w-24 rounded-md')} />
      </div>
    </div>
  );
}

/**
 * List Skeleton - For list items
 */
export function ListSkeleton({ items = 5, showAvatar = false, className }: { 
  items?: number; 
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          {showAvatar && (
            <div className={cn(skeletonBase, 'h-10 w-10 rounded-full flex-shrink-0')} />
          )}
          <div className="flex-1 space-y-2">
            <div className={cn(skeletonBase, 'h-4 w-3/4')} />
            <div className={cn(skeletonBase, 'h-3 w-1/2')} />
          </div>
          <div className={cn(skeletonBase, 'h-8 w-20 rounded-md')} />
        </div>
      ))}
    </div>
  );
}

/**
 * Page Skeleton - Full page loading state
 */
export function PageSkeleton({ 
  showHeader = true,
  showActions = true,
  showTable = true,
  className 
}: { 
  showHeader?: boolean;
  showActions?: boolean;
  showTable?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className={cn(skeletonBase, 'h-8 w-64')} />
            <div className={cn(skeletonBase, 'h-4 w-96')} />
          </div>
          {showActions && (
            <div className={cn(skeletonBase, 'h-10 w-32 rounded-md')} />
          )}
        </div>
      )}
      
      {showTable && (
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className={cn(skeletonBase, 'h-6 w-32')} />
              <div className={cn(skeletonBase, 'h-4 w-48')} />
            </div>
            <TableSkeleton rows={5} columns={4} showHeader={false} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Chart Skeleton - For chart/graph loading states
 */
export function ChartSkeleton({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-4">
        <div className={cn(skeletonBase, 'h-6 w-48')} />
        <div 
          className={cn(skeletonBase, 'w-full rounded')}
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton - For grid layouts
 */
export function GridSkeleton({ 
  columns = 3, 
  rows = 2,
  itemComponent = CardSkeleton,
  className 
}: { 
  columns?: number;
  rows?: number;
  itemComponent?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const ItemComponent = itemComponent;
  return (
    <div className={cn(`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`, className)}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <ItemComponent key={i} />
      ))}
    </div>
  );
}

