'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  isCollapsed: boolean;
}

export function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'Nueva orden creada',
      message: 'Orden #ORD-2025-001 ha sido creada',
      time: '5 min',
      unread: true,
    },
    {
      id: 2,
      title: 'Tarea completada',
      message: 'Instalación en Calle 123 completada',
      time: '15 min',
      unread: true,
    },
    {
      id: 3,
      title: 'Stock bajo',
      message: 'Producto "Cable UTP" tiene stock bajo',
      time: '1 hora',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 p-3 border-b border-sidebar-border">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 p-0 relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-2 top-0 w-80 rounded-lg border bg-background shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notificaciones</h3>
                    <p className="text-sm text-muted-foreground">
                      Tienes {unreadCount} notificaciones sin leer
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer',
                          notification.unread && 'bg-muted/30'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">
                            {notification.time}
                          </span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-nidia-blue rounded-full mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas las notificaciones
                    </Button>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <Button
          variant="ghost"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="h-9 w-9 p-0 relative"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nidia-green to-nidia-purple">
            <span className="text-xs font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          {unreadCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-sidebar" />
          )}
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
    <div className="border-b border-sidebar-border p-4 space-y-3">
      {/* User section */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent"
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-nidia-green to-nidia-purple">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-sidebar" />
            )}
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

      {/* Actions row */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="flex-1 h-9"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4 mr-2" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          <span className="text-xs">{isDark ? 'Claro' : 'Oscuro'}</span>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 px-3 relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notificaciones</h3>
                    <p className="text-sm text-muted-foreground">
                      Tienes {unreadCount} notificaciones sin leer
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer',
                          notification.unread && 'bg-muted/30'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">
                            {notification.time}
                          </span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-nidia-blue rounded-full mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas las notificaciones
                    </Button>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

