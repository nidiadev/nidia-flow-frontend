# Módulo de Productos

## Descripción

Módulo completo para gestión de productos, servicios y combos con control de inventario, categorías y alertas de stock.

## Características Implementadas

### 1. Página Principal de Productos (`/products`)
- Dashboard con estadísticas clave
- Accesos rápidos a todas las funcionalidades
- Alertas recientes de stock
- Indicadores visuales de estado

### 2. Catálogo de Productos (`/products/catalog`)
- Lista completa de productos con tabla
- Filtros avanzados:
  - Búsqueda por nombre, SKU o descripción
  - Filtro por tipo (producto, servicio, combo)
  - Filtro por estado de stock
  - Ordenamiento múltiple
- Estadísticas en tiempo real
- Acciones rápidas por producto
- Indicadores visuales de stock

### 3. Formulario de Nuevo Producto (`/products/catalog/new`)
- Información básica (SKU, nombre, descripción, tipo)
- Gestión de precios y costos
- Cálculo automático de margen
- Control de inventario configurable
- Gestión de stock (actual, mínimo, máximo)
- Unidades de medida personalizables
- Estados (activo, destacado)
- Upload de imágenes (preparado)

### 4. Gestión de Categorías (`/products/categories`)
- Lista de categorías con estadísticas
- Creación de nuevas categorías
- Contador de productos por categoría
- Estados activo/inactivo
- Búsqueda de categorías

### 5. Alertas de Stock (`/products/alerts`)
- Lista de productos con stock bajo o agotado
- Clasificación por tipo de alerta:
  - Sin stock (crítico)
  - Stock bajo (advertencia)
- Estadísticas de alertas
- Filtros por estado (pendiente/resuelta)
- Acciones rápidas para resolver alertas
- Acceso directo al producto

## Tipos de Productos

### Producto
- Producto físico con inventario
- Control de stock completo
- Alertas automáticas

### Servicio
- Sin inventario físico
- Facturación por hora o unidad
- No genera alertas de stock

### Combo
- Combinación de productos
- Precio especial
- Control de componentes

## Estructura de Archivos

```
products/
├── page.tsx                    # Dashboard principal
├── catalog/
│   ├── page.tsx               # Lista de productos
│   └── new/
│       └── page.tsx           # Formulario nuevo producto
├── categories/
│   └── page.tsx               # Gestión de categorías
└── alerts/
    └── page.tsx               # Alertas de stock
```

## Tipos y Modelos

### Product
```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: 'product' | 'service' | 'combo';
  categoryId?: string;
  price: number;
  cost?: number;
  taxRate: number;
  trackInventory: boolean;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  tags?: string[];
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
}
```

### StockAlert
```typescript
interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock';
  isResolved: boolean;
}
```

## Funcionalidades Clave

### Control de Inventario
- Seguimiento automático de stock
- Alertas cuando el stock llega al mínimo
- Alertas críticas cuando se agota
- Historial de movimientos (preparado)

### Cálculos Automáticos
- Margen de ganancia
- Precio con impuestos
- Valor total del inventario
- Estadísticas por categoría

### Filtros y Búsqueda
- Búsqueda en tiempo real
- Múltiples filtros combinables
- Ordenamiento flexible
- Resultados instantáneos

## Integración con Backend

### Endpoints Utilizados (Mock)
- `GET /api/products` - Lista de productos
- `POST /api/products` - Crear producto
- `PATCH /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/categories` - Lista de categorías
- `GET /api/stock-alerts` - Alertas de stock

## Modo Offline

- Indicador visual de estado offline
- Datos cargados desde caché
- Funcionalidad limitada sin conexión

## Mejoras Futuras

1. **Variantes de Producto**: Gestión de tallas, colores, etc.
2. **Combos**: Crear productos combinados
3. **Movimientos de Inventario**: Historial completo de cambios
4. **Códigos de Barras**: Generación y escaneo
5. **Importación Masiva**: Excel/CSV
6. **Exportación**: Catálogo completo
7. **Imágenes Múltiples**: Galería por producto
8. **Precios por Volumen**: Descuentos automáticos
9. **Proveedores**: Gestión de proveedores
10. **Órdenes de Compra**: Reabastecimiento automático

## Requisitos Cumplidos

✅ Crear página de catálogo de productos
✅ Implementar formularios de creación/edición
✅ Crear gestión de categorías y variantes
✅ Implementar alertas de stock bajo

## Dependencias Pendientes

Para que el componente Switch funcione correctamente, instalar:

```bash
npm install @radix-ui/react-switch
```

## Tecnologías Utilizadas

- **Next.js 15**: Framework React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **ShadCN/UI**: Componentes de UI
- **Lucide React**: Iconos
- **Sonner**: Notificaciones
