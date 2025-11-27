# Páginas que Usan Tablas

Listado completo de todas las páginas y componentes que utilizan `DataTable` o tablas personalizadas.

## 📋 Páginas Principales

### CRM

1. **`/[slug]/crm/customers/page.tsx`**
   - ✅ Usa `DataTable`
   - ✅ Vista cards con `CustomerCard`
   - ✅ Filtros personalizados (`CustomerFilters`)
   - ✅ Paginación del servidor
   - ✅ Búsqueda
   - ✅ Estadísticas (`CustomerStats`)

2. **`/[slug]/crm/contacts/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ❌ Sin filtros avanzados
   - ✅ Búsqueda básica

### Products

3. **`/[slug]/products/catalog/page.tsx`**
   - ✅ Usa `DataTable`
   - ✅ Vista cards con `ProductCard`
   - ✅ Filtros personalizados (`ProductFilters`)
   - ✅ Paginación del servidor
   - ✅ Búsqueda
   - ✅ Estadísticas (calculadas localmente)

4. **`/[slug]/products/categories/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ❌ Sin filtros
   - ✅ Paginación del servidor
   - ✅ Búsqueda básica

5. **`/[slug]/products/inventory/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ❌ Sin filtros avanzados
   - ✅ Búsqueda básica

6. **`/[slug]/products/variants/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ✅ Acciones por fila
   - ✅ Búsqueda básica

7. **`/[slug]/products/alerts/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ✅ Acciones por fila
   - ✅ Búsqueda básica

8. **`/[slug]/products/pricing/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ✅ Búsqueda básica

9. **`/[slug]/products/catalog/[id]/variants/page.tsx`**
   - ✅ Usa `DataTable`
   - ❌ Sin vista cards
   - ✅ Acciones por fila
   - ✅ Búsqueda básica

### Orders

10. **`/[slug]/orders/page.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila
    - ✅ Búsqueda básica

### Reports

11. **`/[slug]/reports/page.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila (descargar reportes)
    - ✅ Búsqueda básica

### Accounting

12. **`/[slug]/accounting/page.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ❌ Sin acciones por fila
    - ✅ Búsqueda básica

## 🧩 Componentes Reutilizables

### Users

13. **`components/users/users-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila
    - ✅ Búsqueda básica

14. **`components/users/roles-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila
    - ✅ Búsqueda básica

### Modules

15. **`components/modules/modules-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ❌ Sin acciones
    - ✅ Búsqueda básica

### Plans

16. **`components/plans/plans-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ❌ Sin acciones
    - ✅ Búsqueda básica

### System Users

17. **`components/system-users/system-users-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ❌ Sin acciones
    - ✅ Búsqueda básica

### Subscriptions

18. **`components/subscriptions/subscriptions-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ❌ Sin acciones
    - ✅ Búsqueda básica

### Tenants

19. **`components/tenants/tenants-table.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila
    - ✅ Búsqueda básica

### Superadmin

20. **`app/superadmin/modules/[id]/submodules/page.tsx`**
    - ✅ Usa `DataTable`
    - ❌ Sin vista cards
    - ✅ Acciones por fila
    - ✅ Búsqueda básica

## 📊 Resumen

- **Total de páginas/componentes con tablas:** 20
- **Con vista cards:** 2 (Customers, Products Catalog)
- **Con filtros avanzados:** 2 (Customers, Products Catalog)
- **Con paginación del servidor:** 3 (Customers, Products Catalog, Categories)
- **Con estadísticas:** 2 (Customers, Products Catalog)

## 🎯 Prioridad de Migración

### Alta Prioridad (Más usadas y complejas)
1. `/[slug]/crm/customers/page.tsx` - ⭐⭐⭐
2. `/[slug]/products/catalog/page.tsx` - ⭐⭐⭐
3. `/[slug]/products/categories/page.tsx` - ⭐⭐

### Media Prioridad
4. `/[slug]/crm/contacts/page.tsx` - ⭐⭐
5. `/[slug]/products/inventory/page.tsx` - ⭐⭐
6. `/[slug]/products/variants/page.tsx` - ⭐⭐
7. `/[slug]/orders/page.tsx` - ⭐⭐

### Baja Prioridad (Simples)
8. Resto de páginas - ⭐

## 📝 Notas

- La mayoría de las tablas son simples y solo necesitan búsqueda básica
- Solo 2 páginas tienen vista cards implementada
- Solo 2 páginas tienen filtros avanzados
- La mayoría usa paginación del cliente (no del servidor)
- Muchas tablas no tienen acciones por fila

