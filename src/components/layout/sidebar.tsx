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
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { SidebarItem } from './sidebar-item';
import { SidebarFooter } from './sidebar-footer';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  moduleName?: string; // Nombre del módulo para filtrar por suscripción
  children?: Array<{ title: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
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

  // Filtrar módulos según la suscripción activa
  const enabledModules = subscription?.plan.enabledModules || [];
  const filteredNavigationItems = navigationItems.filter(item => {
    // Si no tiene moduleName, siempre está disponible (Dashboard, Configuración)
    if (!item.moduleName) {
      return true;
    }
    // Si tiene moduleName, verificar si está en enabledModules
    return enabledModules.includes(item.moduleName);
  });

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
        <Link href="/dashboard" className="flex items-center gap-2.5">
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
