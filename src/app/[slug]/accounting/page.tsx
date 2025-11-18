'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/loading';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  bankAccountId: z.string().min(1, 'Selecciona una cuenta'),
  description: z.string().min(1, 'La descripción es requerida'),
  transactionDate: z.string().min(1, 'La fecha es requerida'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: {
    id: string;
    name: string;
  };
  bankAccount: {
    id: string;
    name: string;
  };
  description: string;
  transactionDate: string;
  reference?: string;
  createdAt: string;
}

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryBudget {
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// Define columns for DataTable (Transactions)
function getTransactionColumns(): ColumnDef<Transaction>[] {
  return [
    {
      accessorKey: 'transactionDate',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.transactionDate).toLocaleDateString('es-CO')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div>
            <p className="font-medium">{transaction.description}</p>
            {transaction.reference && (
              <p className="text-xs text-muted-foreground">
                Ref: {transaction.reference}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => row.original.category.name,
    },
    {
      accessorKey: 'bankAccount',
      header: 'Cuenta',
      cell: ({ row }) => row.original.bankAccount.name,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge
            className={
              type === 'income'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          >
            {type === 'income' ? 'Ingreso' : 'Egreso'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div
            className={`text-right font-medium ${
              transaction.type === 'income'
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </div>
        );
      },
    },
  ];
}

export default function AccountingPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'income',
      transactionDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['accounting-summary', dateRange],
    queryFn: async () => {
      const response = await api.get(`/accounting/summary?days=${dateRange}`);
      return response.data;
    },
  });

  // Fetch transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', dateRange, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: dateRange,
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      const response = await api.get(`/transactions?${params}`);
      return response.data;
    },
  });

  // Fetch cash flow
  const { data: cashFlowData } = useQuery({
    queryKey: ['cash-flow', dateRange],
    queryFn: async () => {
      const response = await api.get(`/accounting/cash-flow?days=${dateRange}`);
      return response.data;
    },
  });

  // Fetch budget comparison
  const { data: budgetData } = useQuery({
    queryKey: ['budget-comparison', dateRange],
    queryFn: async () => {
      const response = await api.get(
        `/accounting/budget-comparison?days=${dateRange}`
      );
      return response.data;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const response = await api.get('/budget-categories');
      return response.data;
    },
  });

  // Fetch bank accounts
  const { data: accountsData } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const response = await api.get('/bank-accounts');
      return response.data;
    },
  });

  const summary = summaryData?.data || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeChange: 0,
    expenseChange: 0,
  };
  const transactions: Transaction[] = transactionsData?.data || [];
  const cashFlow: CashFlowData[] = cashFlowData?.data || [];
  const budgetComparison: CategoryBudget[] = budgetData?.data || [];
  const categories = categoriesData?.data || [];
  const bankAccounts = accountsData?.data || [];
  const transactionColumns = useMemo(() => getTransactionColumns(), []);

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await api.post('/transactions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['budget-comparison'] });
      toast.success('Transacción registrada exitosamente');
      setIsCreateDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al registrar transacción'
      );
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contabilidad"
        description="Gestiona ingresos, egresos y flujo de caja"
        variant="gradient"
        actions={
          <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Transacción</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      defaultValue="income"
                      onValueChange={(value: any) => setValue('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register('amount', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoría *</Label>
                    <Select
                      onValueChange={(value) => setValue('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-sm text-red-500">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountId">Cuenta Bancaria *</Label>
                    <Select
                      onValueChange={(value) => setValue('bankAccountId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bankAccountId && (
                      <p className="text-sm text-red-500">
                        {errors.bankAccountId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Fecha *</Label>
                    <Input type="date" {...register('transactionDate')} />
                    {errors.transactionDate && (
                      <p className="text-sm text-red-500">
                        {errors.transactionDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Referencia</Label>
                    <Input
                      id="reference"
                      {...register('reference')}
                      placeholder="Ej: Factura #123"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                      id="description"
                      {...register('description')}
                      placeholder="Descripción de la transacción"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Notas adicionales"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                  >
                    {createTransactionMutation.isPending
                      ? 'Registrando...'
                      : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </p>
              <p className="mt-2 text-3xl font-bold text-nidia-green">
                {formatCurrency(summary.totalIncome)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-nidia-green" />
                <span className="font-medium text-nidia-green">
                  +{summary.incomeChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="rounded-full bg-nidia-green/20 p-3">
              <TrendingUp className="h-6 w-6 text-nidia-green" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Egresos Totales
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {formatCurrency(summary.totalExpense)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600">
                  +{summary.expenseChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Balance
              </p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(summary.balance)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ingresos - Egresos
              </p>
            </div>
            <div className="rounded-full bg-nidia-green/20 p-3">
              <DollarSign className="h-6 w-6 text-nidia-green" />
            </div>
          </div>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Flujo de Caja</h2>
          <p className="text-sm text-muted-foreground">
            Evolución de ingresos y egresos
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })
              }
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('es-CO')
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              name="Ingresos"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              name="Egresos"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Balance"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Comparison */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Presupuesto vs Real</h2>
            <p className="text-sm text-muted-foreground">
              Comparativa por categoría
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="categoryName"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="budgeted" fill="#3b82f6" name="Presupuestado" />
              <Bar dataKey="spent" fill="#ef4444" name="Gastado" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Budget Status */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Estado del Presupuesto</h2>
            <p className="text-sm text-muted-foreground">
              Porcentaje utilizado por categoría
            </p>
          </div>
          <div className="space-y-4">
            {budgetComparison.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.categoryName}</span>
                  <span className="text-muted-foreground">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${
                      item.percentage > 100
                        ? 'bg-red-500'
                        : item.percentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Gastado: {formatCurrency(item.spent)}
                  </span>
                  <span>
                    Presupuesto: {formatCurrency(item.budgeted)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Transacciones Recientes</h2>
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Egresos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
        <DataTable
          data={transactions}
          columns={transactionColumns}
          searchPlaceholder="Buscar transacciones..."
          emptyMessage="No hay transacciones registradas"
          emptyDescription="Registra tu primera transacción para verla aquí"
          enableColumnVisibility={true}
          enableColumnSizing={true}
          getRowId={(row) => row.id}
        />
      </Card>
    </div>
  );
}
