'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Target,
  AlertCircle,
  Download,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { QueryLoading, ChartSkeleton } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { crmReportsApi } from '@/lib/api/crm';

// Chart configurations with NIDIA brand colors
const conversionFunnelConfig = {
  deals: {
    label: 'Deals',
    color: '#00D9A3', // Nidia Green
  },
  amount: {
    label: 'Valor',
    color: '#9333EA', // Nidia Purple
  },
} as const;

const velocityChartConfig = {
  days: {
    label: 'Días Promedio',
    color: '#0EA5E9', // Nidia Blue
  },
} as const;

const sellerPerformanceConfig = {
  revenue: {
    label: 'Ingresos',
    color: '#00D9A3', // Nidia Green
  },
  deals: {
    label: 'Deals',
    color: '#9333EA', // Nidia Purple
  },
} as const;

const leadSourcesConfig = {
  leads: {
    label: 'Leads',
  },
} as const;

const lossAnalysisConfig = {
  count: {
    label: 'Deals Perdidos',
    color: '#EF4444', // Red
  },
} as const;

// NIDIA brand colors for pie charts
const CHART_COLORS = [
  '#00D9A3', // Green
  '#9333EA', // Purple
  '#0EA5E9', // Blue
  '#F59E0B', // Orange
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export default function CrmAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');

  // Pipeline KPIs
  const { data: pipelineKPIs, isLoading: kpisLoading } = useQuery({
    queryKey: ['crm-analytics', 'pipeline-kpis'],
    queryFn: () => crmReportsApi.getPipelineKPIs(),
  });

  // Win Rate
  const { data: winRate, isLoading: winRateLoading } = useQuery({
    queryKey: ['crm-analytics', 'win-rate', selectedSeller],
    queryFn: () => crmReportsApi.getWinRate(selectedSeller !== 'all' ? selectedSeller : undefined),
  });

  // Average Time to Close
  const { data: avgTimeToClose, isLoading: avgTimeLoading } = useQuery({
    queryKey: ['crm-analytics', 'avg-time', selectedSeller],
    queryFn: () => crmReportsApi.getAverageTimeToClose(selectedSeller !== 'all' ? selectedSeller : undefined),
  });

  // Forecast
  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['crm-analytics', 'forecast'],
    queryFn: () => crmReportsApi.getForecast(),
  });

  // Conversion Funnel
  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['crm-analytics', 'conversion-funnel', dateFrom, dateTo],
    queryFn: () => crmReportsApi.getConversionFunnel(dateFrom || undefined, dateTo || undefined),
  });

  // Pipeline Velocity
  const { data: pipelineVelocity, isLoading: velocityLoading } = useQuery({
    queryKey: ['crm-analytics', 'pipeline-velocity'],
    queryFn: () => crmReportsApi.getPipelineVelocity(),
  });

  // Seller Performance
  const { data: sellerPerformance, isLoading: sellerPerformanceLoading } = useQuery({
    queryKey: ['crm-analytics', 'seller-performance', dateFrom, dateTo],
    queryFn: () => crmReportsApi.getSellerPerformance(dateFrom || undefined, dateTo || undefined),
  });

  // Loss Analysis
  const { data: lossAnalysis, isLoading: lossAnalysisLoading } = useQuery({
    queryKey: ['crm-analytics', 'loss-analysis', dateFrom, dateTo],
    queryFn: () => crmReportsApi.getLossAnalysis(dateFrom || undefined, dateTo || undefined),
  });

  // Lead Sources
  const { data: leadSources, isLoading: leadSourcesLoading } = useQuery({
    queryKey: ['crm-analytics', 'lead-sources', dateFrom, dateTo],
    queryFn: () => crmReportsApi.getLeadSources(dateFrom || undefined, dateTo || undefined),
  });

  const kpis = pipelineKPIs?.data || {};
  const winRateData = winRate?.data || {};
  const avgTimeData = avgTimeToClose?.data || {};
  const forecastData = forecast?.data || {};
  const funnelData = conversionFunnel?.data || {};
  const velocityData = pipelineVelocity?.data || {};
  const sellerData = sellerPerformance?.data || {};
  const lossData = lossAnalysis?.data || {};
  const sourcesData = leadSources?.data || {};

  // Transform data for charts
  const conversionFunnelChartData = useMemo(() => {
    if (!funnelData.funnel || funnelData.funnel.length === 0) return [];
    return funnelData.funnel.map((stage: any, index: number) => {
      const prevStage = index > 0 ? funnelData.funnel[index - 1] : null;
      const conversionRate = prevStage && prevStage.count > 0
        ? ((stage.count / prevStage.count) * 100).toFixed(1)
        : '100';
      
      return {
        stage: stage.stageName || 'Etapa',
        deals: stage.count || 0,
        amount: stage.totalAmount || 0,
        conversionRate: parseFloat(conversionRate),
      };
    });
  }, [funnelData]);

  const velocityChartData = useMemo(() => {
    if (!velocityData.stages || velocityData.stages.length === 0) return [];
    return velocityData.stages.map((stage: any) => ({
      stage: stage.stageName || 'Etapa',
      days: Math.round(stage.averageDays || 0),
      deals: stage.dealsCount || 0,
    }));
  }, [velocityData]);

  const sellerChartData = useMemo(() => {
    if (!sellerData.sellers || sellerData.sellers.length === 0) return [];
    return sellerData.sellers.map((seller: any) => ({
      name: (seller.userName || seller.userEmail || 'Vendedor').split(' ')[0],
      revenue: seller.totalAmount || 0,
      deals: seller.dealsCount || 0,
      winRate: seller.winRate || 0,
    }));
  }, [sellerData]);

  const leadSourcesChartData = useMemo(() => {
    if (!sourcesData.sources || sourcesData.sources.length === 0) return [];
    return sourcesData.sources.map((source: any, index: number) => ({
      name: source.source || 'Sin fuente',
      value: source.leadsCount || 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [sourcesData]);

  const lossAnalysisChartData = useMemo(() => {
    if (!lossData.reasons || lossData.reasons.length === 0) return [];
    return lossData.reasons.map((reason: any) => ({
      reason: reason.reason || 'Sin razón',
      count: reason.count || 0,
      amount: reason.totalAmount || 0,
    }));
  }, [lossData]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Analíticas del CRM"
          description="Métricas y análisis detallados del rendimiento del CRM"
          actions={
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          }
        />

        {/* Date Filters - Compact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="sm:w-[200px]">
                <label className="text-sm font-medium mb-2 block">Vendedor</label>
                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor del Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${(kpis.totalAmount || 0).toLocaleString('es-ES')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor ponderado: ${(kpis.weightedAmount || 0).toLocaleString('es-ES')}
                  </p>
                  {kpis.totalDeals && (
                    <p className="text-xs text-muted-foreground">
                      {kpis.totalDeals} deals activos
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cierre</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {winRateLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {winRateData.global?.winRate?.toFixed(1) || '0'}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {winRateData.global?.wonDeals || 0} ganados / {winRateData.global?.totalDeals || 0} total
                  </p>
                  {winRateData.global?.winRate && winRateData.global.winRate > 50 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">Excelente</span>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {avgTimeLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {avgTimeData.averageDays ? `${Math.round(avgTimeData.averageDays)} días` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tiempo promedio para cerrar un deal
                  </p>
                  {avgTimeData.averageDays && avgTimeData.averageDays < 30 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">Rápido</span>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Mensual</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${(forecastData.weightedAmount || 0).toLocaleString('es-ES')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {forecastData.dealsCount || 0} deals este mes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Embudo de Conversión
              </CardTitle>
              <CardDescription>
                Análisis del flujo de deals a través de las etapas del pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <ChartSkeleton height={350} />
              ) : conversionFunnelChartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">No hay datos disponibles</div>
                    <div className="text-xs text-muted-foreground">
                      Los datos aparecerán cuando haya deals en el pipeline
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer config={conversionFunnelConfig} className="h-[350px]">
                  <BarChart data={conversionFunnelChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            if (name === 'deals') {
                              return [value, 'Deals'];
                            }
                            if (name === 'amount') {
                              return [`$${Number(value).toLocaleString('es-ES')}`, 'Valor'];
                            }
                            return [value, name];
                          }}
                        />
                      }
                    />
                    <Bar dataKey="deals" fill="#00D9A3" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Velocidad del Pipeline
              </CardTitle>
              <CardDescription>
                Tiempo promedio que los deals permanecen en cada etapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {velocityLoading ? (
                <ChartSkeleton height={350} />
              ) : velocityChartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">No hay datos disponibles</div>
                    <div className="text-xs text-muted-foreground">
                      Los datos aparecerán cuando haya deals con historial de etapas
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer config={velocityChartConfig} className="h-[350px]">
                  <BarChart data={velocityChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="stage"
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value} días`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`${value} días`, 'Tiempo Promedio']}
                        />
                      }
                    />
                    <Bar dataKey="days" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Seller Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rendimiento por Vendedor
              </CardTitle>
              <CardDescription>
                Comparativa de ingresos y deals por vendedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sellerPerformanceLoading ? (
                <ChartSkeleton height={350} />
              ) : sellerChartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">No hay datos disponibles</div>
                    <div className="text-xs text-muted-foreground">
                      Los datos aparecerán cuando haya deals asignados a vendedores
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer config={sellerPerformanceConfig} className="h-[350px]">
                  <BarChart data={sellerChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            if (name === 'revenue') {
                              return [`$${Number(value).toLocaleString('es-ES')}`, 'Ingresos'];
                            }
                            if (name === 'deals') {
                              return [value, 'Deals'];
                            }
                            return [value, name];
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#00D9A3" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="deals" fill="#9333EA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead Sources Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Fuentes de Leads
              </CardTitle>
              <CardDescription>
                Distribución de leads por origen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadSourcesLoading ? (
                <ChartSkeleton height={350} />
              ) : leadSourcesChartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">No hay datos disponibles</div>
                    <div className="text-xs text-muted-foreground">
                      Los datos aparecerán cuando haya leads con fuentes registradas
                    </div>
                  </div>
                </div>
              ) : (
                <ChartContainer config={leadSourcesConfig} className="h-[350px]">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [value, 'Leads']}
                        />
                      }
                    />
                    <Pie
                      data={leadSourcesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourcesChartData.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loss Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Análisis de Pérdidas
            </CardTitle>
            <CardDescription>
              Razones principales por las que se pierden deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lossAnalysisLoading ? (
              <ChartSkeleton height={300} />
            ) : lossAnalysisChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">No hay datos disponibles</div>
                  <div className="text-xs text-muted-foreground">
                    Los datos aparecerán cuando haya deals perdidos con razones registradas
                  </div>
                </div>
              </div>
            ) : (
              <ChartContainer config={lossAnalysisConfig} className="h-[300px]">
                <BarChart data={lossAnalysisChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="reason"
                    type="category"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          if (name === 'count') {
                            return [value, 'Deals Perdidos'];
                          }
                          return [value, name];
                        }}
                      />
                    }
                  />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
