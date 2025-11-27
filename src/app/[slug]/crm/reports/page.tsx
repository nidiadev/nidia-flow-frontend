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
  ResponsiveContainer,
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
  Calendar,
} from 'lucide-react';
import { QueryLoading, ChartSkeleton } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { crmReportsApi } from '@/lib/api/crm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Chart configurations with NIDIA brand colors
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
  '#00D9A3', // Nidia Green
  '#9333EA', // Nidia Purple
  '#0EA5E9', // Nidia Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export default function CrmReportsPage() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');

  // Get current date for default range (last 30 days)
  const defaultDateFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }, []);

  const defaultDateTo = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const dateFromParam = dateFrom || defaultDateFrom;
  const dateToParam = dateTo || defaultDateTo;

  // Fetch all reports data
  const { data: pipelineKPIs, isLoading: kpisLoading } = useQuery({
    queryKey: ['pipeline-kpis'],
    queryFn: () => crmReportsApi.getPipelineKPIs(),
  });

  const { data: winRate, isLoading: winRateLoading } = useQuery({
    queryKey: ['win-rate', selectedSeller],
    queryFn: () => crmReportsApi.getWinRate(selectedSeller !== 'all' ? selectedSeller : undefined),
  });

  const { data: avgTimeToClose, isLoading: avgTimeLoading } = useQuery({
    queryKey: ['avg-time-to-close', selectedSeller],
    queryFn: () => crmReportsApi.getAverageTimeToClose(selectedSeller !== 'all' ? selectedSeller : undefined),
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => crmReportsApi.getForecast(),
  });

  const { data: conversionFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['conversion-funnel', dateFromParam, dateToParam],
    queryFn: () => crmReportsApi.getConversionFunnel(dateFromParam, dateToParam),
  });

  const { data: pipelineVelocity, isLoading: velocityLoading } = useQuery({
    queryKey: ['pipeline-velocity'],
    queryFn: () => crmReportsApi.getPipelineVelocity(),
  });

  const { data: sellerPerformance, isLoading: sellerLoading } = useQuery({
    queryKey: ['seller-performance', dateFromParam, dateToParam],
    queryFn: () => crmReportsApi.getSellerPerformance(dateFromParam, dateToParam),
  });

  const { data: lossAnalysis, isLoading: lossLoading } = useQuery({
    queryKey: ['loss-analysis', dateFromParam, dateToParam],
    queryFn: () => crmReportsApi.getLossAnalysis(dateFromParam, dateToParam),
  });

  const { data: leadSources, isLoading: leadSourcesLoading } = useQuery({
    queryKey: ['lead-sources', dateFromParam, dateToParam],
    queryFn: () => crmReportsApi.getLeadSources(dateFromParam, dateToParam),
  });

  const isLoading = kpisLoading || winRateLoading || forecastLoading || funnelLoading || 
                    velocityLoading || sellerLoading || lossLoading || leadSourcesLoading || avgTimeLoading;

  // Prepare chart data
  const funnelChartData = useMemo(() => {
    if (!conversionFunnel?.data?.funnel) return [];
    return conversionFunnel.data.funnel.map((stage: any) => ({
      name: stage.stageName,
      deals: stage.count,
      amount: stage.totalAmount,
      conversionRate: stage.conversionRate || 0,
    }));
  }, [conversionFunnel]);

  const velocityChartData = useMemo(() => {
    if (!pipelineVelocity?.data?.stages) return [];
    return pipelineVelocity.data.stages.map((stage: any) => ({
      name: stage.stageName,
      days: stage.averageDays || 0,
    }));
  }, [pipelineVelocity]);

  const sellerChartData = useMemo(() => {
    if (!sellerPerformance?.data?.sellers) return [];
    return sellerPerformance.data.sellers.map((seller: any) => ({
      name: seller.sellerName || 'Sin nombre',
      revenue: seller.totalRevenue || 0,
      deals: seller.dealsCount || 0,
    }));
  }, [sellerPerformance]);

  const leadSourcesChartData = useMemo(() => {
    if (!leadSources?.data?.sources) return [];
    return leadSources.data.sources.map((source: any) => ({
      name: source.source || 'Sin origen',
      value: source.count || 0,
    }));
  }, [leadSources]);

  const lossChartData = useMemo(() => {
    if (!lossAnalysis?.data?.reasons) return [];
    return lossAnalysis.data.reasons.map((reason: any) => ({
      name: reason.reason || 'Sin razón',
      count: reason.count || 0,
      amount: reason.totalAmount || 0,
    }));
  }, [lossAnalysis]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting reports...');
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Reportes CRM"
          description="Análisis completo del pipeline de ventas y métricas de rendimiento"
          actions={
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
            <CardDescription>Selecciona el rango de fechas y vendedor para los reportes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha Desde
                </label>
                <Input
                  type="date"
                  value={dateFrom || defaultDateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha Hasta
                </label>
                <Input
                  type="date"
                  value={dateTo || defaultDateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Vendedor
                </label>
                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    {/* TODO: Add seller options from API */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="h-16 flex items-center justify-center">
                  <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${pipelineKPIs?.data?.totalAmount?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor ponderado: ${pipelineKPIs?.data?.weightedAmount?.toLocaleString() || '0'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {winRateLoading ? (
                <div className="h-16 flex items-center justify-center">
                  <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {winRate?.data?.global?.winRate?.toFixed(1) || '0'}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {winRate?.data?.global?.wonDeals || 0} ganados / {winRate?.data?.global?.totalDeals || 0} total
                  </p>
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
                <div className="h-16 flex items-center justify-center">
                  <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {avgTimeToClose?.data?.averageDays?.toFixed(0) || '0'} días
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tiempo promedio para cerrar deals
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Mensual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-16 flex items-center justify-center">
                  <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${forecast?.data?.weightedAmount?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {forecast?.data?.dealsCount || 0} deals
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Embudo de Conversión</CardTitle>
                <CardDescription>
                  Distribución de deals por etapa del pipeline
                </CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <QueryLoading
              isLoading={funnelLoading}
              isError={false}
              error={null}
              isEmpty={funnelChartData.length === 0}
            >
              {funnelChartData.length > 0 ? (
                <ChartContainer config={velocityChartConfig} className="h-[400px]">
                  <BarChart data={funnelChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="deals" 
                      fill={velocityChartConfig.days.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay datos disponibles para el embudo de conversión</p>
                  </div>
                </div>
              )}
            </QueryLoading>
          </CardContent>
        </Card>

        {/* Pipeline Velocity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Velocidad del Pipeline</CardTitle>
                <CardDescription>
                  Tiempo promedio que los deals permanecen en cada etapa
                </CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <QueryLoading
              isLoading={velocityLoading}
              isError={false}
              error={null}
              isEmpty={velocityChartData.length === 0}
            >
              {velocityChartData.length > 0 ? (
                <ChartContainer config={velocityChartConfig} className="h-[400px]">
                  <BarChart data={velocityChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      label={{ value: 'Días', angle: -90, position: 'insideLeft' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="days" 
                      fill={velocityChartConfig.days.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay datos disponibles para la velocidad del pipeline</p>
                  </div>
                </div>
              )}
            </QueryLoading>
          </CardContent>
        </Card>

        {/* Seller Performance Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rendimiento por Vendedor</CardTitle>
                <CardDescription>
                  Comparativa de ingresos y deals por vendedor
                </CardDescription>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <QueryLoading
              isLoading={sellerLoading}
              isError={false}
              error={null}
              isEmpty={sellerChartData.length === 0}
            >
              {sellerChartData.length > 0 ? (
                <ChartContainer config={sellerPerformanceConfig} className="h-[400px]">
                  <BarChart data={sellerChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis 
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar 
                      yAxisId="left"
                      dataKey="revenue" 
                      fill={sellerPerformanceConfig.revenue.color}
                      radius={[4, 4, 0, 0]}
                      name="Ingresos"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="deals" 
                      fill={sellerPerformanceConfig.deals.color}
                      radius={[4, 4, 0, 0]}
                      name="Deals"
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay datos disponibles para el rendimiento de vendedores</p>
                  </div>
                </div>
              )}
            </QueryLoading>
          </CardContent>
        </Card>

        {/* Lead Sources and Loss Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lead Sources Pie Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Orígenes de Leads</CardTitle>
                  <CardDescription>
                    Distribución de leads por fuente
                  </CardDescription>
                </div>
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <QueryLoading
                isLoading={leadSourcesLoading}
                isError={false}
                error={null}
                isEmpty={leadSourcesChartData.length === 0}
              >
                {leadSourcesChartData.length > 0 ? (
                  <ChartContainer config={leadSourcesConfig} className="h-[350px]">
                    <PieChart>
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
                        {leadSourcesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay datos disponibles para orígenes de leads</p>
                    </div>
                  </div>
                )}
              </QueryLoading>
            </CardContent>
          </Card>

          {/* Loss Analysis Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Análisis de Pérdidas</CardTitle>
                  <CardDescription>
                    Razones principales de deals perdidos
                  </CardDescription>
                </div>
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <QueryLoading
                isLoading={lossLoading}
                isError={false}
                error={null}
                isEmpty={lossChartData.length === 0}
              >
                {lossChartData.length > 0 ? (
                  <ChartContainer config={lossAnalysisConfig} className="h-[350px]">
                    <BarChart data={lossChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs"
                      />
                      <YAxis 
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs"
                        width={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="count" 
                        fill={lossAnalysisConfig.count.color}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay datos disponibles para el análisis de pérdidas</p>
                    </div>
                  </div>
                )}
              </QueryLoading>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
