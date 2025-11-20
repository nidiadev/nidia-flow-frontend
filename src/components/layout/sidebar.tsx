'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import {
  LayoutDashboard,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { AuthService } from '@/lib/auth';
import { SidebarItem } from './sidebar-item';
import { SidebarFooter } from './sidebar-footer';
import { SidebarNotifications } from './sidebar-notifications';
import { SidebarThemeToggle } from './sidebar-theme-toggle';
import { Module } from '@/lib/auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
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

// Mapeo de nombres de iconos del backend a componentes de Lucide React
const getIconComponent = (iconName?: string): React.ComponentType<{ className?: string }> => {
  if (!iconName) {
    return LayoutDashboard;
  }

  // Convertir el nombre del icono a PascalCase si es necesario
  const iconKey = iconName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Buscar el icono en LucideIcons
  const IconComponent = (LucideIcons as any)[iconKey] || (LucideIcons as any)[iconName];
  
  if (IconComponent) {
    return IconComponent;
  }

  // Fallback a iconos comunes si no se encuentra
  const fallbackMap: Record<string, React.ComponentType<{ className?: string }>> = {
    users: LucideIcons.Users,
    user: LucideIcons.User,
    package: LucideIcons.Package,
    shoppingcart: LucideIcons.ShoppingCart,
    checksquare: LucideIcons.CheckSquare,
    dollarsign: LucideIcons.DollarSign,
    barchart3: LucideIcons.BarChart3,
    messagesquare: LucideIcons.MessageSquare,
    mappin: LucideIcons.MapPin,
    settings: LucideIcons.Settings,
    filetext: LucideIcons.FileText,
    calendar: LucideIcons.Calendar,
    inbox: LucideIcons.Inbox,
    list: LucideIcons.List,
    trendingup: LucideIcons.TrendingUp,
    zap: LucideIcons.Zap,
    fileedit: LucideIcons.FileEdit,
    building2: LucideIcons.Building2,
    bell: LucideIcons.Bell,
    layers: LucideIcons.Layers,
  };

  const normalizedName = iconName.toLowerCase().replace(/[-_]/g, '');
  return fallbackMap[normalizedName] || LayoutDashboard;
};

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

  // Construir navegación completamente desde los módulos del backend
  const navigationItems = useMemo(() => {
    const items: NavItem[] = [];

    // 1. Dashboard siempre disponible (no viene del backend)
    items.push({
      title: 'Dashboard',
      href: addTenantSlug('/dashboard'),
      icon: LayoutDashboard,
      isEnabled: true,
    });

    // 2. Obtener módulos del usuario (vienen del endpoint /auth/me)
    const userModules = (user?.modules || []) as Module[];

    // 3. Procesar cada módulo del backend
    userModules
      .filter((module) => module.isVisible) // Solo módulos visibles
      .sort((a, b) => a.sortOrder - b.sortOrder) // Ordenar por sortOrder
      .forEach((module) => {
        // Construir hijos desde los submódulos del backend
        const children: NavItem['children'] = [];

        if (module.subModules && module.subModules.length > 0) {
          // Procesar todos los submódulos visibles
          module.subModules
            .filter((sm) => sm.isVisible) // Solo submódulos visibles
            .sort((a, b) => a.sortOrder - b.sortOrder) // Ordenar por sortOrder
            .forEach((subModule) => {
              children.push({
                title: subModule.displayName,
                href: addTenantSlug(subModule.path || `${module.path}/${subModule.name}`),
                icon: getIconComponent(subModule.icon),
                isEnabled: subModule.isEnabled, // Marcar si está habilitado o no
                subModule: subModule,
              });
            });
        }

        // Los módulos principales SIEMPRE están habilitados visualmente
        // Solo los submódulos muestran el estado de habilitado/deshabilitado
        // El módulo principal nunca debe mostrar el candado
        items.push({
          title: module.displayName,
          href: addTenantSlug(module.path),
          icon: getIconComponent(module.icon),
          isEnabled: true, // Los módulos principales siempre están habilitados visualmente
          module: module,
          children: children.length > 0 ? children : undefined,
        });
      });

    return items;
  }, [user?.modules, tenantSlug]);

  // Usar isotipo.svg siempre
  const isotipoSrc = '/isotipo.svg';

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => {
      // Si el item ya está expandido, cerrarlo
      if (prev.includes(href)) {
        return prev.filter(item => item !== href);
      }
      // Si el sidebar está abierto (no colapsado), cerrar todos los demás y abrir solo este
      if (!isCollapsed) {
        return [href];
      }
      // Si está colapsado, permitir múltiples items expandidos
      return [...prev, href];
    });
  };

  const isExpanded = (href: string) => expandedItems.includes(href);

  return (
    <div className="relative h-screen">
      <aside
        className={cn(
          'flex h-full flex-col bg-sidebar transition-all duration-300 overflow-hidden',
          isCollapsed ? 'w-16' : 'w-56',
          className
        )}
      >
      {/* Header - Isotipo */}
      <div className={cn(
        "flex h-14 items-center px-3",
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
      <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          navigationItems.map((item) => (
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

      {/* Notifications Section */}
      <SidebarNotifications isCollapsed={isCollapsed} />

      {/* Theme Toggle Section */}
      <SidebarThemeToggle isCollapsed={isCollapsed} />

      {/* Footer con usuario y plan */}
      <SidebarFooter 
        isCollapsed={isCollapsed} 
        variant="client" 
      />
    </aside>

      {/* Floating Toggle Button - Top position */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'absolute top-4 -right-3 z-50 h-6 w-6 rounded-full border-2 border-sidebar-border bg-sidebar p-0 shadow-md hover:bg-sidebar-accent hover:border-sidebar-accent transition-all',
          'flex items-center justify-center'
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-sidebar-foreground" />
        )}
      </Button>
    </div>
  );
}
