'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { FloatingMenu } from './sidebar-floating-menu';

interface SidebarItemProps {
  title: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: Array<{ title: string; href: string; icon: LucideIcon | React.ComponentType<{ className?: string }> }>;
  isCollapsed: boolean;
  isExpanded: boolean;
  onExpandToggle?: () => void;
}

export function SidebarItem({
  title,
  href,
  icon: Icon,
  badge,
  children,
  isCollapsed,
  isExpanded,
  onExpandToggle,
}: SidebarItemProps) {
  const pathname = usePathname();
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringMenuRef = useRef(false);

  const isActive = pathname === href || pathname.startsWith(href + '/');
  const hasChildren = children && children.length > 0;

  // Calcular posición del menú flotante
  useEffect(() => {
    if (showFloatingMenu && itemRef.current && isCollapsed) {
      const rect = itemRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 8, // 8px de separación
      });
    }
  }, [showFloatingMenu, isCollapsed]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isCollapsed && hasChildren) {
      // Cancelar cualquier timeout pendiente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowFloatingMenu(true);
      isHoveringMenuRef.current = false;
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed && hasChildren) {
      // Solo cerrar si no estamos sobre el menú flotante
      timeoutRef.current = setTimeout(() => {
        if (!isHoveringMenuRef.current) {
          setShowFloatingMenu(false);
        }
      }, 200); // Aumentar delay para dar tiempo a entrar al menú
    }
  };

  const handleMenuEnter = () => {
    // Cancelar timeout cuando el mouse entra al menú
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isHoveringMenuRef.current = true;
  };

  const handleMenuLeave = () => {
    isHoveringMenuRef.current = false;
    // Cerrar el menú después de un delay
    timeoutRef.current = setTimeout(() => {
      setShowFloatingMenu(false);
    }, 200);
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isHoveringMenuRef.current = false;
    setShowFloatingMenu(false);
  };

  // Si está expandido y tiene hijos, renderizar submenú inline
  if (!isCollapsed && hasChildren && isExpanded) {
    return (
      <div className="space-y-1">
        <Link
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
            'hover:bg-primary/15 hover:text-foreground',
            isActive && 'bg-primary text-primary-foreground font-medium shadow-sm'
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <span className="flex-1 truncate">{title}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
              {badge}
            </span>
          )}
        </Link>
        <div className="ml-8 space-y-0.5 border-l border-border pl-3">
          {children.map((child) => {
            const ChildIcon = child.icon;
            const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
            
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  'hover:bg-primary/15 hover:text-foreground',
                  isChildActive && 'bg-primary/15 text-foreground font-medium'
                )}
              >
                <ChildIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{child.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Si está colapsado y tiene hijos, mostrar menú flotante
  if (isCollapsed && hasChildren) {
    return (
      <>
        <div
          ref={itemRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          <Link
            href={href}
            className={cn(
              'flex items-center justify-center rounded-lg p-2.5 transition-all',
              'hover:bg-primary/15 hover:text-foreground',
              isActive && 'bg-primary text-primary-foreground shadow-sm'
            )}
            title={title}
          >
            <Icon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
            {badge && (
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {badge}
              </span>
            )}
          </Link>
        </div>
        <FloatingMenu
          items={children.map(child => ({ ...child, icon: child.icon as LucideIcon }))}
          isVisible={showFloatingMenu}
          position={menuPosition}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
          onClose={handleClose}
        />
      </>
    );
  }

  // Item simple (sin hijos) cuando está colapsado
  if (isCollapsed && !hasChildren) {
    return (
      <Link
        href={href}
        className={cn(
          'relative flex items-center justify-center rounded-lg p-2.5 transition-all',
          'hover:bg-primary/15 hover:text-foreground',
          isActive && 'bg-primary text-primary-foreground shadow-sm'
        )}
        title={title}
      >
        <Icon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
        {badge && (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  // Item expandido sin hijos o con hijos colapsados
  return (
    <div className="space-y-1">
      {hasChildren ? (
        <button
          onClick={onExpandToggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
            'hover:bg-primary/15 hover:text-foreground',
            isActive && 'bg-primary text-primary-foreground font-medium shadow-sm'
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <span className="flex-1 truncate text-left">{title}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
              {badge}
            </span>
          )}
        </button>
      ) : (
        <Link
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
            'hover:bg-primary/15 hover:text-foreground',
            isActive && 'bg-primary text-primary-foreground font-medium shadow-sm'
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <span className="flex-1 truncate">{title}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
              {badge}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

