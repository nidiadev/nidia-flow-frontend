'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, List, Info } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { smartListsApi } from '@/lib/api/crm';
import { api } from '@/lib/api';

export default function NewSmartListPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const createSmartList = useMutation({
    mutationFn: async (data: any) => {
      // Use api directly to ensure clean serialization
      const response = await api.post('/crm/smart-lists', data);
      return response.data;
    },
    onSuccess: (response) => {
      const smartList = response.data;
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
      toast.success('Lista inteligente creada exitosamente');
      router.push(route(`/crm/smart-lists/${smartList.id}`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la lista inteligente');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    try {
      // Create with a temporary condition that includes all customers
      // This is required by the backend - user can configure filters in detail page
      // Build condition object explicitly to avoid any hidden properties
      const conditionObj: Record<string, string> = {};
      conditionObj.field = 'id';
      conditionObj.fieldType = 'string';
      conditionObj.operator = 'is_not_null';
      
      // Build filterConfig explicitly
      const filterConfigObj: Record<string, any> = {};
      filterConfigObj.logic = filterLogic;
      filterConfigObj.conditions = [conditionObj];
      
      // Build main payload explicitly
      const cleanPayload: Record<string, any> = {};
      cleanPayload.name = name.trim();
      cleanPayload.filterLogic = filterLogic;
      cleanPayload.autoUpdate = autoUpdate;
      cleanPayload.isActive = isActive;
      cleanPayload.filterConfig = filterConfigObj;
      
      // Only add description if it has a value
      if (description.trim()) {
        cleanPayload.description = description.trim();
      }
      
      // Deep clone using JSON to ensure no hidden properties or getters
      const finalPayload = JSON.parse(JSON.stringify(cleanPayload));
      
      // Log the payload in development to debug
      if (process.env.NODE_ENV === 'development') {
        console.log('Smart List Payload (before JSON clone):', JSON.stringify(cleanPayload, null, 2));
        console.log('Smart List Payload (after JSON clone):', JSON.stringify(finalPayload, null, 2));
        // Verify no extra properties
        const conditionKeys = Object.keys(finalPayload.filterConfig.conditions[0]);
        console.log('Condition keys:', conditionKeys);
        console.log('Condition object:', finalPayload.filterConfig.conditions[0]);
        // Check for any non-enumerable properties
        const condition = finalPayload.filterConfig.conditions[0];
        console.log('All condition properties:', Object.getOwnPropertyNames(condition));
      }
      
      await createSmartList.mutateAsync(finalPayload);
    } catch (error: any) {
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Smart List Creation Error:', error);
        if (error?.response?.data) {
          console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
        }
        if (error?.response?.data?.error?.details) {
          console.error('Validation Errors:', error.response.data.error.details);
        }
      }
      // Error is handled by mutation
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nueva Lista Inteligente"
          description="Crea una lista inteligente para segmentar clientes automáticamente"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route('/crm/smart-lists')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
          }
        />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Información Básica</CardTitle>
                  <CardDescription>
                    Define el nombre y descripción de tu lista inteligente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nombre *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Clientes VIP"
                      required
                      maxLength={255}
                    />
                    <p className="text-xs text-muted-foreground">
                      Elige un nombre descriptivo para identificar esta lista
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe el propósito de esta lista..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional: Explica para qué se utilizará esta lista
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Lógica de Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Lógica de Filtros</CardTitle>
                  <CardDescription>
                    Define cómo se combinarán las condiciones de filtrado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="filterLogic" className="text-sm font-medium">
                      Lógica de Filtros
                    </Label>
                    <Select value={filterLogic} onValueChange={(value) => setFilterLogic(value as 'AND' | 'OR')}>
                      <SelectTrigger id="filterLogic">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">Y (AND) - Todas las condiciones</span>
                            <span className="text-xs text-foreground/70">El cliente debe cumplir todas las condiciones</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="OR">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">O (OR) - Cualquier condición</span>
                            <span className="text-xs text-foreground/70">El cliente debe cumplir al menos una condición</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {filterLogic === 'AND' 
                          ? 'Los clientes deben cumplir TODAS las condiciones para ser incluidos en la lista.'
                          : 'Los clientes deben cumplir AL MENOS UNA condición para ser incluidos en la lista.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="autoUpdate"
                        checked={autoUpdate}
                        onCheckedChange={(checked) => setAutoUpdate(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="autoUpdate" className="text-sm font-medium cursor-pointer">
                          Actualizar automáticamente
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          La lista se actualizará automáticamente cuando cambien los datos de los clientes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                          Lista activa
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          La lista estará activa y se evaluará automáticamente
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
                  <CardDescription>
                    Configura los filtros después de crear la lista
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <List className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium mb-1">Configuración de filtros</p>
                    <p className="text-xs">
                      Podrás configurar los filtros después de crear la lista
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Resumen */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumen</CardTitle>
                  <CardDescription className="text-xs">
                    Revisa la configuración antes de crear
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {name && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs text-muted-foreground font-medium">Nombre</p>
                      <p className="text-sm font-medium">{name}</p>
                    </div>
                  )}
                  
                  {description && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs text-muted-foreground font-medium">Descripción</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                    </div>
                  )}

                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium">Lógica</p>
                    <p className="text-sm font-medium">
                      {filterLogic === 'AND' ? 'Y (AND) - Todas las condiciones' : 'O (OR) - Cualquier condición'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Auto-actualizar</span>
                      <span className="font-medium">{autoUpdate ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estado</span>
                      <span className="font-medium">{isActive ? 'Activa' : 'Inactiva'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!name.trim() || createSmartList.isPending}
                      size="lg"
                    >
                      {createSmartList.isPending ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear Lista
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Podrás configurar los filtros después de crear la lista
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
