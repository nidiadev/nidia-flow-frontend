# NIDIA Flow - Frontend

Aplicación frontend desarrollada con Next.js 15, React 19 y TypeScript para el sistema de gestión empresarial NIDIA Flow.

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías](#tecnologías)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Autenticación](#autenticación)
6. [Módulos Principales](#módulos-principales)
7. [Scripts Disponibles](#scripts-disponibles)
8. [Build y Deploy](#build-y-deploy)
9. [Configuración Avanzada](#configuración-avanzada)

## Descripción General

Frontend de NIDIA Flow construido con Next.js 15 usando App Router. Proporciona una interfaz de usuario moderna y responsiva para gestionar todas las operaciones empresariales.

### Características Principales

- Next.js 15 con App Router
- React 19 con Server Components
- TypeScript para type safety
- Tailwind CSS para estilos
- shadcn/ui para componentes UI
- TanStack Query para gestión de estado del servidor
- Autenticación JWT con refresh automático
- WebSockets para notificaciones en tiempo real
- Diseño responsivo y accesible

## Tecnologías

- **Next.js 15**: Framework React con App Router y Server Components
- **React 19**: Biblioteca UI con hooks modernos
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos utilitarios
- **shadcn/ui**: Componentes UI basados en Radix UI
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **TanStack Query**: Gestión de estado del servidor y cache
- **Axios**: Cliente HTTP
- **Sonner**: Notificaciones toast
- **Framer Motion**: Animaciones

## Instalación y Configuración

### Prerrequisitos

- Node.js 18 o superior
- Yarn o npm

### Instalación

```bash
# Instalar dependencias
yarn install
# o
npm install
```

### Configuración

Crear archivo `.env.local` con las siguientes variables:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4001

# Aplicación
NEXT_PUBLIC_APP_NAME=NIDIA Flow
NEXT_PUBLIC_APP_VERSION=1.0.0

# Puerto
PORT=4002

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Ejecutar en Desarrollo

```bash
# Modo desarrollo con Turbopack
yarn dev
# o
npm run dev
```

La aplicación estará disponible en `http://localhost:4002`

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── provisioning/  # Página de provisioning
│   ├── (dashboard)/       # Rutas del dashboard
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── tasks/
│   │   └── reports/
│   ├── superadmin/        # Panel SuperAdmin
│   │   ├── dashboard/
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── plans/
│   │   └── subscriptions/
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── ui/                # Componentes UI reutilizables
│   ├── layout/            # Componentes de layout
│   ├── crm/               # Componentes CRM
│   ├── tenants/           # Componentes de tenants
│   └── users/             # Componentes de usuarios
├── contexts/              # React Contexts
│   └── auth-context.tsx   # Contexto de autenticación
├── hooks/                 # Custom React Hooks
│   ├── use-api.ts
│   ├── use-token.ts
│   └── useWebSocket.ts
├── lib/                   # Utilidades y helpers
│   ├── api.ts             # Cliente API
│   ├── auth.ts            # Utilidades de autenticación
│   └── query-client.ts    # Configuración TanStack Query
├── providers/             # Providers de React
│   ├── query-provider.tsx
│   └── theme-provider.tsx
└── types/                 # Definiciones TypeScript
```

## Autenticación

### Flujo de Autenticación

El frontend implementa autenticación JWT con las siguientes características:

1. **Login**: Usuario ingresa credenciales, backend retorna access y refresh tokens
2. **Almacenamiento**: Tokens almacenados en localStorage y cookies
3. **Requests**: Access token incluido en header `Authorization`
4. **Refresh Automático**: Renovación automática cuando el token está próximo a expirar
5. **Logout**: Limpieza de tokens y redirección a login

### Contexto de Autenticación

```typescript
// Uso del contexto de autenticación
const { user, isAuthenticated, login, logout } = useAuth();
```

### Protección de Rutas

Las rutas protegidas verifican autenticación automáticamente mediante middleware de Next.js.

## Módulos Principales

### Dashboard

Vista principal con estadísticas y resumen de operaciones.

### CRM

- Gestión de clientes y leads
- Pipeline de ventas
- Interacciones y seguimiento
- Exportación de datos

### Productos

- Catálogo de productos
- Gestión de categorías
- Control de inventario
- Alertas de stock

### Órdenes

- Creación y gestión de órdenes
- Seguimiento de estado
- Gestión de pagos
- Historial

### Tareas

- Asignación de tareas
- Checklist y dependencias
- Fotos y firmas
- Geolocalización

### Reportes

- Reportes personalizados
- Análisis y estadísticas
- Exportación de datos

### SuperAdmin

Panel de administración para gestión de:
- Tenants
- Usuarios del sistema
- Planes y suscripciones
- Configuración global

## Scripts Disponibles

```bash
# Desarrollo
yarn dev              # Servidor de desarrollo con Turbopack
yarn build            # Compilar para producción
yarn start            # Ejecutar versión de producción
yarn lint             # Ejecutar linter
yarn lint:fix         # Corregir errores de linting
yarn type-check       # Verificar tipos TypeScript
```

## Build y Deploy

### Build de Producción

```bash
yarn build
```

### Deploy en Vercel

La forma más fácil de desplegar es usando Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

O conectar el repositorio GitHub directamente en el dashboard de Vercel.

### Variables de Entorno en Producción

Asegúrate de configurar las siguientes variables en tu plataforma de deploy:

- `NEXT_PUBLIC_API_URL`: URL del backend en producción
- `NEXT_PUBLIC_WS_URL`: URL del WebSocket en producción
- `NEXT_PUBLIC_APP_NAME`: Nombre de la aplicación
- `NEXT_PUBLIC_APP_VERSION`: Versión de la aplicación

## Configuración Avanzada

### Personalización de Temas

Los temas están configurados en `tailwind.config.ts` y pueden personalizarse mediante variables CSS en `app/globals.css`.

### Componentes UI

El proyecto utiliza shadcn/ui. Para agregar nuevos componentes:

```bash
npx shadcn-ui@latest add [component-name]
```

### Configuración de API

El cliente API está configurado en `src/lib/api.ts` y maneja automáticamente:
- Interceptores de request/response
- Refresh automático de tokens
- Manejo de errores
- Retry logic

## Solución de Problemas

### Error de Conexión con Backend

1. Verificar que el backend esté corriendo en `http://localhost:4001`
2. Revisar `NEXT_PUBLIC_API_URL` en `.env.local`
3. Verificar configuración CORS en el backend

### Errores de Tipo TypeScript

```bash
# Regenerar tipos
yarn type-check

# Limpiar cache
rm -rf .next tsconfig.tsbuildinfo
```

### Problemas con Autenticación

1. Verificar credenciales
2. Revisar consola del navegador para errores
3. Verificar que el backend tenga usuarios creados (ejecutar seed)

## Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
