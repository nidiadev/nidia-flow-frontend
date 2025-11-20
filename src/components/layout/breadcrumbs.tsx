'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthService } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route mapping for better breadcrumb labels
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  customers: 'Clientes',
  leads: 'Leads',
  pipeline: 'Pipeline',
  interactions: 'Interacciones',
  products: 'Productos',
  catalog: 'Catálogo',
  categories: 'Categorías',
  inventory: 'Inventario',
  alerts: 'Alertas Stock',
  orders: 'Órdenes',
  new: 'Nueva',
  payments: 'Pagos',
  operations: 'Operaciones',
  tasks: 'Tareas',
  calendar: 'Calendario',
  map: 'Mapa',
  teams: 'Equipos',
  accounting: 'Contabilidad',
  transactions: 'Transacciones',
  accounts: 'Cuentas Bancarias',
  budgets: 'Presupuestos',
  reports: 'Reportes',
  communications: 'Comunicaciones',
  messages: 'Mensajes',
  templates: 'Plantillas',
  notifications: 'Notificaciones',
  saved: 'Guardados',
  scheduled: 'Programados',
  settings: 'Configuración',
  company: 'Empresa',
  users: 'Usuarios',
  roles: 'Roles',
  integrations: 'Integraciones',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Solo aplicar slug para usuarios de tenant, no para superadmin
  const userRole = user?.systemRole || user?.role;
  const isSuperAdmin = userRole === 'super_admin';
  const tenantSlug = !isSuperAdmin ? AuthService.getTenantSlug() : null;

  // Función helper para agregar el slug del tenant a las rutas
  const addTenantSlug = (href: string): string => {
    // Si es superadmin, retornar la ruta original (sin modificar)
    if (isSuperAdmin) {
      return href;
    }
    // Si no hay slug, retornar la ruta original
    if (!tenantSlug) {
      return href;
    }
    // Si la ruta ya tiene el slug, retornarla tal cual
    if (href.startsWith(`/${tenantSlug}/`)) {
      return href;
    }
    // Si la ruta empieza con /, agregar el slug
    if (href.startsWith('/')) {
      return `/${tenantSlug}${href}`;
    }
    // Si no empieza con /, agregar /slug/
    return `/${tenantSlug}/${href}`;
  };

  // Generate breadcrumbs from pathname if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1.5 text-sm',
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link
        href={addTenantSlug('/dashboard')}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-3.5 w-3.5 mx-1 text-muted-foreground/50" />
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              href={addTenantSlug(item.href)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip the first segment if it's 'dashboard' and we're not on the dashboard page
    if (segment === 'dashboard' && segments.length > 1) {
      return;
    }

    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Don't make the last item a link
    const href = index === segments.length - 1 ? undefined : currentPath;
    
    breadcrumbs.push({
      label,
      href,
    });
  });

  return breadcrumbs;
}

// Custom breadcrumbs hook for dynamic content
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const pathname = usePathname();
  
  if (customItems) {
    return customItems;
  }
  
  return generateBreadcrumbsFromPath(pathname);
}