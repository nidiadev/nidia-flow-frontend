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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Attribute, attributesApi } from '@/lib/api/products';
import { toast } from 'sonner';
import { Loader2, Plus, X, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AttributeFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: Attribute;
  slug: string;
  onSuccess?: () => void;
}

export function AttributeFormDrawer({
  open,
  onOpenChange,
  attribute,
  slug,
  onSuccess,
}: AttributeFormDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    isRequired: false,
    values: [] as { id?: string, name: string, value: string, position: number }[],
  });

  useEffect(() => {
    if (open) {
      if (attribute) {
        setFormData({
          name: attribute.name,
          type: attribute.type,
          isRequired: attribute.isRequired,
          values: attribute.values?.map(v => ({
              id: v.id,
              name: v.name,
              value: v.value || '',
              position: v.position
          })) || [],
        });
      } else {
        setFormData({
          name: '',
          type: 'text',
          isRequired: false,
          values: [],
        });
      }
    }
  }, [open, attribute]);

  const createMutation = useMutation({
    mutationFn: async () => {
       // Map values to DTO format
       const dto = {
           ...formData,
           type: formData.type as any,
           values: formData.values.map(v => ({ name: v.name, value: v.value, position: v.position }))
       };
       return attributesApi.create(dto);
    },
    onSuccess: async () => {
      // Invalidar todas las queries de atributos para actualización en tiempo real
      await queryClient.invalidateQueries({ queryKey: ['attributes'] });
      toast.success('Atributo creado correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Error al crear atributo');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
       if (!attribute) throw new Error('No ID');
        const dto = {
           ...formData,
           type: formData.type as any,
           values: formData.values.map(v => ({ id: v.id, name: v.name, value: v.value, position: v.position }))
       };
       return attributesApi.update(attribute.id, dto);
    },
    onSuccess: async () => {
      // Invalidar todas las queries de atributos para actualización en tiempo real
      await queryClient.invalidateQueries({ queryKey: ['attributes'] });
      toast.success('Atributo actualizado correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Error al actualizar atributo');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        toast.error('El nombre es requerido');
        return;
    }

    // Validation for Color Type
    if (formData.type === 'color') {
        const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
        const invalidColors = formData.values.filter(v => v.value && !hexRegex.test(v.value));
        if (invalidColors.length > 0) {
            toast.error('Algunos valores de color no tienen un formato Hex válido (Ej: #FF0000)');
            return;
        }
    }

    if (attribute) {
      await updateMutation.mutateAsync();
    } else {
      await createMutation.mutateAsync();
    }
  };

  const addValue = () => {
      setFormData(prev => ({
          ...prev,
          values: [...prev.values, { name: '', value: '', position: prev.values.length }]
      }));
  };

  const removeValue = (index: number) => {
      setFormData(prev => ({
          ...prev,
          values: prev.values.filter((_, i) => i !== index)
      }));
  };

  const updateValue = (index: number, field: string, val: string) => {
      setFormData(prev => {
          const newValues = [...prev.values];
          newValues[index] = { ...newValues[index], [field]: val };
          return { ...prev, values: newValues };
      });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full w-full sm:max-w-lg">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>{attribute ? 'Editar Atributo' : 'Nuevo Atributo'}</DrawerTitle>
          <DrawerDescription>
            Define características reutilizables para tus productos
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
             {/* Basic Info Section */}
             <div className="space-y-5">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Nombre del Atributo</Label>
                    <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej: Color, Talla, Material"
                        className="h-10"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de Dato</Label>
                        <Select 
                            value={formData.type} 
                            onValueChange={val => setFormData({...formData, type: val})}
                            disabled={!!attribute}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="select">Lista (Select)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="opacity-0 pointer-events-none select-none text-sm font-medium">Espacio</Label>
                        <div className="flex items-center h-10">
                            <Checkbox 
                                id="required" 
                                checked={formData.isRequired}
                                onCheckedChange={(checked) => setFormData({...formData, isRequired: !!checked})}
                                className="mr-2"
                            />
                            <Label htmlFor="required" className="cursor-pointer text-sm font-normal">Es obligatorio</Label>
                        </div>
                    </div>
                </div>
             </div>

             {/* Values Section */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-semibold">Valores Predefinidos</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Agrega valores que los usuarios podrán seleccionar
                        </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addValue}>
                        <Plus className="h-4 w-4 mr-1.5" /> Agregar Valor
                    </Button>
                </div>
                
                <div className="space-y-3">
                    {formData.values.map((val, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                             <Input 
                                placeholder="Nombre (Ej: Rojo)"
                                value={val.name}
                                onChange={e => updateValue(index, 'name', e.target.value)}
                                className="flex-1 h-9"
                             />
                             {formData.type === 'color' ? (
                                 <div className="flex gap-1.5 items-center">
                                     <Input 
                                        type="color"
                                        value={val.value || '#000000'}
                                        onChange={e => updateValue(index, 'value', e.target.value)}
                                        className="w-12 h-9 p-1 cursor-pointer"
                                     />
                                     <Input 
                                        placeholder="#RRGGBB"
                                        value={val.value}
                                        onChange={e => updateValue(index, 'value', e.target.value)}
                                        className="w-28 h-9"
                                     />
                                 </div>
                             ) : (
                                 <Input 
                                    placeholder="Valor interno (Opcional)"
                                    value={val.value}
                                    onChange={e => updateValue(index, 'value', e.target.value)}
                                    className="flex-1 h-9"
                                 />
                             )}
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeValue(index)}
                                className="h-9 w-9 shrink-0"
                             >
                                 <X className="h-4 w-4 text-destructive" />
                             </Button>
                        </div>
                    ))}
                    {formData.values.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                            <div className="rounded-full bg-muted p-3 mb-3">
                                <Tag className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">No hay valores definidos</p>
                            <p className="text-xs text-muted-foreground text-center max-w-xs">
                                Los valores predefinidos permiten que los usuarios seleccionen opciones específicas al crear variantes
                            </p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addValue}
                                className="mt-4"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar primer valor
                            </Button>
                        </div>
                    )}
                </div>
             </div>
          </div>
          <DrawerFooter className="border-t flex-row justify-end gap-2">
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
