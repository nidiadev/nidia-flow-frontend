'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { useCustomers } from '@/hooks/use-api';
import { queryKeys } from '@/lib/query-client';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { calendarApi, Activity } from '@/lib/api/crm';
import { Combobox } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

export default function CalendarPage() {
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  
  // Fetch customers for selection
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = customersData || [];

  // Load FullCalendar CSS dynamically
  useEffect(() => {
    // Check if styles are already loaded
    const existingLinks = document.querySelectorAll('link[data-fullcalendar]');
    if (existingLinks.length >= 4) {
      return; // Styles already loaded
    }

    // Import FullCalendar CSS from CDN with error handling
    const cssFiles = [
      'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.19/main.min.css',
      'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.19/main.min.css',
      'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.19/main.min.css',
      'https://cdn.jsdelivr.net/npm/@fullcalendar/list@6.1.19/main.min.css',
    ];

    const links: HTMLLinkElement[] = [];
    cssFiles.forEach((href) => {
      // Check if this specific CSS file is already loaded
      const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(
        (link: any) => link.href === href || link.getAttribute('href') === href
      );
      
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-fullcalendar', 'true');
        link.crossOrigin = 'anonymous';
        
        // Add error handling
        link.onerror = () => {
          console.warn(`Failed to load FullCalendar CSS: ${href}`);
        };
        
        link.onload = () => {
          console.log(`Loaded FullCalendar CSS: ${href}`);
        };
        
        document.head.appendChild(link);
        links.push(link);
      }
    });

    // Don't cleanup on unmount - keep styles loaded for better UX
    // return () => {
    //   links.forEach((link) => {
    //     try {
    //       if (link.parentNode) {
    //         link.parentNode.removeChild(link);
    //       }
    //     } catch (e) {
    //       // Ignore errors during cleanup
    //     }
    //   });
    // };
  }, []);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filter states
  const [activityTypes, setActivityTypes] = useState<{
    task: boolean;
    call: boolean;
    meeting: boolean;
    email: boolean;
    note: boolean;
  }>({
    task: true,
    call: true,
    meeting: true,
    email: true,
    note: true,
  });
  const [ownership, setOwnership] = useState<'my' | 'all'>('my');
  const [status, setStatus] = useState<'open' | 'closed' | 'all'>('open');
  
  // Mini calendar state
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    type: 'meeting' as 'task' | 'call' | 'meeting' | 'email' | 'note',
    subject: '',
    content: '',
    scheduledAt: '',
    scheduledEndAt: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    location: '',
    customerId: '',
  });

  // Helper function to get ISO week number
  const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Fetch calendar view
  const { data: calendarData, isLoading, isError, error, refetch } = useApiQuery(
    queryKeys.crm.calendar.view(view, currentDate.toISOString(), {}),
    () => {
      const dateObj = currentDate;
      const viewMap: Record<string, 'month' | 'week' | 'day'> = {
        dayGridMonth: 'month',
        timeGridWeek: 'week',
        timeGridDay: 'day',
        listWeek: 'week',
      };
      
      const viewType = viewMap[view] || 'month';
      const params: any = {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
      };
      
      // Add week number for week views
      if (viewType === 'week') {
        params.week = getISOWeek(dateObj);
      }
      
      // Add day for day view
      if (viewType === 'day') {
        params.day = dateObj.getDate();
      }
      
      return calendarApi.getView(viewType, currentDate.toISOString(), params);
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch today's activities
  const { data: todayData } = useApiQuery(
    queryKeys.crm.calendar.today(),
    () => calendarApi.getToday(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const activities = (calendarData?.data?.activities || []) as Activity[];
  const todayActivities = (todayData?.data || []) as Activity[];

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
        activity,
      },
    }));
  }, [activities]);

  // Create activity mutation
  const createActivityMutation = useApiMutation(
    (data: any) => ApiClient.post('/crm/interactions', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'calendar'], exact: false });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.calendar.today() });
        queryClient.invalidateQueries({ queryKey: ['crm', 'interactions'], exact: false });
        setShowCreateDialog(false);
        resetForm();
        toast.success('Actividad creada');
      },
    }
  );

  // Complete activity mutation
  const completeActivityMutation = useApiMutation(
    ({ id, data }: { id: string; data: any }) => calendarApi.complete(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'calendar'], exact: false });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.calendar.today() });
        setShowDetailDialog(false);
        toast.success('Actividad completada');
      },
    }
  );

  // Update activity on drag
  const updateActivityMutation = useApiMutation(
    ({ id, scheduledAt, scheduledEndAt }: { id: string; scheduledAt: string; scheduledEndAt?: string }) =>
      ApiClient.put(`/crm/interactions/${id}`, { scheduledAt, scheduledEndAt }),
    {
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'calendar'], exact: false });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.calendar.today() });
      toast.success('Actividad actualizada');
    },
    }
  );

  const resetForm = () => {
    setFormData({
      type: 'meeting',
      subject: '',
      content: '',
      scheduledAt: '',
      scheduledEndAt: '',
      priority: 'normal',
      location: '',
      customerId: '',
    });
    setSelectedDate(null);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const activity = clickInfo.event.extendedProps.activity as Activity;
    if (activity) {
      setSelectedActivity(activity);
      setShowDetailDialog(true);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const start = selectInfo.start;
    const end = selectInfo.end || new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
    
    setSelectedDate(start);
    setFormData(prev => ({
      ...prev,
      scheduledAt: format(start, "yyyy-MM-dd'T'HH:mm"),
      scheduledEndAt: format(end, "yyyy-MM-dd'T'HH:mm"),
    }));
    setShowCreateDialog(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const activity = dropInfo.event.extendedProps.activity as Activity;
    if (activity && dropInfo.event.start) {
      updateActivityMutation.mutate({
        id: activity.id,
        scheduledAt: dropInfo.event.start.toISOString(),
        scheduledEndAt: dropInfo.event.end?.toISOString(),
      });
    }
  };

  const handleCreateActivity = () => {
    if (!formData.subject.trim() || !formData.scheduledAt) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    if (!formData.customerId || formData.customerId.trim() === '') {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    // Convert datetime-local format to ISO string
    const scheduledAtISO = new Date(formData.scheduledAt).toISOString();
    const scheduledEndAtISO = formData.scheduledEndAt 
      ? new Date(formData.scheduledEndAt).toISOString() 
      : undefined;

    createActivityMutation.mutate({
      customerId: formData.customerId,
      type: formData.type,
      subject: formData.subject,
      content: formData.content || undefined,
      scheduledAt: scheduledAtISO,
      scheduledEndAt: scheduledEndAtISO,
      priority: formData.priority,
      location: formData.location || undefined,
      status: 'scheduled', // Changed from 'pending' to 'scheduled'
    });
  };

  const handleCompleteActivity = () => {
    if (!selectedActivity) return;
    
    completeActivityMutation.mutate({
      id: selectedActivity.id,
      data: {
        content: selectedActivity.content,
      },
    });
  };

  const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (direction === 'prev') {
      calendarApi.prev();
      setCurrentDate(calendarApi.getDate());
    } else if (direction === 'next') {
      calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    } else {
      calendarApi.today();
      setCurrentDate(new Date());
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'Tarea',
      call: 'Llamada',
      meeting: 'Reunión',
      email: 'Email',
      note: 'Nota',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const activity = event.extendedProps.activity as Activity;
      if (!activity) return true;
      
      // Filter by activity type
      const typeKey = activity.type as keyof typeof activityTypes;
      if (!activityTypes[typeKey]) return false;
      
      // Filter by status
      if (status === 'open' && activity.status === 'completed') return false;
      if (status === 'closed' && activity.status !== 'completed') return false;
      
      // Filter by ownership (would need user context)
      // if (ownership === 'my' && activity.assignedTo !== currentUserId) return false;
      
      return true;
    });
  }, [events, activityTypes, status, ownership]);

  // Get dates with activities for mini calendar
  const datesWithActivities = useMemo(() => {
    const dates = new Set<string>();
    activities.forEach((activity: Activity) => {
      if (activity.scheduledAt) {
        const date = new Date(activity.scheduledAt);
        dates.add(format(date, 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [activities]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Calendario de Actividades"
          description="Gestiona tus tareas, llamadas y reuniones"
          actions={
            <Button onClick={() => {
              setSelectedDate(new Date());
              setFormData(prev => ({
                ...prev,
                scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                scheduledEndAt: format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
              }));
              setShowCreateDialog(true);
            }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Actividad
            </Button>
          }
        />

        {/* Main Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar - Left Side (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            {/* FullCalendar */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={false}
          onRetry={refetch}
          loadingFallback={
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/4"></div>
                  <div className="h-64 bg-muted rounded"></div>
            </div>
              </CardContent>
            </Card>
          }
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="calendar-wrapper p-6">
                <div className="calendar-container" style={{ minHeight: '600px' }}>
                <FullCalendar
                    ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  initialView={view}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      list: 'Lista',
                    }}
                    buttonIcons={{
                      prev: 'chevron-left',
                      next: 'chevron-right',
                    }}
                  locale="es"
                  events={filteredEvents}
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
                    aspectRatio={1.8}
                  eventClassNames="cursor-pointer"
                  eventContent={(eventInfo) => (
                    <div className="p-1">
                      <div className="font-medium text-sm truncate">{eventInfo.event.title}</div>
                      {eventInfo.event.extendedProps.location && (
                          <div className="text-xs opacity-80 truncate">
                          📍 {eventInfo.event.extendedProps.location}
                        </div>
                      )}
                    </div>
                  )}
                    dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00:00"
                    firstDay={1}
                    weekNumbers={true}
                    weekNumberCalculation="ISO"
                    weekNumberFormat={{ week: 'short' }}
                    businessHours={{
                      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
                      startTime: '09:00',
                      endTime: '18:00',
                    }}
                    nowIndicator={true}
                    navLinks={true}
                    dayMaxEventRows={3}
                    moreLinkClick="popover"
                    eventDisplay="block"
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: 'short'
                    }}
                    views={{
                      dayGridMonth: {
                        dayHeaderFormat: { weekday: 'short' },
                        titleFormat: { year: 'numeric', month: 'long' },
                      },
                      timeGridWeek: {
                        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
                        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                        slotLabelFormat: {
                          hour: '2-digit',
                          minute: '2-digit',
                          meridiem: 'short'
                        },
                      },
                      timeGridDay: {
                        dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'short' },
                        slotLabelFormat: {
                          hour: '2-digit',
                          minute: '2-digit',
                          meridiem: 'short'
                        },
                      },
                      listWeek: {
                        listDayFormat: { weekday: 'long', day: 'numeric', month: 'short' },
                        listDaySideFormat: { month: 'short', day: 'numeric' },
                      },
                    }}
                    datesSet={(dateInfo) => {
                      // Update current date when calendar view changes
                      const newView = dateInfo.view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
                      if (newView !== view) {
                        setView(newView);
                      }
                      // Update current date to trigger refetch with correct week/day params
                      if (dateInfo.start) {
                        setCurrentDate(dateInfo.start);
                        // Sync mini calendar
                        setMiniCalendarDate(dateInfo.start);
                      }
                    }}
                    viewDidMount={(viewInfo) => {
                      // Sync view state when view changes via toolbar buttons
                      const newView = viewInfo.view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
                      if (newView !== view) {
                        setView(newView);
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </QueryLoading>
          </div>

          {/* Sidebar - Right Side (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mini Calendar */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Calendario
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const newDate = new Date(miniCalendarDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setMiniCalendarDate(newDate);
                      }}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const newDate = new Date(miniCalendarDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setMiniCalendarDate(newDate);
                      }}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(miniCalendarDate, 'MMMM yyyy', { locale: es })}
                </p>
              </CardHeader>
              <CardContent>
                <MiniCalendar
                  date={miniCalendarDate}
                  selectedDate={currentDate}
                  datesWithActivities={datesWithActivities}
                  onDateSelect={(date) => {
                    setCurrentDate(date);
                    setMiniCalendarDate(date);
                    const calendarApi = calendarRef.current?.getApi();
                    if (calendarApi) {
                      calendarApi.gotoDate(date);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Activity Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Tipos de Actividad</Label>
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 filter-item">
                      <Checkbox
                        id="filter-task"
                        checked={activityTypes.task}
                        onCheckedChange={(checked) =>
                          setActivityTypes(prev => ({ ...prev, task: !!checked }))
                        }
                      />
                      <Label
                        htmlFor="filter-task"
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor('task', 'pending') }}></div>
                        Tareas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <Checkbox
                        id="filter-call"
                        checked={activityTypes.call}
                        onCheckedChange={(checked) =>
                          setActivityTypes(prev => ({ ...prev, call: !!checked }))
                        }
                      />
                      <Label
                        htmlFor="filter-call"
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor('call', 'pending') }}></div>
                        Llamadas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <Checkbox
                        id="filter-meeting"
                        checked={activityTypes.meeting}
                        onCheckedChange={(checked) =>
                          setActivityTypes(prev => ({ ...prev, meeting: !!checked }))
                        }
                      />
                      <Label
                        htmlFor="filter-meeting"
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor('meeting', 'pending') }}></div>
                        Reuniones
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <Checkbox
                        id="filter-email"
                        checked={activityTypes.email}
                        onCheckedChange={(checked) =>
                          setActivityTypes(prev => ({ ...prev, email: !!checked }))
                        }
                      />
                      <Label
                        htmlFor="filter-email"
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor('email', 'pending') }}></div>
                        Emails
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <Checkbox
                        id="filter-note"
                        checked={activityTypes.note}
                        onCheckedChange={(checked) =>
                          setActivityTypes(prev => ({ ...prev, note: !!checked }))
                        }
                      />
                      <Label
                        htmlFor="filter-note"
                        className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor('note', 'pending') }}></div>
                        Notas
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border"></div>

                {/* Ownership */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Propiedad</Label>
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 filter-item">
                      <input
                        type="radio"
                        id="ownership-my"
                        name="ownership"
                        checked={ownership === 'my'}
                        onChange={() => setOwnership('my')}
                        className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <Label
                        htmlFor="ownership-my"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Mis Actividades
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <input
                        type="radio"
                        id="ownership-all"
                        name="ownership"
                        checked={ownership === 'all'}
                        onChange={() => setOwnership('all')}
                        className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <Label
                        htmlFor="ownership-all"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Todas las Actividades
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border"></div>

                {/* Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Estado</Label>
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2 filter-item">
                      <input
                        type="radio"
                        id="status-open"
                        name="status"
                        checked={status === 'open'}
                        onChange={() => setStatus('open')}
                        className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <Label
                        htmlFor="status-open"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Actividades Abiertas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <input
                        type="radio"
                        id="status-closed"
                        name="status"
                        checked={status === 'closed'}
                        onChange={() => setStatus('closed')}
                        className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <Label
                        htmlFor="status-closed"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Actividades Cerradas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 filter-item">
                      <input
                        type="radio"
                        id="status-all"
                        name="status"
                        checked={status === 'all'}
                        onChange={() => setStatus('all')}
                        className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                      />
                      <Label
                        htmlFor="status-all"
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        Todas
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Activity Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Actividad</DialogTitle>
              <DialogDescription>
                Crea una nueva actividad en el calendario
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Combobox
                  options={customers.map((customer: any) => ({
                    value: customer.id,
                    label: customer.name || customer.email || `Cliente ${customer.id.slice(0, 8)}`,
                  }))}
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value || '' }))}
                  placeholder="Selecciona un cliente..."
                  searchPlaceholder="Buscar cliente..."
                  emptyMessage="No se encontraron clientes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="call">Llamada</SelectItem>
                      <SelectItem value="task">Tarea</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="note">Nota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Asunto *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ej: Reunión con cliente"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detalles de la actividad..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha y hora inicio *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha y hora fin</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledEndAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ej: Oficina, Zoom, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateActivity}
                disabled={createActivityMutation.isPending}
              >
                {createActivityMutation.isPending ? 'Creando...' : 'Crear Actividad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activity Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedActivity?.subject}</DialogTitle>
              <DialogDescription>
                {selectedActivity && getActivityTypeLabel(selectedActivity.type)}
              </DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Badge>{getStatusLabel(selectedActivity.status)}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prioridad</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {selectedActivity.priority === 'high' ? 'Alta' : 
                         selectedActivity.priority === 'low' ? 'Baja' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedActivity.content && (
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="mt-1 text-sm">{selectedActivity.content}</p>
                  </div>
                )}
                {selectedActivity.scheduledAt && (
                  <div>
                    <Label className="text-muted-foreground">Fecha y hora</Label>
                    <p className="mt-1 text-sm">
                      {format(new Date(selectedActivity.scheduledAt), 'PPp', { locale: es })}
                      {selectedActivity.scheduledEndAt && (
                        <> - {format(new Date(selectedActivity.scheduledEndAt), 'PPp', { locale: es })}</>
                      )}
                    </p>
                  </div>
                )}
                {selectedActivity.location && (
                  <div>
                    <Label className="text-muted-foreground">Ubicación</Label>
                    <p className="mt-1 text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedActivity.location}
                    </p>
                  </div>
                )}
      </div>
            )}
            <DialogFooter>
              {selectedActivity?.status !== 'completed' && (
                <Button
                  onClick={handleCompleteActivity}
                  disabled={completeActivityMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como completada
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <style jsx global>{`
          .calendar-wrapper {
            width: 100%;
            position: relative;
          }
          
        .calendar-container {
          width: 100%;
            position: relative;
        }
        
          /* FullCalendar Base Styles */
        .fc {
          font-family: inherit;
            color: hsl(var(--foreground));
            width: 100%;
            display: block;
            background-color: transparent;
          }
          
          .fc-view-harness {
            min-height: 500px;
            background-color: transparent;
          }
          
          .fc-view-harness-active > .fc-view {
            background-color: transparent;
          }
          
          /* Calendar wrapper */
          .calendar-wrapper {
            background-color: transparent;
          }
          
          .calendar-container {
            background-color: transparent;
          }
          
          /* Calendar Header Toolbar */
          .fc-header-toolbar {
            margin-bottom: 1.5rem;
            padding: 1.25rem 1.5rem;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          .dark .fc-header-toolbar {
            background: hsl(var(--card));
            border-color: hsl(var(--border));
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
          }
          
          .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: hsl(var(--foreground)) !important;
            margin: 0;
            letter-spacing: -0.025em;
          }
          
          .fc-toolbar-chunk {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .fc-toolbar-chunk .fc-button-group {
            display: flex;
            gap: 0.25rem;
            background-color: hsl(var(--muted) / 0.6);
            padding: 0.25rem;
            border-radius: 0.5rem;
            border: 1px solid hsl(var(--border));
          }
          
          /* Buttons - Base Styles */
          .fc-button {
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            color: hsl(var(--foreground));
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 0.875rem;
            cursor: pointer;
            position: relative;
            min-height: 2.25rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .fc-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
            border-color: hsl(var(--border));
            color: hsl(var(--foreground));
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .fc-button:focus {
            outline: none;
            box-shadow: 0 0 0 2px hsl(var(--ring));
          }
          
          .fc-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          /* Active button (selected view) */
          .fc-button-active {
            background-color: hsl(var(--primary)) !important;
            border-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
            font-weight: 600;
          }
          
          .fc-button-active:hover {
            background-color: hsl(var(--primary) / 0.9) !important;
            border-color: hsl(var(--primary) / 0.9) !important;
          }
          
          .fc-button-primary:not(:disabled):active,
          .fc-button-primary:not(:disabled).fc-button-active {
            background-color: hsl(var(--primary)) !important;
            border-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          .fc-button-group > .fc-button {
            margin: 0;
            border-radius: 0.375rem;
          }
          
          .fc-button-group > .fc-button:not(:first-child) {
            margin-left: 0;
          }
          
          .fc-button-group > .fc-button:not(:last-child) {
            margin-right: 0;
          }
          
          /* Navigation buttons (prev/next) */
          .fc-prev-button,
          .fc-next-button {
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            color: hsl(var(--foreground));
            padding: 0.5rem 0.75rem;
            min-width: 2.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .fc-prev-button:hover:not(:disabled),
          .fc-next-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
            border-color: hsl(var(--border));
            color: hsl(var(--foreground));
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          /* Today button */
          .fc-today-button {
            background-color: hsl(var(--secondary));
            border: 1px solid hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            font-weight: 600;
            padding: 0.5rem 1.25rem;
          }
          
          .fc-today-button:hover:not(:disabled) {
            background-color: hsl(var(--secondary) / 0.9);
            border-color: hsl(var(--secondary) / 0.9);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          /* View buttons (Mes, Semana, Día, Lista) */
          .fc-button-group .fc-button {
            background-color: transparent;
            border: none;
            color: hsl(var(--foreground));
            padding: 0.5rem 1rem;
          }
          
          .fc-button-group .fc-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
            border: none;
          }
          
          .fc-button-group .fc-button-active {
            background-color: hsl(var(--primary)) !important;
            border: none !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          /* Calendar Grid */
          .fc-daygrid-day {
            background-color: hsl(var(--card));
            border-color: hsl(var(--border));
            transition: background-color 0.2s;
          }
          
          .fc-daygrid-day:hover {
            background-color: hsl(var(--muted) / 0.3);
          }
          
          .fc-daygrid-day-frame {
            min-height: 100px;
            padding: 0.5rem;
            background-color: transparent;
          }
          
          .fc-daygrid-body {
            background-color: transparent;
          }
          
          .fc-scrollgrid {
            background-color: transparent;
            border-color: hsl(var(--border));
          }
          
          .fc-scrollgrid-section {
            background-color: transparent;
          }
          
          .fc-scrollgrid-sync-table {
            background-color: transparent;
          }
          
          .fc-daygrid-day-top {
            padding: 0.5rem 0.5rem 0.25rem 0.5rem;
            display: flex;
            justify-content: flex-end;
          }
          
          .fc-daygrid-day-number {
            color: hsl(var(--foreground));
            font-weight: 500;
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            transition: all 0.2s;
            min-width: 1.75rem;
            text-align: center;
          }
          
          .fc-daygrid-day-number:hover {
            background-color: hsl(var(--muted));
          }
          
          /* Days outside current month */
          .fc-day-other .fc-daygrid-day-number {
            color: hsl(var(--muted-foreground));
            opacity: 0.5;
          }
          
          .fc-day-other {
            background-color: hsl(var(--muted) / 0.2);
          }
          
          /* Today */
          .fc-day-today {
            background: linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.05) 100%) !important;
            border: 2px solid hsl(var(--primary) / 0.3) !important;
          }
          
          .fc-day-today .fc-daygrid-day-number {
            color: hsl(var(--primary));
            font-weight: 700;
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
            color: white;
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px hsl(var(--primary) / 0.4);
          }
          
          /* Weekend days */
          .fc-day-sat,
          .fc-day-sun {
            background-color: hsl(var(--muted) / 0.2);
          }
          
          .fc-day-sat .fc-daygrid-day-number,
          .fc-day-sun .fc-daygrid-day-number {
            color: hsl(var(--muted-foreground));
          }
          
          /* Column headers */
          .fc-col-header-cell {
            background: linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%);
            border-color: hsl(var(--border));
            padding: 1rem 0.5rem;
            border-bottom: 2px solid hsl(var(--border));
          }
          
          .fc-col-header-cell-cushion {
            color: hsl(var(--foreground));
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          /* Week Numbers */
          .fc-daygrid-week-number {
            background: linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%);
            color: hsl(var(--muted-foreground));
            font-weight: 700;
            font-size: 0.75rem;
            padding: 0.75rem 0.5rem;
            border-right: 2px solid hsl(var(--border));
            text-align: center;
            letter-spacing: 0.05em;
          }
          
          .fc-daygrid-week-number:hover {
            background-color: hsl(var(--muted));
            color: hsl(var(--foreground));
          }
          
          /* Business Hours */
          .fc-bg-event {
            background-color: hsl(var(--muted) / 0.3);
            opacity: 0.3;
          }
          
          /* Now Indicator */
          .fc-timegrid-now-indicator-line {
            border-color: hsl(var(--primary));
            border-width: 2px;
          }
          
          .fc-timegrid-now-indicator-arrow {
            border-color: hsl(var(--primary));
          }
          
          /* Popover for more events */
          .fc-popover {
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .fc-popover-header {
            background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%);
            border-bottom: 2px solid hsl(var(--border));
            padding: 1rem 1.25rem;
            color: hsl(var(--foreground));
            font-weight: 700;
            font-size: 0.9375rem;
          }
          
          .fc-popover-body {
            padding: 0.75rem;
            max-height: 300px;
            overflow-y: auto;
          }
          
          .fc-popover-close {
            color: hsl(var(--muted-foreground));
            transition: all 0.2s;
            padding: 0.25rem;
            border-radius: 0.25rem;
          }
          
          .fc-popover-close:hover {
            color: hsl(var(--foreground));
            background-color: hsl(var(--muted));
          }
          
          /* List View */
          .fc-list {
            border-color: hsl(var(--border));
            border-radius: 0.5rem;
            overflow: hidden;
          }
          
          .fc-list-day-cushion {
            background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%);
            color: hsl(var(--foreground));
            padding: 1rem 1.25rem;
            font-weight: 700;
            font-size: 0.9375rem;
            border-bottom: 2px solid hsl(var(--border));
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .fc-list-event {
            cursor: pointer;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid hsl(var(--border));
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .fc-list-event:hover {
            background: linear-gradient(90deg, hsl(var(--muted) / 0.5) 0%, transparent 100%);
            padding-left: 1.5rem;
          }
          
          .fc-list-event-title {
            color: hsl(var(--foreground));
            font-weight: 600;
            font-size: 0.9375rem;
          }
          
          .fc-list-event-time {
            color: hsl(var(--muted-foreground));
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 80px;
          }
          
          /* Time grid improvements */
          .fc-timegrid-slot {
            border-color: hsl(var(--border));
            height: 3rem;
          }
          
          .fc-timegrid-slot-label {
            color: hsl(var(--muted-foreground));
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .fc-timegrid-col {
            border-color: hsl(var(--border));
          }
          
          .fc-timegrid-axis {
            border-color: hsl(var(--border));
            color: hsl(var(--muted-foreground));
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          /* Week/Day View */
          .fc-timegrid-slot {
            border-color: hsl(var(--border));
          }
          
          .fc-timegrid-col {
            border-color: hsl(var(--border));
          }
          
          .fc-timegrid-axis {
            border-color: hsl(var(--border));
            color: hsl(var(--muted-foreground));
          }
          
          /* Events */
          .fc-event {
            border-radius: 0.5rem;
            padding: 0.375rem 0.5rem;
            cursor: pointer;
            border: none;
            font-size: 0.8125rem;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            border-left: 3px solid currentColor;
          }
          
          .fc-event:hover {
            opacity: 0.95;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10;
          }
          
          .fc-event-title {
            font-weight: 600;
            line-height: 1.4;
          }
          
          /* Day Grid Events */
          .fc-daygrid-event {
            border-radius: 0.375rem;
            margin: 0.125rem 0;
            overflow: hidden;
          }
          
          .fc-daygrid-event-dot {
            display: none;
          }
          
          /* Time Grid Events */
          .fc-timegrid-event {
            border-radius: 0.375rem;
            border-left-width: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .fc-timegrid-event:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
          
          /* More link */
          .fc-more-link {
            color: hsl(var(--primary));
            font-weight: 600;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            transition: all 0.2s;
          }
          
          .fc-more-link:hover {
            background-color: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
          }
          
          /* List View */
          .fc-list-day-cushion {
            background-color: hsl(var(--muted));
            color: hsl(var(--foreground));
            padding: 0.75rem 1rem;
            font-weight: 600;
          }
          
          .fc-list-event {
            cursor: pointer;
          }
          
          .fc-list-event:hover {
            background-color: hsl(var(--muted) / 0.5);
          }
          
          /* More Link */
          .fc-more-link {
            color: hsl(var(--primary));
            font-weight: 500;
          }
          
          .fc-more-link:hover {
            color: hsl(var(--primary) / 0.8);
          }
          
          /* Scrollbar improvements */
          .fc-scroller::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          .fc-scroller::-webkit-scrollbar-track {
            background: hsl(var(--muted) / 0.3);
            border-radius: 0.5rem;
          }
          
          .fc-scroller::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 0.5rem;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          
          .fc-scroller::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
            background-clip: padding-box;
          }
          
          /* ============================================
             DARK MODE - COMPLETE STYLES ADJUSTMENT
             ============================================ */
          
          /* Base Calendar Container */
          .dark .fc {
            background-color: transparent;
            color: hsl(var(--foreground));
          }
          
          .dark .fc-view-harness {
            background-color: transparent;
          }
          
          /* Calendar Grid - Days */
          .dark .fc-daygrid-day {
            background-color: hsl(var(--card));
            border-color: hsl(var(--border));
          }
          
          .dark .fc-daygrid-day:hover {
            background-color: hsl(var(--muted) / 0.4);
          }
          
          .dark .fc-daygrid-day-frame {
            background-color: hsl(var(--card));
          }
          
          .dark .fc-daygrid-day-top {
            background-color: transparent;
          }
          
          .dark .fc-daygrid-day-number {
            color: hsl(var(--foreground));
            background-color: transparent;
          }
          
          .dark .fc-daygrid-day-number:hover {
            background-color: hsl(var(--muted));
            color: hsl(var(--foreground));
          }
          
          /* Days outside current month */
          .dark .fc-day-other {
            background-color: hsl(var(--muted) / 0.15);
            border-color: hsl(var(--border));
          }
          
          .dark .fc-day-other .fc-daygrid-day-number {
            color: hsl(var(--muted-foreground));
            opacity: 0.6;
          }
          
          /* Today */
          .dark .fc-day-today {
            background: linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 100%) !important;
            border: 2px solid hsl(var(--primary) / 0.4) !important;
          }
          
          .dark .fc-day-today .fc-daygrid-day-number {
            color: hsl(var(--primary-foreground));
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
            box-shadow: 0 2px 8px hsl(var(--primary) / 0.5);
          }
          
          /* Weekend days */
          .dark .fc-day-sat,
          .dark .fc-day-sun {
            background-color: hsl(var(--muted) / 0.15);
          }
          
          .dark .fc-day-sat .fc-daygrid-day-number,
          .dark .fc-day-sun .fc-daygrid-day-number {
            color: hsl(var(--muted-foreground));
          }
          
          /* Column Headers */
          .dark .fc-col-header-cell {
            background: hsl(var(--muted) / 0.6);
            border-color: hsl(var(--border));
            border-bottom: 2px solid hsl(var(--border));
          }
          
          .dark .fc-col-header-cell-cushion {
            color: hsl(var(--foreground));
            font-weight: 600;
          }
          
          /* Week Numbers */
          .dark .fc-daygrid-week-number {
            background: hsl(var(--muted) / 0.6);
            color: hsl(var(--muted-foreground));
            border-right: 2px solid hsl(var(--border));
          }
          
          .dark .fc-daygrid-week-number:hover {
            background-color: hsl(var(--muted));
            color: hsl(var(--foreground));
          }
          
          /* Events */
          .dark .fc-event {
            background-color: hsl(var(--primary) / 0.2);
            border-left-color: currentColor;
            color: hsl(var(--foreground));
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }
          
          .dark .fc-event:hover {
            background-color: hsl(var(--primary) / 0.3);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          
          .dark .fc-event-title {
            color: hsl(var(--foreground));
          }
          
          .dark .fc-daygrid-event {
            background-color: hsl(var(--primary) / 0.2);
            border-left-color: currentColor;
          }
          
          .dark .fc-timegrid-event {
            background-color: hsl(var(--primary) / 0.2);
            border-left-color: currentColor;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .dark .fc-timegrid-event:hover {
            background-color: hsl(var(--primary) / 0.3);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          
          /* Time Grid */
          .dark .fc-timegrid-slot {
            border-color: hsl(var(--border));
            background-color: transparent;
          }
          
          .dark .fc-timegrid-slot-label {
            color: hsl(var(--muted-foreground));
            border-color: hsl(var(--border));
          }
          
          .dark .fc-timegrid-col {
            border-color: hsl(var(--border));
            background-color: hsl(var(--card));
          }
          
          .dark .fc-timegrid-col-frame {
            background-color: hsl(var(--card));
          }
          
          .dark .fc-timegrid-axis {
            border-color: hsl(var(--border));
            background-color: hsl(var(--muted) / 0.3);
            color: hsl(var(--muted-foreground));
          }
          
          /* Business Hours */
          .dark .fc-bg-event {
            background-color: hsl(var(--muted) / 0.2);
            opacity: 0.4;
          }
          
          /* Now Indicator */
          .dark .fc-timegrid-now-indicator-line {
            border-color: hsl(var(--primary));
            border-width: 2px;
          }
          
          .dark .fc-timegrid-now-indicator-arrow {
            border-color: hsl(var(--primary));
          }
          
          /* Popover */
          .dark .fc-popover {
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
          }
          
          .dark .fc-popover-header {
            background: hsl(var(--muted) / 0.8);
            border-bottom: 2px solid hsl(var(--border));
            color: hsl(var(--foreground));
          }
          
          .dark .fc-popover-body {
            background-color: hsl(var(--card));
          }
          
          .dark .fc-popover-close {
            color: hsl(var(--muted-foreground));
          }
          
          .dark .fc-popover-close:hover {
            color: hsl(var(--foreground));
            background-color: hsl(var(--muted));
          }
          
          /* List View */
          .dark .fc-list {
            background-color: hsl(var(--card));
            border-color: hsl(var(--border));
          }
          
          .dark .fc-list-day-cushion {
            background-color: hsl(var(--muted) / 0.6);
            color: hsl(var(--foreground));
            border-bottom: 1px solid hsl(var(--border));
          }
          
          .dark .fc-list-event {
            background-color: hsl(var(--card));
            border-bottom: 1px solid hsl(var(--border));
          }
          
          .dark .fc-list-event:hover {
            background-color: hsl(var(--muted) / 0.4);
          }
          
          .dark .fc-list-event-title {
            color: hsl(var(--foreground));
          }
          
          .dark .fc-list-event-time {
            color: hsl(var(--muted-foreground));
          }
          
          /* More Link */
          .dark .fc-more-link {
            color: hsl(var(--primary));
            background-color: hsl(var(--primary) / 0.1);
          }
          
          .dark .fc-more-link:hover {
            background-color: hsl(var(--primary) / 0.2);
            color: hsl(var(--primary));
          }
          
          /* Scrollbar */
          .dark .fc-scroller::-webkit-scrollbar-track {
            background: hsl(var(--muted) / 0.2);
          }
          
          .dark .fc-scroller::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.4);
          }
          
          .dark .fc-scroller::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.6);
          }
          
          /* Dark mode - Calendar Container */
          .dark .calendar-wrapper {
            background-color: transparent;
          }
          
          .dark .calendar-container {
            background-color: transparent;
          }
          
          .dark .fc-scrollgrid {
            background-color: transparent;
            border-color: hsl(var(--border));
          }
          
          .dark .fc-scrollgrid-section {
            background-color: transparent;
          }
          
          .dark .fc-scrollgrid-sync-table {
            background-color: transparent;
          }
          
          .dark .fc-daygrid-body {
            background-color: transparent;
          }
          
          /* Dark mode button improvements */
          .dark .fc-button {
            background-color: hsl(var(--card));
            border-color: hsl(var(--border));
            color: hsl(var(--foreground));
          }
          
          .dark .fc-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
            border-color: hsl(var(--border));
          }
          
          .dark .fc-button-active {
            background-color: hsl(var(--primary)) !important;
            border-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          .dark .fc-toolbar-chunk .fc-button-group {
            background-color: hsl(var(--muted) / 0.4);
            border-color: hsl(var(--border));
          }
          
          .dark .fc-prev-button,
          .dark .fc-next-button {
            background-color: hsl(var(--card));
            border-color: hsl(var(--border));
            color: hsl(var(--foreground));
          }
          
          .dark .fc-prev-button:hover:not(:disabled),
          .dark .fc-next-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
            border-color: hsl(var(--border));
          }
          
          .dark .fc-today-button {
            background-color: hsl(var(--secondary));
            border-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
          }
          
          .dark .fc-today-button:hover:not(:disabled) {
            background-color: hsl(var(--secondary) / 0.9);
            border-color: hsl(var(--secondary) / 0.9);
          }
          
          .dark .fc-button-group .fc-button {
            background-color: transparent;
            border: none;
            color: hsl(var(--foreground));
          }
          
          .dark .fc-button-group .fc-button:hover:not(:disabled) {
            background-color: hsl(var(--muted));
          }
          
          .dark .fc-button-group .fc-button-active {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          /* Sidebar Styles */
          .sidebar-filters .border-t {
            border-color: hsl(var(--border));
          }
          
          /* Filter Checkbox and Radio Styles */
          .filter-item {
            transition: all 0.2s;
            padding: 0.25rem;
            margin: -0.25rem;
            border-radius: 0.375rem;
          }
          
          .filter-item:hover {
            background-color: hsl(var(--muted) / 0.3);
          }
          
          /* Mini Calendar Styles */
          .mini-calendar-day {
            position: relative;
          }
          
          .mini-calendar-day.has-activities::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: hsl(var(--primary));
          }
          
          /* Responsive improvements */
          @media (max-width: 1024px) {
            .grid-cols-1.lg\\:grid-cols-4 {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .fc-header-toolbar {
              flex-direction: column;
              gap: 1rem;
              padding: 1rem;
            }
            
            .fc-toolbar-chunk {
              width: 100%;
              justify-content: center;
            }
            
            .fc-toolbar-title {
              font-size: 1.25rem;
            }
            
            .fc-daygrid-day-frame {
              min-height: 60px;
            }
            
            .fc-button {
              padding: 0.375rem 0.75rem;
              font-size: 0.8125rem;
            }
          }
      `}</style>
      </div>
    </ErrorBoundary>
  );
}

// Mini Calendar Component
function MiniCalendar({
  date,
  selectedDate,
  datesWithActivities,
  onDateSelect,
}: {
  date: Date;
  selectedDate: Date;
  datesWithActivities: Set<string>;
  onDateSelect: (date: Date) => void;
}) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1); // Start on Monday
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (day: Date) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const isSelected = (day: Date) => {
    const d = new Date(day);
    const s = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    s.setHours(0, 0, 0, 0);
    return d.getTime() === s.getTime();
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === date.getMonth();
  };

  const hasActivities = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return datesWithActivities.has(dateStr);
  };

  return (
    <div className="w-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isTodayDay = isToday(day);
          const isSelectedDay = isSelected(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const hasActivitiesDay = hasActivities(day);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`
                aspect-square text-xs font-medium rounded-md transition-all relative
                flex items-center justify-center
                ${isSelectedDay
                  ? 'bg-primary text-primary-foreground shadow-md font-bold scale-105'
                  : isTodayDay
                  ? 'bg-primary/10 text-primary border-2 border-primary font-semibold'
                  : isCurrentMonthDay
                  ? 'text-foreground hover:bg-muted hover:scale-105'
                  : 'text-muted-foreground opacity-50 hover:bg-muted/50'}
              `}
            >
              {day.getDate()}
              {hasActivitiesDay && !isSelectedDay && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-primary"></div>
                  {datesWithActivities.has(dayStr) && (
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
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
