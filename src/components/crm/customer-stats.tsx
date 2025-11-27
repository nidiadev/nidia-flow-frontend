'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  MessageSquare, 
  Target,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { useCustomerStatistics } from '@/hooks/use-api';
import { CardSkeleton } from '@/components/ui/loading';

interface CustomerStatsProps {
  className?: string;
}

export function CustomerStats({ className }: CustomerStatsProps) {
  const { data: statistics, isLoading, isError, refetch } = useCustomerStatistics();

  const stats = {
    totalCustomers: statistics?.totalCustomers || 0,
    activeLeads: statistics?.byType?.lead || 0,
    prospects: statistics?.byType?.prospect || 0,
    activeCustomers: statistics?.byType?.active || 0,
    inactiveCustomers: statistics?.byType?.inactive || 0,
    churnedCustomers: statistics?.byType?.churned || 0,
    conversionRate: statistics?.conversionRate || 0,
    averageLeadScore: Math.round(statistics?.averageLeadScore || 0),
    interactionsThisWeek: 0, // TODO: Add interactions endpoint
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Error al cargar estadísticas</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Card 1: Clientes - Combinada (Total + Activos + Inactivos) */}
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-5 pt-5">
          <CardTitle className="text-base font-semibold text-foreground">Clientes</CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-muted/60 to-muted/40">
            <Users className="h-4.5 w-4.5 text-foreground/70" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline gap-3 mb-2">
            <div className="text-4xl font-bold text-foreground tracking-tight">{stats.totalCustomers.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-950/20">
              <div className="w-2 h-2 rounded-full bg-green-600 shadow-sm"></div>
              <span className="text-lg font-semibold text-green-600">{stats.activeCustomers}</span>
            </div>
            {stats.inactiveCustomers > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                <span className="text-base font-semibold text-muted-foreground">{stats.inactiveCustomers}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Total registrados en el sistema</p>
        </CardContent>
      </Card>

      {/* Card 2: Leads y Prospectos - Combinada */}
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-5 pt-5">
          <CardTitle className="text-base font-semibold text-foreground">Leads y Prospectos</CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
            <UserPlus className="h-4.5 w-4.5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></div>
                <span className="text-4xl font-bold text-blue-600 tracking-tight">{stats.activeLeads}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Leads activos</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-600 shadow-sm"></div>
                <span className="text-4xl font-bold text-yellow-600 tracking-tight">{stats.prospects}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Prospectos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Tasa Conversión */}
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-5 pt-5">
          <CardTitle className="text-base font-semibold text-foreground">Tasa Conversión</CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20">
            <TrendingUp className="h-4.5 w-4.5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-green-600 tracking-tight">
              {stats.conversionRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Leads convertidos a clientes activos</p>
        </CardContent>
      </Card>

      {/* Card 4: Score Promedio */}
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-5 pt-5">
          <CardTitle className="text-base font-semibold text-foreground">Score Promedio</CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/40 dark:to-yellow-900/20">
            <Target className="h-4.5 w-4.5 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-yellow-600 tracking-tight">
              {stats.averageLeadScore.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground font-medium">/100</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Calidad promedio de leads</p>
        </CardContent>
      </Card>
    </div>
  );
}