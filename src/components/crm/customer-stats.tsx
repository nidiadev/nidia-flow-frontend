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
import { useCustomers } from '@/hooks/use-api';
import { CardSkeleton } from '@/components/ui/loading';
import { Customer, CUSTOMER_TYPE_CONFIG } from '@/types/customer';
import { useMemo } from 'react';

interface CustomerStatsProps {
  className?: string;
}

export function CustomerStats({ className }: CustomerStatsProps) {
  const { data: customers, isLoading, isError, refetch } = useCustomers({ 
    limit: 1000 // Get all customers for stats
  });

  const stats = useMemo(() => {
    if (!customers || customers.length === 0) {
      return {
        totalCustomers: 0,
        activeLeads: 0,
        prospects: 0,
        activeCustomers: 0,
        conversionRate: 0,
        averageLeadScore: 0,
        interactionsThisWeek: 0,
      };
    }

    const totalCustomers = customers.length;
    const activeLeads = customers.filter((c: Customer) => c.type === 'lead').length;
    const prospects = customers.filter((c: Customer) => c.type === 'prospect').length;
    const activeCustomers = customers.filter((c: Customer) => c.type === 'active').length;
    
    const conversionRate = totalCustomers > 0 
      ? ((activeCustomers / totalCustomers) * 100) 
      : 0;
    
    const averageLeadScore = totalCustomers > 0
      ? customers.reduce((sum: number, c: Customer) => sum + (c.leadScore || 0), 0) / totalCustomers
      : 0;

    // Mock interactions for now - this would come from a separate API
    const interactionsThisWeek = Math.floor(Math.random() * 50) + 20;

    return {
      totalCustomers,
      activeLeads,
      prospects,
      activeCustomers,
      conversionRate,
      averageLeadScore,
      interactionsThisWeek,
    };
  }, [customers]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
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

      {/* Additional stats row */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prospectos</CardTitle>
          <UserCheck className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.prospects}</div>
          <p className="text-xs text-muted-foreground">
            Leads calificados
          </p>
        </CardContent>
      </Card>

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
          <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
          <MessageSquare className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.interactionsThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            Esta semana
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