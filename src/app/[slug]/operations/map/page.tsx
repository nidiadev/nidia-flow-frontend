'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton } from '@/components/ui/loading';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  scheduledDate?: string;
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  activeTasks: number;
}

const statusColors = {
  pending: 'bg-muted',
  assigned: 'bg-nidia-blue',
  in_progress: 'bg-nidia-purple',
  completed: 'bg-nidia-green',
};

export default function OperationsMapPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch tasks with location
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-map', selectedDate, selectedOperator],
    queryFn: async () => {
      const params = new URLSearchParams({
        date: selectedDate,
        hasLocation: 'true',
        ...(selectedOperator !== 'all' && { assignedTo: selectedOperator }),
      });
      const response = await api.get(`/tasks?${params}`);
      return response.data;
    },
  });

  // Fetch operators with location
  const { data: operatorsData } = useQuery({
    queryKey: ['operators-location'],
    queryFn: async () => {
      const response = await api.get('/users/operators/location');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const tasks: Task[] = tasksData?.data || [];
  const operators: Operator[] = operatorsData?.data || [];

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !window.google) return;

    // Initialize map
    const map = new window.google.maps.Map(
      document.getElementById('map') as HTMLElement,
      {
        center: { lat: 4.7110, lng: -74.0721 }, // Bogotá
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      }
    );

    // Add task markers
    tasks.forEach((task) => {
      if (!task.location) return;

      const marker = new window.google.maps.Marker({
        position: {
          lat: task.location.latitude,
          lng: task.location.longitude,
        },
        map,
        title: task.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: statusColors[task.status].replace('bg-', '#'),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${task.title}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${task.location.address}</p>
            ${
              task.assignedTo
                ? `<p style="font-size: 12px;"><strong>Asignado a:</strong> ${task.assignedTo.firstName} ${task.assignedTo.lastName}</p>`
                : ''
            }
            ${
              task.scheduledDate
                ? `<p style="font-size: 12px;"><strong>Programada:</strong> ${new Date(task.scheduledDate).toLocaleString('es-CO')}</p>`
                : ''
            }
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Add operator markers
    operators.forEach((operator) => {
      if (!operator.currentLocation) return;

      const marker = new window.google.maps.Marker({
        position: {
          lat: operator.currentLocation.latitude,
          lng: operator.currentLocation.longitude,
        },
        map,
        title: `${operator.firstName} ${operator.lastName}`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${operator.firstName} ${operator.lastName}</h3>
            <p style="font-size: 12px;"><strong>Tareas activas:</strong> ${operator.activeTasks}</p>
            <p style="font-size: 12px; color: #666;">Última actualización: ${new Date(operator.currentLocation.timestamp).toLocaleTimeString('es-CO')}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Fit bounds to show all markers
    if (tasks.length > 0 || operators.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      tasks.forEach((task) => {
        if (task.location) {
          bounds.extend({
            lat: task.location.latitude,
            lng: task.location.longitude,
          });
        }
      });
      operators.forEach((operator) => {
        if (operator.currentLocation) {
          bounds.extend({
            lat: operator.currentLocation.latitude,
            lng: operator.currentLocation.longitude,
          });
        }
      });
      map.fitBounds(bounds);
    }
  }, [mapLoaded, tasks, operators]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Operaciones"
        description="Visualiza tareas y operarios en tiempo real"
        variant="gradient"
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <Select value={selectedOperator} onValueChange={setSelectedOperator}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Operario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los operarios</SelectItem>
              {operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.firstName} {operator.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Navigation className="mr-2 h-4 w-4" />
            Optimizar Rutas
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <span className="text-sm font-medium">Pendientes</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {tasks.filter((t) => t.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-nidia-purple" />
            <span className="text-sm font-medium">En Progreso</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {tasks.filter((t) => t.status === 'in_progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-nidia-green" />
            <span className="text-sm font-medium">Completadas</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {tasks.filter((t) => t.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Operarios Activos</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {operators.filter((o) => o.currentLocation).length}
          </p>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div
          id="map"
          className="h-[600px] w-full"
          style={{ minHeight: '600px' }}
        >
          {!mapLoaded && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
                <p className="text-muted-foreground">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Leyenda</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Estados de Tareas:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-sm">Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-nidia-blue" />
                <span className="text-sm">Asignada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-nidia-purple" />
                <span className="text-sm">En Progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-nidia-green" />
                <span className="text-sm">Completada</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Operarios:</p>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Ubicación en tiempo real</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
