'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Download,
} from 'lucide-react';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { crmReportsApi } from '@/lib/api/crm';

export default function CrmReportsPage() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: pipelineKPIs, isLoading: kpisLoading } = useQuery({
    queryKey: ['pipeline-kpis'],
    queryFn: () => crmReportsApi.getPipelineKPIs(),
  });

  const { data: winRate, isLoading: winRateLoading } = useQuery({
    queryKey: ['win-rate'],
    queryFn: () => crmReportsApi.getWinRate(),
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => crmReportsApi.getForecast(),
  });

  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['conversion-funnel', dateFrom, dateTo],
    queryFn: () => crmReportsApi.getConversionFunnel(dateFrom || undefined, dateTo || undefined),
  });

  const isLoading = kpisLoading || winRateLoading || forecastLoading || funnelLoading;

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Reportes CRM"
          description="Análisis y métricas del pipeline de ventas"
          variant="gradient"
          actions={
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          }
        />

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${pipelineKPIs?.data?.totalAmount?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor ponderado: ${pipelineKPIs?.data?.weightedAmount?.toLocaleString() || '0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {winRate?.data?.global?.winRate?.toFixed(1) || '0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {winRate?.data?.global?.wonDeals || 0} ganados / {winRate?.data?.global?.totalDeals || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Mensual</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${forecast?.data?.weightedAmount?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {forecast?.data?.dealsCount || 0} deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals Abiertos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pipelineKPIs?.data?.totalDeals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En el pipeline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Embudo de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryLoading
              isLoading={funnelLoading}
              isError={false}
              error={null}
              isEmpty={!conversionFunnel?.data?.funnel || conversionFunnel.data.funnel.length === 0}
            >
              <div className="space-y-2">
                {conversionFunnel?.data?.funnel?.map((stage: any, index: number) => (
                  <div key={stage.stageId} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">{stage.stageName}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary h-6 rounded"
                          style={{ width: `${(stage.count / (conversionFunnel.data.totalDeals || 1)) * 100}%` }}
                        />
                        <span className="text-sm">{stage.count} deals</span>
                        <span className="text-xs text-muted-foreground">
                          ${stage.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {stage.conversionRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </QueryLoading>
          </CardContent>
        </Card>

        {/* Additional Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Velocidad del Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tiempo promedio en cada etapa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Métricas individuales de cada vendedor
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}

