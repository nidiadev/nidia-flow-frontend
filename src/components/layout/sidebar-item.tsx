'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, Lock, ArrowUpRight } from 'lucide-react';
import { FloatingMenu } from './sidebar-floating-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarItemProps {
  title: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: Array<{ 
    title: string; 
    href: string; 
    icon: LucideIcon | React.ComponentType<{ className?: string }>;
    isEnabled?: boolean;
    subModule?: any;
  }>;
  isCollapsed: boolean;
  isExpanded: boolean;
  onExpandToggle?: () => void;
  isEnabled?: boolean; // Si el módulo está habilitado en el plan
  module?: any; // Información del módulo
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
  isEnabled = true,
  module,
}: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringMenuRef = useRef(false);

  const isActive = pathname === href || pathname.startsWith(href + '/');
  const hasChildren = children && children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    // Los módulos principales siempre están habilitados, no necesitamos bloquear clicks
    // Solo los submódulos pueden estar bloqueados
  };

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
    const headerContent = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={handleClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                isEnabled
                  ? 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer'
                  : 'opacity-60 cursor-not-allowed',
                isActive && isEnabled && 'bg-primary text-primary-foreground font-medium shadow-sm',
                !isActive && isEnabled && 'text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && isEnabled ? 'text-primary-foreground' : 'text-muted-foreground')} />
              <span className="flex-1 truncate">{title}</span>
              {badge && (
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
                  {badge}
                </span>
              )}
            </div>
          </TooltipTrigger>
          {!isEnabled && (
            <TooltipContent>
              <p className="font-medium">Módulo no disponible</p>
              <p className="text-xs mt-1">Actualiza tu plan para acceder a "{title}"</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );

    return (
      <div className="space-y-1">
        {isEnabled ? (
          <Link href={href}>
            {headerContent}
          </Link>
        ) : (
          headerContent
        )}
        <div className="ml-8 space-y-1 border-l border-border pl-3">
          {children.map((child) => {
            const ChildIcon = child.icon;
            const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
            const childIsEnabled = child.isEnabled !== false; // Default to true if not specified
            
            const childContent = (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                        childIsEnabled
                          ? 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer text-sidebar-foreground'
                          : 'opacity-60 cursor-not-allowed',
                        isChildActive && childIsEnabled && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      )}
                      onClick={(e) => {
                        if (!childIsEnabled) {
                          e.preventDefault();
                          toast.info('Submódulo no disponible', {
                            description: `El submódulo "${child.title}" no está incluido en tu plan actual.`,
                            action: {
                              label: 'Ver Planes',
                              onClick: () => router.push('/settings/subscription'),
                            },
                          });
                        }
                      }}
                    >
                      <div className="relative">
                        <ChildIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {!childIsEnabled && (
                          <Lock className="absolute -top-0.5 -right-0.5 h-2 w-2 text-orange-500" />
                        )}
                      </div>
                      <span>{child.title}</span>
                    </div>
                  </TooltipTrigger>
                  {!childIsEnabled && (
                    <TooltipContent>
                      <p className="font-medium">Submódulo no disponible</p>
                      <p className="text-xs mt-1">Actualiza tu plan para acceder a "{child.title}"</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
            
            return childIsEnabled ? (
              <Link key={child.href} href={child.href}>
                {childContent}
              </Link>
            ) : (
              <div key={child.href}>
                {childContent}
              </div>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handleClick}
                  className={cn(
                    'relative flex items-center justify-center rounded-lg p-2.5 transition-all',
                    isEnabled
                      ? 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer'
                      : 'opacity-60 cursor-not-allowed',
                    isActive && isEnabled && 'bg-primary text-primary-foreground shadow-sm'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && isEnabled ? 'text-primary-foreground' : 'text-muted-foreground')} />
                  {badge && (
                    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {!isEnabled && (
                <TooltipContent>
                  <p className="font-medium">Módulo no disponible</p>
                  <p className="text-xs mt-1">Actualiza tu plan para acceder a "{title}"</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <FloatingMenu
          items={children.map(child => ({ 
            ...child, 
            icon: child.icon as LucideIcon,
            isEnabled: child.isEnabled !== false,
          }))}
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
    const content = (
      <div
        onClick={handleClick}
        className={cn(
          'relative flex items-center justify-center rounded-lg p-2.5 transition-all',
          isEnabled
            ? 'hover:bg-primary/15 hover:text-foreground cursor-pointer'
            : 'opacity-60 cursor-not-allowed',
          isActive && isEnabled && 'bg-primary text-primary-foreground shadow-sm'
        )}
        title={isEnabled ? title : `${title} - Actualiza tu plan`}
      >
        <Icon className={cn('h-5 w-5', isActive && isEnabled ? 'text-primary-foreground' : 'text-muted-foreground')} />
        {badge && (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
    );

    return isEnabled ? (
      <Link href={href}>
        {content}
      </Link>
    ) : (
      content
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
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isExpanded && 'bg-sidebar-accent',
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
        <div
          onClick={handleClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
            isEnabled
              ? 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer'
              : 'opacity-60 cursor-not-allowed',
            isActive && isEnabled && 'bg-primary text-primary-foreground font-medium shadow-sm'
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive && isEnabled ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <span className="flex-1 truncate">{title}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

