'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, MapPin, User, CheckSquare } from 'lucide-react';
import { useTaskEvents } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ListSkeleton } from '@/components/ui/loading';
import { TenantLink } from '@/components/ui/tenant-link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { api } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  scheduledDate?: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
  checklistItems?: number;
  checklistCompleted?: number;
  createdAt: string;
}

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-nidia-purple/20 text-nidia-purple dark:bg-nidia-purple/30 dark:text-nidia-purple',
  in_progress: 'bg-nidia-green/20 text-nidia-green dark:bg-nidia-green/30 dark:text-nidia-green',
  completed: 'bg-nidia-green/30 text-nidia-green dark:bg-nidia-green/40 dark:text-nidia-green',
  cancelled: 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive',
};

const statusLabels = {
  pending: 'Pendiente',
  assigned: 'Asignada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground dark:bg-nidia-gray/50 dark:text-nidia-gray-light',
  medium: 'bg-nidia-turquoise/20 text-nidia-turquoise dark:bg-nidia-turquoise/30 dark:text-nidia-turquoise',
  high: 'bg-nidia-blue/20 text-nidia-blue dark:bg-nidia-blue/30 dark:text-nidia-blue',
  urgent: 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function TasksPage() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const queryClient = useQueryClient();

  // Listen for real-time task updates
  useTaskEvents(
    (task) => {
      // Task created
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    (task) => {
      // Task updated
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    (task) => {
      // Task assigned
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    (task) => {
      // Task started
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    (task) => {
      // Task completed
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  );

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, assignedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(assignedFilter !== 'all' && { assignedTo: assignedFilter }),
      });
      const response = await api.get(`/tasks?${params}`);
      return response.data;
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users?limit=100');
      return response.data;
    },
  });

  const tasks: Task[] = data?.data || [];
  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Gestiona y programa tareas operativas"
        variant="gradient"
        actions={
          (hasPermission('tasks:write') || hasPermission('tasks:create')) ? (
            <Button asChild>
              <TenantLink href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </TenantLink>
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="assigned">Asignada</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Asignado a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v: any) => setView(v)}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <ListSkeleton items={5} showAvatar={false} />
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No se encontraron tareas</p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={statusColors[task.status]}>
                          {statusLabels[task.status]}
                        </Badge>
                        <Badge className={priorityColors[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {task.assignedTo.firstName}{' '}
                            {task.assignedTo.lastName}
                          </span>
                        </div>
                      )}
                      {task.scheduledDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(task.scheduledDate).toLocaleDateString(
                              'es-CO',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                      )}
                      {task.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{task.location.address}</span>
                        </div>
                      )}
                      {task.checklistItems && task.checklistItems > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4" />
                          <span>
                            {task.checklistCompleted || 0}/{task.checklistItems}
                          </span>
                        </div>
                      )}
                    </div>

                    {task.order && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Orden: </span>
                        <span className="font-medium">
                          {task.order.orderNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {hasPermission('tasks:read') && (
                    <Button variant="outline" size="sm" asChild>
                      <TenantLink href={`/tasks/${task.id}`}>
                        Ver detalles
                      </TenantLink>
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="p-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Vista de calendario en desarrollo
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
