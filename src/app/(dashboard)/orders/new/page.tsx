'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const orderSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente'),
  orderType: z.enum(['sale', 'service', 'rental']),
  status: z.enum(['pending', 'confirmed']),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      status: 'pending',
      orderType: 'sale',
    },
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers?limit=100');
      return response.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?limit=100');
      return response.data;
    },
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users?limit=100');
      return response.data;
    },
  });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];
  const users = usersData?.data || [];

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.quantity * item.discount,
    0
  );
  const totalTax = items.reduce(
    (sum, item) => sum + (item.subtotal * item.tax) / 100,
    0
  );
  const total = subtotal - totalDiscount + totalTax;

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price || 0,
      discount: 0,
      tax: product.taxRate || 19,
      subtotal: product.price || 0,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate subtotal
    const item = newItems[index];
    item.subtotal = item.quantity * item.unitPrice - item.discount;

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await api.post('/orders', {
        ...data,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.tax,
        })),
        subtotal,
        discount: totalDiscount,
        tax: totalTax,
        totalAmount: total,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Orden creada exitosamente');
      router.push('/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la orden');
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la orden');
      return;
    }
    createOrderMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">Nueva Orden</h1>
        <p className="text-muted-foreground">
          Crea una nueva orden de venta o servicio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Details */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Detalles de la Orden</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <Select
                onValueChange={(value) => setValue('customerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-500">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType">Tipo de Orden</Label>
              <Select
                defaultValue="sale"
                onValueChange={(value: any) => setValue('orderType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                  <SelectItem value="rental">Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                defaultValue="pending"
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Asignar a</Label>
              <Select onValueChange={(value) => setValue('assignedTo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Fecha Programada</Label>
              <Input
                type="datetime-local"
                {...register('scheduledDate')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                {...register('notes')}
                placeholder="Notas adicionales sobre la orden..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Productos/Servicios</h2>

          {/* Add Item */}
          <div className="mb-4 flex gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No hay productos agregados. Selecciona un producto para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-lg border p-4 md:grid-cols-6"
                >
                  <div className="md:col-span-2">
                    <Label className="text-xs">Producto</Label>
                    <p className="font-medium">{item.productName}</p>
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${index}`} className="text-xs">
                      Cantidad
                    </Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unitPrice-${index}`} className="text-xs">
                      Precio Unit.
                    </Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'unitPrice',
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`discount-${index}`} className="text-xs">
                      Descuento
                    </Label>
                    <Input
                      id={`discount-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(index, 'discount', parseFloat(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <Label className="text-xs">Subtotal</Label>
                      <p className="font-semibold">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Totals */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Totales</h2>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Descuento:</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency(totalDiscount)}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">IVA:</span>
                <span className="font-medium">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between gap-8 border-t pt-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-nidia-green">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createOrderMutation.isPending}>
            {createOrderMutation.isPending ? 'Creando...' : 'Crear Orden'}
          </Button>
        </div>
      </form>
    </div>
  );
}
