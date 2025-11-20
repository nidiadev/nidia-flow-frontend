'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { calendarApi } from '@/lib/api/crm';

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['calendar', view, currentDate.toISOString()],
    queryFn: () => calendarApi.getView(view, currentDate.toISOString()),
  });

  const activities = data?.data?.data || [];

  const { data: todayData } = useQuery({
    queryKey: ['calendar-today'],
    queryFn: () => calendarApi.getToday(),
  });

  const todayActivities = todayData?.data?.data || [];

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Calendario de Actividades"
          description="Gestiona tus tareas, llamadas y reuniones"
          variant="gradient"
          actions={
            <Button asChild>
              <TenantLink href="/crm/activities/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Actividad
              </TenantLink>
            </Button>
          }
        />

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-4 font-medium">
              {currentDate.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <Select value={view} onValueChange={(v: 'month' | 'week' | 'day') => setView(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Today's Activities */}
        {todayActivities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Actividades de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayActivities.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{activity.subject}</span>
                      {activity.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </div>
                      )}
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={activities.length === 0}
          onRetry={refetch}
          emptyFallback={
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay actividades programadas</h3>
              <p className="text-muted-foreground mb-4">
                Crea actividades para organizar tu trabajo
              </p>
              <Button asChild>
                <TenantLink href="/crm/activities/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Actividad
                </TenantLink>
              </Button>
            </div>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Vista {view === 'month' ? 'Mensual' : view === 'week' ? 'Semanal' : 'Diaria'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{activity.subject}</h4>
                        <p className="text-sm text-muted-foreground">{activity.content}</p>
                        {activity.scheduledAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.scheduledAt).toLocaleString('es-ES')}
                          </div>
                        )}
                      </div>
                      <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}

