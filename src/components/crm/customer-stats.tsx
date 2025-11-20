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
      <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
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
    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Clientes registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Activos</CardTitle>
          <UserPlus className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.activeLeads}</div>
          <p className="text-xs text-muted-foreground">
            En proceso de conversión
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.conversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Leads a clientes activos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
          <Target className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.averageLeadScore.toFixed(0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Calidad de leads
          </p>
        </CardContent>
      </Card>

      {/* Segunda fila - solo 2 cards importantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Con compras recientes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribución</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Leads</span>
              <span className="font-medium">{stats.activeLeads}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-600">Prospectos</span>
              <span className="font-medium">{stats.prospects}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Activos</span>
              <span className="font-medium">{stats.activeCustomers}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}