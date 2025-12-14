'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Warehouse, warehousesApi } from '@/lib/api/products';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface WarehouseFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse;
  slug: string;
  onSuccess?: () => void;
}

export function WarehouseFormDrawer({
  open,
  onOpenChange,
  warehouse,
  slug,
  onSuccess,
}: WarehouseFormDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      if (warehouse) {
        setFormData({
          name: warehouse.name,
          location: warehouse.location || '',
          isDefault: warehouse.isDefault,
          isActive: warehouse.isActive,
        });
      } else {
        setFormData({
          name: '',
          location: '',
          isDefault: false,
          isActive: true,
        });
      }
    }
  }, [open, warehouse]);

  const createMutation = useMutation({
    mutationFn: async () => warehousesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Bodega creada correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error('Error al crear bodega'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!warehouse) throw new Error('No ID');
      return warehousesApi.update(warehouse.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Bodega actualizada correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error('Error al actualizar bodega'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        toast.error('El nombre es requerido');
        return;
    }
    if (warehouse) {
      await updateMutation.mutateAsync();
    } else {
      await createMutation.mutateAsync();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full w-full sm:max-w-lg">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>{warehouse ? 'Editar Bodega' : 'Nueva Bodega'}</DrawerTitle>
          <DrawerDescription>
            Gestiona las ubicaciones físicas de tu inventario
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Nombre de la Bodega</Label>
                    <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej: Bodega Principal, Tienda Centro"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ubicación / Dirección</Label>
                    <Textarea 
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        placeholder="Dirección física..."
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="isDefault" 
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => setFormData({...formData, isDefault: !!checked})}
                    />
                    <Label htmlFor="isDefault">Es la bodega predeterminada</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="isActive" 
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({...formData, isActive: !!checked})}
                    />
                    <Label htmlFor="isActive">Activa</Label>
                </div>
             </div>
          </div>
          <DrawerFooter className="border-t">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <Button type="submit" disabled={isPending}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Guardar
             </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

