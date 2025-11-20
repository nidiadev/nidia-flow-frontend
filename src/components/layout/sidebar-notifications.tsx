'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarNotificationsProps {
  isCollapsed: boolean;
}

export function SidebarNotifications({ isCollapsed }: SidebarNotificationsProps) {
  const [showNotifications, setShowNotifications] = useState(false);

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

  if (isCollapsed) {
    return (
      <div className="p-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 p-0 w-full relative"
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
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent relative"
        >
          <Bell className="h-4 w-4 shrink-0" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium">Notificaciones</p>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
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
  );
}

