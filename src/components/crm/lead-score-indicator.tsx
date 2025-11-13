'use client';

import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getLeadScoreInfo, LEAD_SCORE_RANGES } from '@/types/customer';
import { cn } from '@/lib/utils';

interface LeadScoreIndicatorProps {
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showTrend?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function LeadScoreIndicator({
  score,
  previousScore,
  size = 'md',
  showProgress = false,
  showTrend = false,
  showLabel = false,
  className
}: LeadScoreIndicatorProps) {
  const scoreInfo = getLeadScoreInfo(score);
  const trend = previousScore !== undefined ? score - previousScore : 0;
  
  const sizeClasses = {
    sm: {
      star: 'h-3 w-3',
      text: 'text-xs',
      badge: 'text-xs px-1 py-0',
      progress: 'h-1'
    },
    md: {
      star: 'h-4 w-4',
      text: 'text-sm',
      badge: 'text-sm',
      progress: 'h-2'
    },
    lg: {
      star: 'h-5 w-5',
      text: 'text-base',
      badge: 'text-base',
      progress: 'h-3'
    }
  };
  
  const classes = sizeClasses[size];
  
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400';

  return (
    <TooltipProvider>
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Score with star */}
        <div className="flex items-center space-x-1">
          <Star className={cn(classes.star, 'text-yellow-400')} />
          <span className={cn('font-bold', scoreInfo.color, classes.text)}>
            {score}
          </span>
        </div>

        {/* Label */}
        {showLabel && (
          <Badge variant="outline" className={classes.badge}>
            {scoreInfo.label}
          </Badge>
        )}

        {/* Trend indicator */}
        {showTrend && previousScore !== undefined && (
          <Tooltip>
            <TooltipTrigger>
              <div className={cn('flex items-center space-x-1', trendColor)}>
                <TrendIcon className={classes.star} />
                <span className={classes.text}>
                  {Math.abs(trend)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {trend > 0 ? 'Incremento' : trend < 0 ? 'Disminución' : 'Sin cambios'} 
                {previousScore !== undefined && ` desde ${previousScore}`}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="flex-1 min-w-[60px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={score} 
                  max={100}
                  className={cn('w-full', classes.progress)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{score}/100 - {scoreInfo.label}</p>
                  <div className="text-xs space-y-1">
                    {Object.entries(LEAD_SCORE_RANGES).map(([key, range]) => (
                      <div key={key} className="flex justify-between">
                        <span>{range.label}:</span>
                        <span>{range.min}-{range.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact version for tables and lists
export function LeadScoreCompact({ 
  score, 
  className 
}: { 
  score: number; 
  className?: string; 
}) {
  return (
    <LeadScoreIndicator
      score={score}
      size="sm"
      className={className}
    />
  );
}

// Detailed version for customer details
export function LeadScoreDetailed({ 
  score, 
  previousScore, 
  className 
}: { 
  score: number; 
  previousScore?: number; 
  className?: string; 
}) {
  return (
    <LeadScoreIndicator
      score={score}
      previousScore={previousScore}
      size="lg"
      showProgress
      showTrend
      showLabel
      className={className}
    />
  );
}

// Score range visualization
export function LeadScoreRanges({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium">Rangos de Lead Score</h4>
      <div className="space-y-1">
        {Object.entries(LEAD_SCORE_RANGES).map(([key, range]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={cn('w-3 h-3 rounded-full', {
                'bg-green-500': key === 'excellent',
                'bg-yellow-500': key === 'good',
                'bg-orange-500': key === 'fair',
                'bg-red-500': key === 'poor',
              })} />
              <span>{range.label}</span>
            </div>
            <span className="text-muted-foreground">
              {range.min}-{range.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}