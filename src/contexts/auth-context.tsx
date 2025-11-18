'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, LoginData, RegisterData } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = !!user && AuthService.isAuthenticated();

  // Initialize auth state (solo una vez al montar)
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const currentUser = await AuthService.getCurrentUser();
          if (isMounted) {
            if (currentUser) {
              setUser(currentUser);
              queryClient.setQueryData(queryKeys.auth.me(), currentUser);
            } else {
              // Token is invalid, clear it
              AuthService.clearTokens();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          AuthService.clearTokens();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Periodic token refresh check (every 1 minute for proactive refresh)
  useEffect(() => {
    if (!isAuthenticated) return;

    let isRefreshing = false; // Prevenir múltiples refreshes simultáneos

    const checkTokenExpiration = async () => {
      // Evitar múltiples refreshes simultáneos
      if (isRefreshing) {
        console.log('⏳ Refresh ya en progreso, esperando...');
        return;
      }

      const accessToken = AuthService.getAccessToken();
      if (!accessToken) {
        return;
      }

      // Verificar si el token expira en los próximos 2 minutos (120 segundos)
      // Esto asegura que siempre tengamos un token válido
      if (AuthService.shouldRefreshToken()) {
        isRefreshing = true;
        console.log('🔄 Token próximo a expirar, refrescando automáticamente...');
        
        try {
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            console.log('✅ Token refrescado exitosamente');
            // Actualizar usuario después del refresh para obtener datos actualizados
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser) {
                setUser(currentUser);
                queryClient.setQueryData(queryKeys.auth.me(), currentUser);
                console.log('✅ Usuario actualizado después del refresh');
              } else {
                console.warn('⚠️ No se pudo obtener usuario después del refresh');
              }
            } catch (error) {
              console.error('❌ Error al obtener usuario después del refresh:', error);
            }
          } else {
            // Refresh failed, logout
            console.log('❌ Fallo al refrescar token, cerrando sesión');
            setUser(null);
            AuthService.clearTokens();
            queryClient.clear();
            router.push('/login?expired=true');
          }
        } catch (error) {
          console.error('Error al refrescar token:', error);
          setUser(null);
          AuthService.clearTokens();
          queryClient.clear();
          router.push('/login?expired=true');
        } finally {
          isRefreshing = false;
        }
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 1 minute (más frecuente para mantener sesión activa)
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, router, queryClient]);

  const login = async (credentials: LoginData) => {
    try {
      setIsLoading(true);
      console.log('🔐 Iniciando login...');
      const response = await AuthService.login(credentials);
      
      if (response.success && response.data.user) {
        const user = response.data.user;
        console.log('✅ Login exitoso, usuario:', user);
        console.log('🔍 Rol del usuario:', user.role, 'systemRole:', user.systemRole);
        setUser(user);
        // Set user data in query cache
        queryClient.setQueryData(queryKeys.auth.me(), user);
        
        // Get redirect path from URL params if exists, or redirect based on role
        const searchParams = new URLSearchParams(window.location.search);
        const requestedRedirect = searchParams.get('redirect');
        
        // Determine redirect path based on user role
        // Priorizar systemRole sobre role para determinar el tipo de usuario
        const userRole = user.systemRole || user.role;
        
        // IMPORTANTE: tenantSlug solo se usa para tenants, NO para superadmin
        // Superadmin no tiene tenantSlug y no lo necesita
        const isSuperAdmin = userRole === 'super_admin';
        const tenantSlug = !isSuperAdmin ? AuthService.getTenantSlug() : null;
        
        console.log('🔍 Información de usuario para redirección:', {
          systemRole: user.systemRole,
          role: user.role,
          userRole,
          isSuperAdmin,
          tenantSlug: isSuperAdmin ? 'N/A (superadmin)' : tenantSlug,
          requestedRedirect,
        });
        
        let redirectPath = '/dashboard';
        
        // Si es super_admin, siempre redirigir al panel de superadmin (sin usar tenantSlug)
        if (isSuperAdmin) {
          redirectPath = '/superadmin/dashboard';
          console.log('✅ Usuario es super_admin, redirigiendo a:', redirectPath);
        } else if (requestedRedirect) {
          // Si hay un redirect solicitado, verificar si necesita el slug (solo para tenants)
          if (tenantSlug && !requestedRedirect.startsWith(`/${tenantSlug}/`) && !requestedRedirect.startsWith('/superadmin/')) {
            // Agregar el slug al path si no lo tiene
            const pathWithoutSlash = requestedRedirect.startsWith('/') ? requestedRedirect.slice(1) : requestedRedirect;
            redirectPath = `/${tenantSlug}/${pathWithoutSlash}`;
          } else {
            redirectPath = requestedRedirect;
          }
        } else if (tenantSlug) {
          // Si hay tenantSlug, usar ruta con slug (solo para tenants)
          redirectPath = `/${tenantSlug}/dashboard`;
        }
        
        console.log('🚀 Redirigiendo a', redirectPath, 'para rol:', userRole, 'slug:', isSuperAdmin ? 'N/A' : tenantSlug);
        
        // Asegurar que los tokens se hayan guardado antes de redirigir
        // Los tokens ya se guardaron en AuthService.login, pero esperamos un momento
        // para asegurar que las cookies estén disponibles para el middleware
        // También dar tiempo para que los logs se guarden
        return new Promise<{ success: boolean; message?: string }>((resolve) => {
          // Guardar logs antes de redirigir
          if (typeof window !== 'undefined' && (window as any).getConsoleLogs) {
            // Forzar guardado de logs
            const logger = (window as any).__consoleLogger;
            if (logger && logger.saveLogs) {
              logger.saveLogs();
            }
          }
          
          setTimeout(() => {
            // Usar window.location.href para forzar una redirección completa
            // Esto evita problemas con el middleware y asegura que la página se recargue completamente
            window.location.href = redirectPath;
            resolve({ success: true });
          }, 500); // Aumentado a 500ms para dar tiempo a guardar logs
        });
      } else {
        console.log('❌ Login falló:', response.message);
        return { success: false, message: response.message || 'Error al iniciar sesión' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await AuthService.register(data);
      
      if (response.success) {
        // If provisioning is in progress, redirect to provisioning page
        if (response.status === 'provisioning' && response.data.tenantId) {
          console.log('🔄 Provisioning en progreso, redirigiendo a página de provisioning');
          window.location.href = `/provisioning/${response.data.tenantId}`;
          return { success: true };
        }
        
        // If registration completed immediately (shouldn't happen with async provisioning)
        if (response.data.user && response.data.accessToken) {
          setUser(response.data.user);
          // Set user data in query cache
          queryClient.setQueryData(queryKeys.auth.me(), response.data.user);
          
          // Redirect based on role
          const userRole = response.data.user.role || response.data.user.systemRole;
          const isSuperAdmin = userRole === 'super_admin';
          
          // IMPORTANTE: tenantSlug solo se usa para tenants, NO para superadmin
          const tenantSlug = !isSuperAdmin ? AuthService.getTenantSlug() : null;
          
          const redirectPath = isSuperAdmin
            ? '/superadmin/dashboard' 
            : (tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
          console.log('🚀 Registro exitoso, redirigiendo a', redirectPath, 'para rol:', userRole, 'slug:', isSuperAdmin ? 'N/A' : tenantSlug);
          window.location.href = redirectPath;
          return { success: true };
        }
        
        return { success: false, message: 'Respuesta inesperada del servidor' };
      } else {
        return { success: false, message: response.message || 'Error al registrarse' };
      }
    } catch (error: any) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al registrarse' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      // Clear all query cache on logout
      queryClient.clear();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (AuthService.isAuthenticated()) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        // Update query cache
        queryClient.setQueryData(queryKeys.auth.me(), currentUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}