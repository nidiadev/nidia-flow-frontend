# NIDIA Flow - Frontend

Frontend desarrollado con Next.js 15, React 19 y TypeScript para el sistema de gestión empresarial NIDIA Flow.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Yarn o npm

### Instalación

```bash
# Instalar dependencias
yarn install
# o
npm install
```

### Configuración

Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=NIDIA Flow
NEXT_PUBLIC_APP_VERSION=1.0.0
PORT=4002
```

### Ejecutar en Desarrollo

```bash
# Modo desarrollo con Turbopack
yarn dev
# o
npm run dev
```

La aplicación estará disponible en `http://localhost:4002`

## 👤 Iniciar Sesión

### Credenciales de Usuario Demo

Para acceder a la aplicación, utiliza las siguientes credenciales:

#### SuperAdmin (Recomendado)
- **Email**: `admin@nidiaflow.com`
- **Password**: `SuperAdmin123!`

Este usuario tiene acceso completo a:
- Panel de SuperAdmin
- Gestión de tenants
- Configuración global del sistema
- Todos los módulos

#### Usuario Alternativo
- **Email**: `admin@nidia.com`
- **Password**: Verificar en el backend (puede requerir reset)

### Verificar Usuarios Disponibles

Para ver todos los usuarios disponibles en la base de datos, ejecuta en el backend:

```bash
cd ../nidia-flow-backend
npx ts-node scripts/list-users.ts
```

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
yarn dev              # Servidor de desarrollo con Turbopack
yarn build            # Compilar para producción
yarn start            # Ejecutar versión de producción
yarn lint             # Ejecutar linter
yarn lint:fix         # Corregir errores de linting
yarn type-check       # Verificar tipos TypeScript
```

### Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   └── api/               # API routes (si aplica)
├── components/            # Componentes React
│   ├── ui/                # Componentes UI reutilizables
│   ├── crm/               # Componentes CRM
│   └── users/             # Componentes de usuarios
├── contexts/              # React Contexts
├── hooks/                 # Custom React Hooks
├── lib/                   # Utilidades y helpers
├── providers/             # Providers de React
└── types/                 # Definiciones TypeScript
```

## 🎨 Tecnologías

- **Next.js 15**: Framework React con App Router
- **React 19**: Biblioteca UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **shadcn/ui**: Componentes UI
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **TanStack Query**: Gestión de estado del servidor
- **Axios**: Cliente HTTP
- **Sonner**: Notificaciones toast

## 📦 Componentes UI

El proyecto utiliza componentes de shadcn/ui basados en Radix UI:

- Button, Card, Input, Select, Textarea
- Dialog, Dropdown, Popover, Tooltip
- Form, Label, Badge, Avatar
- Slider, Switch, Checkbox
- Y más...

## 🔐 Autenticación

El frontend utiliza:
- JWT tokens almacenados en memoria/contexto
- Refresh tokens para renovación automática
- Guards de ruta para proteger páginas
- Context API para estado de autenticación

### Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Backend valida y retorna JWT tokens
3. Tokens se almacenan en contexto de autenticación
4. Requests incluyen token en headers
5. Refresh automático cuando el token expira

## 📱 Módulos Principales

- **Dashboard**: Vista general y estadísticas
- **CRM**: Gestión de clientes y leads
- **Orders**: Órdenes y pedidos
- **Tasks**: Sistema de tareas
- **Users**: Gestión de usuarios (tenant)
- **Settings**: Configuración

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
yarn test
```

## 📦 Build y Deploy

### Build de Producción

```bash
yarn build
```

### Deploy en Vercel

La forma más fácil de desplegar es usando [Vercel](https://vercel.com):

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

O conecta tu repositorio GitHub directamente en el dashboard de Vercel.

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4001

# Aplicación
NEXT_PUBLIC_APP_NAME=NIDIA Flow
NEXT_PUBLIC_APP_VERSION=1.0.0

# Port
PORT=4002

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Personalización

- **Temas**: Configurado en `tailwind.config.ts`
- **Colores**: Variables CSS en `app/globals.css`
- **Fuentes**: Configurado en `app/layout.tsx`

## 🐛 Troubleshooting

### Error de Conexión con Backend

1. Verifica que el backend esté corriendo en `http://localhost:4001`
2. Revisa `NEXT_PUBLIC_API_URL` en `.env.local` (debe ser `http://localhost:4001/api/v1`)
3. Verifica CORS en el backend

### Errores de Tipo TypeScript

```bash
# Regenerar tipos
yarn type-check

# Limpiar cache
rm -rf .next tsconfig.tsbuildinfo
```

### Problemas con Autenticación

1. Verifica que las credenciales sean correctas
2. Revisa la consola del navegador para errores
3. Verifica que el backend tenga usuarios creados (ejecutar seed)

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## ⚠️ Notas Importantes

- Las credenciales demo son solo para desarrollo
- Cambiar contraseñas por defecto en producción
- No commitear archivos `.env.local` con credenciales reales
- Revisar configuración de CORS para producción
