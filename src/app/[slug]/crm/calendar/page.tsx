'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
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
import { calendarApi, Activity } from '@/lib/api/crm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

export default function CalendarPage() {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['calendar', view, currentDate.toISOString()],
    queryFn: () => {
      const viewMap: Record<string, 'month' | 'week' | 'day'> = {
        dayGridMonth: 'month',
        timeGridWeek: 'week',
        timeGridDay: 'day',
        listWeek: 'week',
      };
      return calendarApi.getView(viewMap[view] || 'month', currentDate.toISOString());
    },
  });

  const activities = data?.data?.data || [];

  const { data: todayData } = useQuery({
    queryKey: ['calendar-today'],
    queryFn: () => calendarApi.getToday(),
  });

  const todayActivities = todayData?.data?.data || [];

  // Transform activities to FullCalendar events
  const events = useMemo(() => {
    return activities.map((activity: Activity) => ({
      id: activity.id,
      title: activity.subject,
      start: activity.scheduledAt ? new Date(activity.scheduledAt) : new Date(),
      end: activity.scheduledEndAt ? new Date(activity.scheduledEndAt) : undefined,
      backgroundColor: getActivityColor(activity.type, activity.status),
      borderColor: getActivityColor(activity.type, activity.status),
      extendedProps: {
        type: activity.type,
        status: activity.status,
        priority: activity.priority,
        location: activity.location,
        content: activity.content,
        customerId: activity.customerId,
      },
    }));
  }, [activities]);

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, scheduledAt, scheduledEndAt }: { id: string; scheduledAt: string; scheduledEndAt?: string }) => {
      // TODO: Implement update activity API call
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Actividad actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar la actividad');
    },
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    const activity = activities.find((a: Activity) => a.id === clickInfo.event.id);
    if (activity) {
      // TODO: Open activity detail modal or navigate to detail page
      toast.info(`Ver detalles de: ${activity.subject}`);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // TODO: Open create activity modal with pre-filled date
    toast.info(`Crear actividad desde ${format(selectInfo.start, 'PPp', { locale: es })}`);
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const activity = activities.find((a: Activity) => a.id === dropInfo.event.id);
    if (activity && dropInfo.event.start) {
      updateActivityMutation.mutate({
        id: activity.id,
        scheduledAt: dropInfo.event.start.toISOString(),
        scheduledEndAt: dropInfo.event.end?.toISOString(),
      });
    }
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
            <Button variant="outline" size="sm" onClick={() => {
              const cal = document.querySelector('.fc') as any;
              if (cal) cal.getApi().prev();
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const cal = document.querySelector('.fc') as any;
              if (cal) cal.getApi().today();
            }}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const cal = document.querySelector('.fc') as any;
              if (cal) cal.getApi().next();
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select 
            value={view} 
            onValueChange={(v: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek') => setView(v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Mes</SelectItem>
              <SelectItem value="timeGridWeek">Semana</SelectItem>
              <SelectItem value="timeGridDay">Día</SelectItem>
              <SelectItem value="listWeek">Lista</SelectItem>
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
                {todayActivities.slice(0, 5).map((activity: Activity) => (
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

        {/* FullCalendar */}
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
            <CardContent className="p-6">
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  initialView={view}
                  headerToolbar={false}
                  locale="es"
                  events={events}
                  editable={true}
                  droppable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  eventClick={handleEventClick}
                  select={handleDateSelect}
                  eventDrop={handleEventDrop}
                  height="auto"
                  eventClassNames="cursor-pointer"
                  eventContent={(eventInfo) => (
                    <div className="p-1">
                      <div className="font-medium text-sm truncate">{eventInfo.event.title}</div>
                      {eventInfo.event.extendedProps.location && (
                        <div className="text-xs text-muted-foreground truncate">
                          📍 {eventInfo.event.extendedProps.location}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </QueryLoading>
      </div>

      <style jsx global>{`
        .calendar-container {
          width: 100%;
        }
        
        .fc {
          font-family: inherit;
        }
        
        .fc-header-toolbar {
          margin-bottom: 1rem;
        }
        
        .fc-button {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        
        .fc-button:hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        
        .fc-button-active {
          background-color: hsl(var(--primary));
        }
        
        .fc-event {
          border-radius: 0.375rem;
          padding: 0.25rem;
          cursor: pointer;
        }
        
        .fc-event:hover {
          opacity: 0.9;
        }
        
        .fc-daygrid-event {
          border-radius: 0.25rem;
        }
        
        .fc-timegrid-event {
          border-radius: 0.25rem;
        }
      `}</style>
    </ErrorBoundary>
  );
}

function getActivityColor(type: string, status: string): string {
  if (status === 'completed') {
    return '#10b981'; // green
  }
  if (status === 'cancelled') {
    return '#ef4444'; // red
  }
  
  const colorMap: Record<string, string> = {
    task: '#3b82f6', // blue
    call: '#8b5cf6', // purple
    meeting: '#f59e0b', // amber
    email: '#06b6d4', // cyan
    note: '#6b7280', // gray
  };
  
  return colorMap[type] || '#3b82f6';
}
