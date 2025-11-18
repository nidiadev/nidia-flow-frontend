'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CheckSquare,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Calendar,
  MapPin,
  Bell,
  Loader2,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { AuthService } from '@/lib/auth';
import { SidebarItem } from './sidebar-item';
import { SidebarFooter } from './sidebar-footer';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  moduleName?: string; // Nombre del módulo para filtrar por suscripción
  children?: Array<{ 
    title: string; 
    href: string; 
    icon: React.ComponentType<{ className?: string }>;
    isEnabled?: boolean;
    subModule?: any;
  }>;
  isEnabled?: boolean;
  module?: any;
}

// Navegación simplificada - sin sub-rutas para "crear"
const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    // Dashboard siempre disponible
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: Users,
    moduleName: 'crm',
    children: [
      { title: 'Clientes', href: '/crm/customers', icon: Users },
      { title: 'Pipeline', href: '/crm/pipeline', icon: BarChart3 },
    ],
  },
  {
    title: 'Productos',
    href: '/products',
    icon: Package,
    moduleName: 'products',
    children: [
      { title: 'Catálogo', href: '/products/catalog', icon: Package },
      { title: 'Categorías', href: '/products/categories', icon: Package },
      { title: 'Alertas Stock', href: '/products/alerts', icon: Bell },
    ],
  },
  {
    title: 'Órdenes',
    href: '/orders',
    icon: ShoppingCart,
    moduleName: 'orders',
    children: [
      { title: 'Todas las Órdenes', href: '/orders', icon: ShoppingCart },
      { title: 'Pagos', href: '/orders/payments', icon: DollarSign },
    ],
  },
  {
    title: 'Operaciones',
    href: '/tasks',
    icon: CheckSquare,
    moduleName: 'tasks',
    children: [
      { title: 'Tareas', href: '/tasks', icon: CheckSquare },
      { title: 'Mapa', href: '/operations/map', icon: MapPin },
    ],
  },
  {
    title: 'Contabilidad',
    href: '/accounting',
    icon: DollarSign,
    moduleName: 'accounting',
    children: [
      { title: 'Transacciones', href: '/accounting/transactions', icon: DollarSign },
      { title: 'Cuentas Bancarias', href: '/accounting/accounts', icon: Building2 },
      { title: 'Reportes', href: '/accounting/reports', icon: FileText },
    ],
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    moduleName: 'reports',
    children: [
      { title: 'Dashboard', href: '/reports', icon: BarChart3 },
      { title: 'Reportes Guardados', href: '/reports/saved', icon: FileText },
    ],
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
    // Configuración siempre disponible
    children: [
      { title: 'Empresa', href: '/settings/company', icon: Building2 },
      { title: 'Usuarios', href: '/settings/users', icon: Users },
      { title: 'Integraciones', href: '/settings/integrations', icon: Settings },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Minimizado por defecto
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();

  // Si el usuario es superadmin, no mostrar este sidebar (debe usar AdminSidebar)
  const userRole = user?.systemRole || user?.role;
  if (userRole === 'super_admin') {
    return null;
  }

  // Obtener slug del tenant del JWT
  const tenantSlug = AuthService.getTenantSlug();

  // Función helper para agregar el slug del tenant a las rutas
  const addTenantSlug = (href: string): string => {
    // Si no hay slug, retornar la ruta original (fallback)
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

  // Procesar navigationItems para agregar el slug del tenant
  const processedNavigationItems: NavItem[] = navigationItems.map(item => ({
    ...item,
    href: addTenantSlug(item.href),
    children: item.children?.map(child => ({
      ...child,
      href: addTenantSlug(child.href),
    })),
  }));

  // Obtener módulos del usuario (vienen del endpoint /auth/me)
  const userModules = user?.modules || [];
  const moduleMap = new Map(userModules.map(m => [m.name, m]));

  // Mostrar todos los módulos, pero marcar los no habilitados
  const filteredNavigationItems = processedNavigationItems.map(item => {
    if (!item.moduleName) {
      return { ...item, isEnabled: true };
    }

    const module = moduleMap.get(item.moduleName);
    const isVisible = module?.isVisible ?? true;

    // Si el módulo no es visible, no mostrarlo
    if (!isVisible) {
      return null;
    }

    // Si el módulo tiene submódulos, agregarlos como hijos (mostrar todos los visibles, pero marcar los deshabilitados)
    let childrenWithSubModules = item.children || [];
    
    if (module?.subModules && module.subModules.length > 0) {
      // Mostrar todos los submódulos visibles, no solo los habilitados
      // Esto permite mostrar submódulos bloqueados con indicador visual
      const visibleSubModules = module.subModules
        .filter(sm => sm.isVisible) // Solo filtrar por visibilidad
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(sm => {
          // Intentar obtener el icono del submódulo o usar uno por defecto
          const getIcon = () => {
            // Si el submódulo tiene un icono definido, intentar usarlo
            // Por ahora usamos un icono genérico, pero podrías mapear iconos
            return Layers; // Icono por defecto para submódulos
          };

          return {
            title: sm.displayName,
            href: sm.path || `${item.href}/${sm.name}`,
            icon: getIcon(),
            isEnabled: sm.isEnabled, // Marcar si está habilitado o no
            subModule: sm,
          };
        });

      // Combinar hijos existentes con submódulos visibles
      childrenWithSubModules = [...(item.children || []), ...visibleSubModules];
    }

    // NUEVA LÓGICA: Un módulo está habilitado SIEMPRE que tenga al menos 1 submódulo/hijo activo
    // Verificar en TODOS los hijos combinados (tanto hardcodeados como del backend)
    // Si tiene 0 submódulos/hijos activos, está bloqueado
    // Si no tiene submódulos definidos, usar la lógica anterior (isEnabled del módulo)
    let isEnabled: boolean;
    if (module?.subModules && module.subModules.length > 0) {
      // Si tiene submódulos del backend, verificar si al menos uno está habilitado
      // Verificar en todos los hijos combinados:
      // - Los submódulos del backend tienen isEnabled explícito
      // - Los hijos hardcodeados sin isEnabled se consideran habilitados por defecto
      const hasActiveSubModules = childrenWithSubModules.some(child => {
        // Si no tiene isEnabled definido, se considera habilitado (hijos hardcodeados)
        if (child.isEnabled === undefined) return true;
        // Si tiene isEnabled explícito, verificar su valor
        return child.isEnabled === true;
      });
      isEnabled = hasActiveSubModules;
    } else if (childrenWithSubModules.length > 0) {
      // Si no tiene submódulos del backend pero tiene hijos hardcodeados, verificar si alguno está habilitado
      const hasActiveChildren = childrenWithSubModules.some(child => child.isEnabled !== false);
      isEnabled = hasActiveChildren;
    } else {
      // Si no tiene submódulos ni hijos, usar la lógica anterior
      isEnabled = module ? (module.isEnabled ?? true) : true;
    }

    return { 
      ...item, 
      isEnabled, 
      module,
      children: childrenWithSubModules.length > 0 ? childrenWithSubModules : item.children,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Usar isotipo.svg siempre
  const isotipoSrc = '/isotipo.svg';

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isExpanded = (href: string) => expandedItems.includes(href);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-sidebar transition-all duration-300 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header - Isotipo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border px-3",
        isCollapsed ? "justify-center" : ""
      )}>
        <Link href={addTenantSlug('/dashboard')} className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center shrink-0"
          >
            <Image
              src={isotipoSrc}
              alt="NIDIA"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-lg text-foreground whitespace-nowrap overflow-hidden"
              >
                Flow
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          filteredNavigationItems.map((item) => (
            <SidebarItem
              key={item.href}
              title={item.title}
              href={item.href}
              icon={item.icon}
              badge={item.badge}
              children={item.children}
              isCollapsed={isCollapsed}
              isExpanded={isExpanded(item.href)}
              onExpandToggle={() => toggleExpanded(item.href)}
              isEnabled={item.isEnabled ?? true}
              module={item.module}
            />
          ))
        )}
      </nav>

      {/* Footer */}
      <SidebarFooter 
        isCollapsed={isCollapsed} 
        variant="client" 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    </aside>
  );
}
