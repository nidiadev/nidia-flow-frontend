# Componente Table Global

Componente de tabla completamente estandarizado que unifica todas las funcionalidades comunes de tablas en el micro-ERP/CRM.

## 🎯 Objetivo

Estandarizar todas las tablas del proyecto para que tengan:
- ✅ Misma estructura visual
- ✅ Misma lógica de funcionamiento
- ✅ Misma UX/UI
- ✅ Un único punto de mantenimiento
- ✅ Configuración flexible y escalable

## 📦 Estructura

```
components/table/
├── Table.tsx              # Componente principal
├── useTable.ts           # Hook con toda la lógica
├── types.ts              # Tipos TypeScript
├── presets.ts            # Presets pre-configurados
├── TableToolbar.tsx      # Barra de herramientas
├── TableSearch.tsx       # Búsqueda
├── TableFilters.tsx      # Filtros
├── TableActions.tsx      # Acciones globales
├── TablePagination.tsx    # Paginación
├── TableCardsView.tsx    # Vista de cards
├── TableStats.tsx        # Estadísticas
└── index.ts              # Exports
```

## 🚀 Uso Básico

```tsx
import { Table } from '@/components/table';

function CustomersPage() {
  const columns = [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
  ];

  return (
    <Table
      id="customers"
      data={customers}
      columns={columns}
      search={{ enabled: true, placeholder: 'Buscar clientes...' }}
      pagination={{ enabled: true, pageSize: 20 }}
    />
  );
}
```

## 📚 Ejemplos Completos

### Ejemplo 1: Tabla de Clientes (CRM)

```tsx
import { Table } from '@/components/table';
import { createCRMTablePreset } from '@/components/table/presets';
import { CustomerCard } from '@/components/crm/customer-card';

function CustomersPage() {
  const columns = getColumns(); // ColumnDef<Customer>[]
  const stats = {
    enabled: true,
    stats: [
      { label: 'Total', value: customers.length, icon: <Users /> },
      { label: 'Activos', value: activeCount, icon: <UserCheck /> },
    ],
  };

  const config = {
    ...createCRMTablePreset(customers, columns, {
      renderCard: (customer) => <CustomerCard customer={customer} />,
      filterOptions: [
        { value: 'lead', label: 'Leads' },
        { value: 'active', label: 'Activos' },
      ],
      stats,
    }),
    actions: [
      {
        label: 'Nuevo Cliente',
        icon: <Plus />,
        onClick: () => router.push('/customers/new'),
      },
    ],
    rowActions: [
      {
        label: 'Editar',
        icon: <Edit />,
        onClick: (customer) => router.push(`/customers/${customer.id}/edit`),
      },
    ],
  };

  return <Table {...config} />;
}
```

### Ejemplo 2: Catálogo de Productos

```tsx
import { Table } from '@/components/table';
import { createProductCatalogPreset } from '@/components/table/presets';
import { ProductCard } from '@/components/products/product-card';

function ProductsPage() {
  const columns = getColumns(); // ColumnDef<Product>[]
  const stats = {
    enabled: true,
    stats: [
      { label: 'Total', value: products.length },
      { label: 'Stock Bajo', value: lowStockCount },
    ],
  };

  const config = {
    ...createProductCatalogPreset(products, columns, {
      renderCard: (product) => <ProductCard product={product} />,
      stats,
    }),
    actions: [
      {
        label: 'Nuevo Producto',
        icon: <Plus />,
        onClick: () => router.push('/products/new'),
      },
    ],
  };

  return <Table {...config} />;
}
```

### Ejemplo 3: Tabla Simple

```tsx
import { Table } from '@/components/table';
import { createSimpleTablePreset } from '@/components/table/presets';

function CategoriesPage() {
  const columns = getColumns();
  
  const config = {
    ...createSimpleTablePreset(categories, columns),
    emptyState: {
      title: 'No hay categorías',
      description: 'Crea tu primera categoría para organizar tus productos',
      action: <Button>Nueva Categoría</Button>,
    },
  };

  return <Table {...config} />;
}
```

## ⚙️ Configuración Completa

### TableConfig

```typescript
interface TableConfig<T> {
  // Identificador único (para persistir preferencias)
  id?: string;
  
  // Datos y columnas
  data: T[];
  columns: ColumnDef<T>[];
  
  // Vista
  viewMode?: 'table' | 'cards';
  defaultViewMode?: 'table' | 'cards';
  
  // Búsqueda
  search?: {
    enabled: boolean;
    placeholder?: string;
    debounceMs?: number;
    onSearch?: (term: string) => void;
  };
  
  // Filtros
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'custom';
    options?: Array<{ value: string; label: string }>;
    defaultValue?: string;
  }>;
  
  // Ordenamiento
  sorting?: {
    enabled: boolean;
    defaultSort?: { field: string; order: 'asc' | 'desc' };
  };
  
  // Paginación
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    serverSide?: boolean;
    total?: number;
    onPageChange?: (page: number) => void;
  };
  
  // Acciones globales (botones en header)
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline';
  }>;
  
  // Acciones por fila (menú dropdown)
  rowActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    variant?: 'destructive';
  }>;
  
  // Vista de cards
  cards?: {
    enabled: boolean;
    renderCard: (item: T) => ReactNode;
    gridCols?: {
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };
  };
  
  // Estadísticas
  stats?: {
    enabled: boolean;
    stats: Array<{
      label: string;
      value: string | number;
      description?: string;
      icon?: ReactNode;
    }>;
  };
  
  // Estados
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  
  // Empty state
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
  };
  
  // Callbacks
  onRowClick?: (row: T) => void;
  
  // Features avanzadas
  features?: {
    columnVisibility?: boolean;
    columnSizing?: boolean;
    rowSelection?: boolean;
  };
}
```

## 🔄 Migración desde Tablas Antiguas

### Antes (Customers)

```tsx
// ❌ Código antiguo
<div className="space-y-4">
  <CustomerFilters ... />
  <Card>
    <DataTable ... />
  </Card>
  <Pagination ... />
</div>
```

### Después (con Table)

```tsx
// ✅ Código nuevo
<Table
  id="customers"
  data={customers}
  columns={columns}
  search={{ enabled: true }}
  filters={[...]}
  pagination={{ enabled: true }}
  cards={{ enabled: true, renderCard: ... }}
/>
```

## 🎨 Características

- ✅ **Vista Tabla y Cards**: Toggle entre ambas vistas
- ✅ **Búsqueda**: Con debounce configurable
- ✅ **Filtros**: Sistema flexible de filtros
- ✅ **Paginación**: Cliente y servidor
- ✅ **Ordenamiento**: Local y servidor
- ✅ **Acciones**: Globales y por fila
- ✅ **Estadísticas**: Cards de métricas
- ✅ **Exportación**: Preparado para CSV/Excel/PDF
- ✅ **Permisos**: Integrado con sistema de permisos
- ✅ **Persistencia**: Guarda preferencias en localStorage
- ✅ **Responsive**: Diseño adaptativo
- ✅ **Dark Mode**: Compatible con tema oscuro

## 📝 Notas

- El componente usa `@tanstack/react-table` internamente
- La vista de cards requiere un componente `renderCard` personalizado
- Los filtros se pueden extender con render personalizado
- La paginación del servidor requiere `serverSide: true` y callbacks

## 🔗 Componentes Relacionados

- `DataTable`: Componente base de tabla (shadcn/ui)
- `ViewToggle`: Toggle de vista tabla/cards
- `useViewMode`: Hook para persistir preferencia de vista

