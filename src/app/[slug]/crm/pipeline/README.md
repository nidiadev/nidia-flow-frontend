# Pipeline de Ventas - Vista Kanban

## Descripción

Vista Kanban del pipeline de ventas que permite visualizar y gestionar el proceso de conversión de leads a clientes activos mediante drag & drop.

## Características Implementadas

### 1. Vista Kanban con 3 Etapas
- **Leads**: Contactos iniciales, potenciales clientes
- **Prospectos**: Leads calificados en proceso de evaluación
- **Clientes Activos**: Clientes convertidos con compras

### 2. Drag & Drop
- Arrastrar y soltar clientes entre etapas
- Actualización visual inmediata
- Feedback al usuario sobre el cambio de estado
- Validación de cambios de etapa

### 3. Métricas por Etapa
- **Total Pipeline**: Cantidad total de clientes en el pipeline
- **Valor Potencial**: Suma de límites de crédito
- **Score Promedio**: Calidad promedio del pipeline
- **Tasa de Conversión**: Porcentaje de conversión de leads a clientes

### 4. Filtros
- **Por Vendedor**: Todos, Mis clientes, Sin asignar
- **Por Fecha**: Todas, Hoy, Esta semana, Este mes, Este trimestre

### 5. Tarjetas de Cliente
Cada tarjeta muestra:
- Nombre completo del cliente
- Empresa (si aplica)
- Email y teléfono
- Lead score con indicador de color
- Vendedor asignado
- Fecha de último contacto
- Tags (hasta 2 visibles + contador)
- Menú de acciones rápidas

### 6. Acciones Rápidas
- Ver detalle del cliente
- Editar información
- Enviar email
- Realizar llamada
- Eliminar cliente

## Estructura de Componentes

```
PipelinePage (página principal)
├── PipelineFilters (filtros de vendedor y fecha)
├── PipelineMetrics (métricas del pipeline)
└── PipelineColumn (columna Kanban por etapa)
    └── CustomerCard (tarjeta de cliente)
```

## Uso

### Navegación
- Desde el sidebar: CRM > Pipeline
- Desde la página principal de CRM: botón "Ver Pipeline de Ventas"
- URL directa: `/crm/pipeline`

### Mover Clientes
1. Hacer clic y mantener presionado sobre una tarjeta de cliente
2. Arrastrar la tarjeta a la columna de destino
3. Soltar para confirmar el cambio
4. El sistema mostrará una notificación de confirmación

### Filtrar
- Usar los selectores en la parte superior para filtrar por vendedor o fecha
- Los filtros se aplican automáticamente a todas las columnas

## Integración con Backend

### Endpoints Utilizados
- `GET /api/customers` - Obtener lista de clientes
- `PATCH /api/customers/:id` - Actualizar tipo de cliente (para drag & drop)

### Estados de Cliente
- `lead` - Lead inicial
- `prospect` - Prospecto calificado
- `active` - Cliente activo

## Modo Offline

- Muestra indicador visual cuando no hay conexión
- Los datos se cargan desde caché
- Las acciones de drag & drop requieren conexión

## Mejoras Futuras

1. **Persistencia de Drag & Drop**: Implementar llamada al backend para guardar cambios
2. **Filtros Avanzados**: Agregar más opciones de filtrado (score, tags, ciudad)
3. **Búsqueda**: Agregar barra de búsqueda para encontrar clientes específicos
4. **Personalización**: Permitir configurar etapas personalizadas
5. **Animaciones**: Mejorar transiciones visuales del drag & drop
6. **Estadísticas por Etapa**: Agregar más métricas específicas por columna
7. **Acciones en Lote**: Permitir seleccionar múltiples clientes y moverlos juntos
8. **Historial**: Mostrar historial de movimientos entre etapas
9. **Notificaciones**: Alertas cuando un cliente lleva mucho tiempo en una etapa
10. **Exportación**: Exportar vista del pipeline a PDF o Excel

## Requisitos Cumplidos

✅ Crear vista Kanban para pipeline de ventas
✅ Implementar drag & drop para cambio de estados
✅ Crear métricas por etapa del pipeline
✅ Implementar filtros por vendedor y fecha

## Tecnologías Utilizadas

- **Next.js 15**: Framework React con App Router
- **React**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **ShadCN/UI**: Componentes de UI
- **Lucide React**: Iconos
- **React Query**: Gestión de estado del servidor
- **Sonner**: Notificaciones toast
