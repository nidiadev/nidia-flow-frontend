'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  isCollapsed: boolean;
  variant?: 'admin' | 'client';
}

export function SidebarFooter({ isCollapsed, variant = 'client': SidebarFooterProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { data: subscription } = useSubscription();

  const planName = subscription?.plan?.displayName || 'Plan Gratuito';
  const planBadgeColor = subscription?.plan?.name === 'free' 
    ? 'bg-muted text-muted-foreground' 
    : subscription?.plan?.name === 'professional'
    ? 'bg-gradient-to-r from-nidia-green to-nidia-purple text-white'
    : 'bg-nidia-green text-white';

  if (isCollapsed) {
    return (
      <div className="p-3 space-y-2">
        {/* User avatar */}
        <Button
          variant="ghost"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="h-8 w-8 p-0 w-full relative"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-nidia-green to-nidia-purple">
            <span className="text-xs font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </Button>

        {/* Plan badge */}
        <div className="flex items-center justify-center">
          <Badge className={cn('text-[10px] font-medium px-1.5 py-0.5', planBadgeColor)}>
            {planName.split(' ')[1] || planName}
          </Badge>
        </div>

        {/* User menu dropdown */}
        <AnimatePresence>
          {showUserMenu && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-full ml-2 bottom-0 w-56 rounded-lg border bg-background shadow-lg z-50 overflow-hidden"
              >
                <div className="p-4 border-b">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role}
                  </p>
                </div>
                
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Button>
                  
                  <div className="my-2 border-t" />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* User section */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-nidia-green to-nidia-purple shrink-0">
            <span className="text-sm font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user?.role}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>

        {/* User menu dropdown */}
        <AnimatePresence>
          {showUserMenu && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 bottom-full mb-2 w-full rounded-lg border bg-background shadow-lg z-50 overflow-hidden"
              >
                <div className="p-4 border-b">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role}
                  </p>
                </div>
                
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Button>
                  
                  <div className="my-2 border-t" />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Plan Badge */}
      <div className="flex items-center justify-center">
        <Badge className={cn('text-xs font-medium px-2 py-1', planBadgeColor)}>
          {planName}
        </Badge>
      </div>
    </div>
  );
}

