'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-40',
        className
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar clientes, órdenes, productos..."
            className="w-48 md:w-64 lg:w-80 rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="relative"
          aria-label="Toggle theme"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-nidia-green" />
            ) : (
              <Moon className="h-5 w-5 text-nidia-purple" />
            )}
          </motion.div>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          <AnimatePresence>
            {showNotifications && (
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
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nidia-green to-nidia-purple">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* User dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-background shadow-lg z-50 overflow-hidden"
              >
              <div className="p-4 border-b">
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {user?.role} • {user?.tenantId}
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
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside handlers */}
      <AnimatePresence>
        {(showNotifications || showUserMenu) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
}