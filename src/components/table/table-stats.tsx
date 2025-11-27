'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableStatsConfig } from './types';
import { cn } from '@/lib/utils';

interface TableStatsProps {
  stats: TableStatsConfig['stats'];
  className?: string;
  columns?: number;
}

/**
 * Componente de estadísticas para la tabla
 * Muestra cards con métricas arriba de la tabla
 * Soporta gráficas (donut, bar, etc.)
 */
export function TableStats({ stats, className, columns = 4 }: TableStatsProps) {
  if (!stats || stats.length === 0) return null;

  const gridColsClass = useMemo(() => {
    const cols = Math.min(columns, stats.length);
    const classes: Record<number, string> = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    };
    return classes[cols] || 'md:grid-cols-4';
  }, [columns, stats.length]);

  // Renderizar gráfica donut simple
  const renderDonutChart = (chart: TableStatsConfig['stats'][0]['chart']) => {
    if (!chart || chart.type !== 'donut') return null;

    const total = chart.total || chart.data.reduce((sum, item) => sum + item.value, 0);
    const circumference = 2 * Math.PI * 40; // radio 40
    let currentOffset = 0;

    return (
      <div className="relative w-24 h-24 mx-auto">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {chart.data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += (percentage / 100) * circumference;

            const colors = [
              'stroke-blue-500',
              'stroke-green-500',
              'stroke-orange-500',
              'stroke-red-500',
              'stroke-purple-500',
              'stroke-pink-500',
            ];

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={item.color || colors[index % colors.length]}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      'grid gap-4 grid-cols-1',
      gridColsClass,
      className
    )}>
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            {stat.icon && !stat.chart && (
              <div className="text-muted-foreground">{stat.icon}</div>
            )}
          </CardHeader>
          <CardContent>
            {stat.chart ? (
              <div className="space-y-4">
                {renderDonutChart(stat.chart)}
                <div className="space-y-2">
                  {stat.chart.data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            item.color || [
                              'bg-blue-500',
                              'bg-green-500',
                              'bg-orange-500',
                              'bg-red-500',
                            ][idx % 4]
                          )}
                        />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            )}
            {stat.trend && (
              <div className={cn(
                'text-xs mt-1',
                    stat.trend.isPositive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
              )}>
                {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
              </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
