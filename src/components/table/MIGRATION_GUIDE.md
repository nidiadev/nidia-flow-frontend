# Guía de Migración: Tablas Estándar

Este documento describe cómo migrar las tablas existentes al nuevo componente `Table` global.

## 📊 Análisis de Inconsistencias Actuales

### Problemas Identificados

1. **Customers (`/[slug]/crm/customers`)**
   - ✅ Usa `DataTable` pero con paginación manual externa
   - ✅ Tiene componente `CustomerFilters` personalizado
   - ✅ Vista cards implementada manualmente
   - ✅ Paginación duplicada en múltiples lugares
   - ❌ Búsqueda manejada fuera del DataTable

2. **Products (`/[slug]/products/catalog`)**
   - ✅ Usa `DataTable` pero con paginación manual externa
   - ✅ Tiene componente `ProductFilters` personalizado
   - ✅ Vista cards implementada manualmente
   - ❌ Búsqueda duplicada (en filtros y DataTable)
   - ❌ Lógica de filtrado duplicada

3. **Categories (`/[slug]/products/categories`)**
   - ✅ Usa `DataTable` básico
   - ❌ Sin vista cards
   - ❌ Paginación manual externa
   - ❌ Sin filtros personalizados

### Inconsistencias Visuales

- Layout: Algunas tablas dentro de `Card`, otras no
- Espaciado: Diferentes valores de padding/margin
- Filtros: Diferentes posiciones y estilos
- Paginación: Diferentes implementaciones
- Empty states: Mensajes y estilos inconsistentes

## 🔄 Plan de Migración

### Paso 1: Migrar Customers

**Archivo:** `src/app/[slug]/crm/customers/page.tsx`

**Antes:**
```tsx
<div className="space-y-4">
  <CustomerFilters ... />
  <div className="rounded-lg border bg-card">
    {isTableView ? (
      <DataTable ... />
    ) : (
      <div className="grid ...">
        {customers.map(c => <CustomerCard ... />)}
      </div>
    )}
    <Pagination ... />
  </div>
</div>
```

**Después:**
```tsx
<Table
  id="customers"
  data={customers}
  columns={columns}
  search={{
    enabled: true,
    placeholder: 'Buscar por nombre, email, empresa...',
  }}
  filters={[
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos los tipos' },
        { value: 'lead', label: 'Leads' },
        { value: 'active', label: 'Activos' },
      ],
      defaultValue: 'all',
    },
  ]}
  sorting={{
    enabled: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  }}
  pagination={{
    enabled: true,
    pageSize: 20,
    serverSide: true,
    total: pagination?.total,
    onPageChange: setCurrentPage,
  }}
  cards={{
    enabled: true,
    renderCard: (customer) => (
      <CustomerCard
        customer={customer}
        viewUrl={route(`/crm/customers/${customer.id}`)}
        editUrl={route(`/crm/customers/${customer.id}/edit`)}
      />
    ),
    gridCols: { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  }}
  actions={[
    {
      label: 'Exportar',
      icon: <Download />,
      onClick: () => handleExport(),
    },
    {
      label: 'Nuevo Cliente',
      icon: <Plus />,
      onClick: () => router.push(route('/crm/customers/new')),
    },
  ]}
  rowActions={[
    {
      label: 'Ver detalle',
      icon: <Eye />,
      onClick: (customer) => router.push(route(`/crm/customers/${customer.id}`)),
    },
    {
      label: 'Editar',
      icon: <Edit />,
      onClick: (customer) => router.push(route(`/crm/customers/${customer.id}/edit`)),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 />,
      variant: 'destructive',
      separator: true,
      onClick: (customer) => handleDelete(customer.id),
    },
  ]}
  stats={{
    enabled: true,
    stats: [
      { label: 'Total', value: stats.total, icon: <Users /> },
      { label: 'Activos', value: stats.active, icon: <UserCheck /> },
    ],
  }}
  isLoading={isLoading}
  onRowClick={(customer) => router.push(route(`/crm/customers/${customer.id}`))}
/>
```

**Cambios necesarios:**
1. Eliminar componente `CustomerFilters`
2. Eliminar lógica de paginación manual
3. Mover búsqueda al componente Table
4. Usar callbacks para paginación del servidor

### Paso 2: Migrar Products

**Archivo:** `src/app/[slug]/products/catalog/page.tsx`

Similar a Customers, pero con filtros adicionales de stock:

```tsx
<Table
  id="products-catalog"
  data={products}
  columns={columns}
  search={{
    enabled: true,
    placeholder: 'Buscar por nombre, SKU o descripción...',
  }}
  filters={[
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos los tipos' },
        { value: 'product', label: 'Productos' },
        { value: 'service', label: 'Servicios' },
      ],
      defaultValue: 'all',
    },
    {
      key: 'stock',
      label: 'Stock',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'in_stock', label: 'En stock' },
        { value: 'low_stock', label: 'Stock bajo' },
      ],
      defaultValue: 'all',
    },
  ]}
  cards={{
    enabled: true,
    renderCard: (product) => <ProductCard product={product} />,
  }}
  // ... resto de configuración
/>
```

### Paso 3: Migrar Categories

**Archivo:** `src/app/[slug]/products/categories/page.tsx`

```tsx
<Table
  id="categories"
  data={categories}
  columns={columns}
  search={{
    enabled: true,
    placeholder: 'Buscar categorías...',
  }}
  pagination={{
    enabled: true,
    pageSize: 20,
    serverSide: true,
    total: pagination?.total,
    onPageChange: setPage,
  }}
  rowActions={[
    {
      label: 'Editar',
      icon: <Edit />,
      onClick: (category) => handleEdit(category),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 />,
      variant: 'destructive',
      onClick: (category) => handleDelete(category.id),
    },
  ]}
/>
```

## ✅ Checklist de Migración

Para cada tabla a migrar:

- [ ] Identificar todas las funcionalidades actuales
- [ ] Mapear columnas a `ColumnDef<T>[]`
- [ ] Convertir filtros a `TableFilterConfig[]`
- [ ] Configurar búsqueda (local o servidor)
- [ ] Configurar paginación (local o servidor)
- [ ] Mapear acciones globales
- [ ] Mapear acciones por fila
- [ ] Configurar vista cards (si aplica)
- [ ] Configurar estadísticas (si aplica)
- [ ] Probar funcionalidad completa
- [ ] Verificar permisos
- [ ] Verificar responsive
- [ ] Eliminar código antiguo

## 🚨 Breaking Changes

### Cambios en Props

1. **DataTable → Table**
   - `searchPlaceholder` → `search.placeholder`
   - `showSearch` → `search.enabled`
   - `showPagination` → `pagination.enabled`
   - `pageSize` → `pagination.pageSize`

2. **Paginación del Servidor**
   - Ahora requiere `pagination.serverSide: true`
   - Callbacks: `onPageChange`, `onPageSizeChange`
   - Total: `pagination.total`

3. **Filtros**
   - Ya no se pasan como props separados
   - Se configuran en `filters: TableFilterConfig[]`

### Código a Eliminar

- Componentes de filtros personalizados (`CustomerFilters`, `ProductFilters`)
- Lógica de paginación manual
- Lógica de búsqueda duplicada
- Lógica de toggle de vista manual
- Componentes de paginación manual

## 📝 Notas Importantes

1. **Paginación del Servidor**: Si tu backend maneja paginación, usa `serverSide: true` y los callbacks
2. **Filtros del Servidor**: Si los filtros se aplican en el backend, usa `onFiltersChange`
3. **Búsqueda del Servidor**: Si la búsqueda se hace en el backend, usa `search.onSearch`
4. **Permisos**: Las acciones respetan `requiredPermission` automáticamente
5. **Persistencia**: El `id` de la tabla se usa para guardar preferencias en localStorage

## 🎯 Beneficios de la Migración

- ✅ **Consistencia**: Todas las tablas se ven y funcionan igual
- ✅ **Mantenibilidad**: Un solo lugar para actualizar funcionalidades
- ✅ **UX Mejorada**: Experiencia de usuario uniforme
- ✅ **Menos Código**: Eliminación de duplicación
- ✅ **Escalabilidad**: Fácil agregar nuevas tablas
- ✅ **Testing**: Más fácil de testear un solo componente

## 🔗 Referencias

- [README.md](./README.md) - Documentación completa
- [presets.ts](./presets.ts) - Presets pre-configurados
- [types.ts](./types.ts) - Tipos TypeScript

