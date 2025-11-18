'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Package } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { toast } from 'sonner';
import { ProductType } from '@/types/product';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'product' as ProductType,
    categoryId: '',
    price: '',
    cost: '',
    taxRate: '19',
    trackInventory: true,
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: 'unidad',
    isActive: true,
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Call API to create product
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Producto creado exitosamente');
      router.push('/products/catalog');
    } catch (error) {
      toast.error('Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products/catalog">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
            </div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Nuevo Producto
            </h1>
            <p className="text-muted-foreground">
              Agrega un nuevo producto o servicio al catálogo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        placeholder="PRD-001"
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => handleChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Producto</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                          <SelectItem value="combo">Combo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      placeholder="Nombre del producto"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Descripción detallada del producto"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => handleChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Computadoras</SelectItem>
                        <SelectItem value="2">Accesorios</SelectItem>
                        <SelectItem value="3">Servicios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Precios y Costos</CardTitle>
                  <CardDescription>
                    Información financiera del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio de Venta *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={(e) => handleChange('cost', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate">IVA (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        placeholder="19"
                        value={formData.taxRate}
                        onChange={(e) => handleChange('taxRate', e.target.value)}
                      />
                    </div>
                  </div>

                  {formData.price && formData.cost && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Margen de Ganancia</div>
                      <div className="text-2xl font-bold">
                        {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {formData.type === 'product' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Inventario</CardTitle>
                    <CardDescription>
                      Control de stock y alertas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Controlar Inventario</Label>
                        <p className="text-sm text-muted-foreground">
                          Activar seguimiento de stock
                        </p>
                      </div>
                      <Switch
                        checked={formData.trackInventory}
                        onCheckedChange={(checked: boolean) => handleChange('trackInventory', checked)}
                      />
                    </div>

                    {formData.trackInventory && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentStock">Stock Actual *</Label>
                            <Input
                              id="currentStock"
                              type="number"
                              placeholder="0"
                              value={formData.currentStock}
                              onChange={(e) => handleChange('currentStock', e.target.value)}
                              required={formData.trackInventory}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="minStock">Stock Mínimo *</Label>
                            <Input
                              id="minStock"
                              type="number"
                              placeholder="0"
                              value={formData.minStock}
                              onChange={(e) => handleChange('minStock', e.target.value)}
                              required={formData.trackInventory}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="maxStock">Stock Máximo</Label>
                            <Input
                              id="maxStock"
                              type="number"
                              placeholder="0"
                              value={formData.maxStock}
                              onChange={(e) => handleChange('maxStock', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidad de Medida</Label>
                          <Select 
                            value={formData.unit} 
                            onValueChange={(value) => handleChange('unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="caja">Caja</SelectItem>
                              <SelectItem value="paquete">Paquete</SelectItem>
                              <SelectItem value="kg">Kilogramo</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="metro">Metro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Producto Activo</Label>
                      <p className="text-sm text-muted-foreground">
                        Visible en el catálogo
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked: boolean) => handleChange('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Destacado</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostrar en inicio
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked: boolean) => handleChange('isFeatured', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imagen</CardTitle>
                  <CardDescription>
                    Imagen principal del producto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                    <Button type="button" variant="outline" size="sm">
                      Seleccionar Imagen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/products/catalog')}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
