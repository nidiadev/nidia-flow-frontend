'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarItem } from './sidebar-item';
import { SidebarFooter } from './sidebar-footer';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: Array<{ title: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
}

// Módulos administrativos simplificados - sin sub-rutas para "crear"
const adminNavigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/superadmin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clientes',
    href: '/superadmin/tenants',
    icon: Building2,
    children: [
      { title: 'Lista de Clientes', href: '/superadmin/tenants', icon: Building2 },
      { title: 'Estadísticas', href: '/superadmin/tenants/stats', icon: BarChart3 },
    ],
  },
  {
    title: 'Planes',
    href: '/superadmin/plans',
    icon: Package,
    children: [
      { title: 'Lista de Planes', href: '/superadmin/plans', icon: Package },
    ],
  },
  {
    title: 'Módulos',
    href: '/superadmin/modules',
    icon: Package,
    children: [
      { title: 'Lista de Módulos', href: '/superadmin/modules', icon: Package },
    ],
  },
  {
    title: 'Suscripciones',
    href: '/superadmin/subscriptions',
    icon: CreditCard,
    children: [
      { title: 'Todas las Suscripciones', href: '/superadmin/subscriptions', icon: CreditCard },
      { title: 'Activas', href: '/superadmin/subscriptions/active', icon: CreditCard },
      { title: 'Vencidas', href: '/superadmin/subscriptions/expired', icon: CreditCard },
    ],
  },
  {
    title: 'Usuarios del Sistema',
    href: '/superadmin/users',
    icon: Users,
    children: [
      { title: 'Todos los Usuarios', href: '/superadmin/users', icon: Users },
      { title: 'Super Admins', href: '/superadmin/users/superadmins', icon: Shield },
      { title: 'Soporte', href: '/superadmin/users/support', icon: Users },
    ],
  },
  {
    title: 'Estadísticas',
    href: '/superadmin/stats/overview',
    icon: TrendingUp,
    children: [
      { title: 'Resumen', href: '/superadmin/stats/overview', icon: BarChart3 },
      { title: 'Ingresos', href: '/superadmin/stats/revenue', icon: TrendingUp },
      { title: 'Usuarios', href: '/superadmin/stats/users', icon: Users },
      { title: 'Reportes', href: '/superadmin/stats/reports', icon: FileText },
    ],
  },
  {
    title: 'Configuración',
    href: '/superadmin/settings',
    icon: Settings,
    children: [
      { title: 'Sistema', href: '/superadmin/settings/system', icon: Settings },
      { title: 'Integraciones', href: '/superadmin/settings/integrations', icon: Settings },
      { title: 'Logs', href: '/superadmin/settings/logs', icon: FileText },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Minimizado por defecto
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  // Verificar que el usuario sea superadmin (priorizar systemRole)
  const isSuperAdmin = (user?.systemRole || user?.role) === 'super_admin';

  // Si no es superadmin, no mostrar el sidebar
  if (!isSuperAdmin) {
    return null;
  }

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
        <Link href="/" className="flex items-center gap-2.5">
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
                className="font-semibold text-xl text-foreground whitespace-nowrap overflow-hidden"
              >
                Flow
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {adminNavigationItems.map((item) => (
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
        ))}
      </nav>

      {/* Footer */}
      <SidebarFooter 
        isCollapsed={isCollapsed} 
        variant="admin" 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    </aside>
  );
}
