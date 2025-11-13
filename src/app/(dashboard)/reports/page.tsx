'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Download,
  Eye,
  Calendar,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const reportSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  reportType: z.enum([
    'sales',
    'customers',
    'inventory',
    'financial',
    'tasks',
    'custom',
  ]),
  dateFrom: z.string().min(1, 'La fecha inicial es requerida'),
  dateTo: z.string().min(1, 'La fecha final es requerida'),
  format: z.enum(['pdf', 'excel', 'csv']),
  schedule: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  schedule?: string;
  lastExecuted?: string;
  createdAt: string;
}

interface ReportExecution {
  id: string;
  reportName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  fileUrl?: string;
  executedAt: string;
  completedAt?: string;
}

const reportTypeLabels = {
  sales: 'Ventas',
  customers: 'Clientes',
  inventory: 'Inventario',
  financial: 'Financiero',
  tasks: 'Tareas',
  custom: 'Personalizado',
};

const scheduleLabels = {
  none: 'Sin programar',
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-nidia-blue/20 text-nidia-blue',
  completed: 'bg-nidia-green/20 text-nidia-green',
  failed: 'bg-destructive/20 text-destructive',
};

const statusLabels = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

export default function ReportsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      format: 'pdf',
      schedule: 'none',
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch saved reports
  const { data: savedReportsData } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: async () => {
      const response = await api.get('/reports/saved');
      return response.data;
    },
  });

  // Fetch report history
  const { data: historyData } = useQuery({
    queryKey: ['report-history'],
    queryFn: async () => {
      const response = await api.get('/reports/history?limit=20');
      return response.data;
    },
  });

  const savedReports: SavedReport[] = savedReportsData?.data || [];
  const history: ReportExecution[] = historyData?.data || [];

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await api.post('/reports', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      toast.success('Reporte creado exitosamente');
      setIsCreateDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear reporte');
    },
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await api.post(`/reports/${reportId}/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      toast.success('Reporte generado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar reporte');
    },
  });

  // Preview report mutation
  const previewReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await api.post('/reports/preview', data);
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      toast.success('Vista previa generada');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al generar vista previa'
      );
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast.success('Reporte eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar reporte');
    },
  });

  const onSubmit = (data: ReportFormData) => {
    createReportMutation.mutate(data);
  };

  const handlePreview = () => {
    const formData = watch();
    previewReportMutation.mutate(formData as ReportFormData);
  };

  const handleDownload = async (execution: ReportExecution) => {
    if (!execution.fileUrl) return;

    try {
      const response = await api.get(execution.fileUrl, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${execution.reportName}.${execution.format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error al descargar el reporte');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y programa reportes personalizados
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Reporte</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nombre del Reporte *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Ej: Ventas Mensuales"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descripción opcional del reporte"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportType">Tipo de Reporte *</Label>
                  <Select onValueChange={(value: any) => setValue('reportType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="customers">Clientes</SelectItem>
                      <SelectItem value="inventory">Inventario</SelectItem>
                      <SelectItem value="financial">Financiero</SelectItem>
                      <SelectItem value="tasks">Tareas</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.reportType && (
                    <p className="text-sm text-red-500">
                      {errors.reportType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Formato *</Label>
                  <Select
                    defaultValue="pdf"
                    onValueChange={(value: any) => setValue('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Fecha Desde *</Label>
                  <Input type="date" {...register('dateFrom')} />
                  {errors.dateFrom && (
                    <p className="text-sm text-red-500">
                      {errors.dateFrom.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo">Fecha Hasta *</Label>
                  <Input type="date" {...register('dateTo')} />
                  {errors.dateTo && (
                    <p className="text-sm text-red-500">
                      {errors.dateTo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="schedule">Programación</Label>
                  <Select
                    defaultValue="none"
                    onValueChange={(value: any) => setValue('schedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin programar</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewReportMutation.isPending}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Vista Previa
                </Button>
                <Button type="submit" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? 'Creando...' : 'Crear Reporte'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">Reportes Guardados</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4">
          {savedReports.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No hay reportes guardados. Crea tu primer reporte.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedReports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{report.name}</h3>
                        {report.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm('¿Estás seguro de eliminar este reporte?')
                          ) {
                            deleteReportMutation.mutate(report.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {reportTypeLabels[report.reportType as keyof typeof reportTypeLabels]}
                      </Badge>
                      {report.schedule && report.schedule !== 'none' && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {scheduleLabels[report.schedule as keyof typeof scheduleLabels]}
                        </Badge>
                      )}
                    </div>

                    {report.lastExecuted && (
                      <p className="text-xs text-muted-foreground">
                        Última ejecución:{' '}
                        {new Date(report.lastExecuted).toLocaleString('es-CO')}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => generateReportMutation.mutate(report.id)}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No hay reportes generados
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="font-medium">
                        {execution.reportName}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[execution.status]}>
                          {statusLabels[execution.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="uppercase">
                        {execution.format}
                      </TableCell>
                      <TableCell>
                        {new Date(execution.executedAt).toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        {execution.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(execution)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {previewData && (
        <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vista Previa del Reporte</DialogTitle>
            </DialogHeader>
            <div className="max-h-[600px] overflow-auto">
              <pre className="rounded-lg bg-muted p-4 text-sm">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
