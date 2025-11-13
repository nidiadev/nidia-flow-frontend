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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            queryClient.setQueryData(queryKeys.auth.me(), currentUser);
          } else {
            // Token is invalid, clear it
            AuthService.clearTokens();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        AuthService.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [queryClient]);

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
            // Actualizar usuario después del refresh
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser) {
                setUser(currentUser);
                queryClient.setQueryData(queryKeys.auth.me(), currentUser);
              }
            } catch (error) {
              console.error('Error al obtener usuario después del refresh:', error);
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
      
      if (response.success) {
        console.log('✅ Login exitoso, usuario:', response.data.user);
        console.log('🔍 Rol del usuario:', response.data.user.role, 'systemRole:', response.data.user.systemRole);
        setUser(response.data.user);
        // Set user data in query cache
        queryClient.setQueryData(queryKeys.auth.me(), response.data.user);
        
        // Get redirect path from URL params if exists, or redirect based on role
        const searchParams = new URLSearchParams(window.location.search);
        const requestedRedirect = searchParams.get('redirect');
        
        // Determine redirect path based on user role
        // Check both role and systemRole for compatibility
        const userRole = response.data.user.role || response.data.user.systemRole;
        let redirectPath = '/dashboard';
        if (userRole === 'super_admin') {
          redirectPath = '/superadmin/dashboard';
        } else if (requestedRedirect) {
          redirectPath = requestedRedirect;
        }
        
        console.log('🚀 Redirigiendo a', redirectPath, 'para rol:', userRole);
        // Use window.location.href instead of router.push to ensure immediate redirect
        // and avoid middleware interception
        window.location.href = redirectPath;
        return { success: true };
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
        setUser(response.data.user);
        // Set user data in query cache
        queryClient.setQueryData(queryKeys.auth.me(), response.data.user);
        
        // Redirect based on role
        // Check both role and systemRole for compatibility
        const userRole = response.data.user.role || response.data.user.systemRole;
        const redirectPath = userRole === 'super_admin' 
          ? '/superadmin/dashboard' 
          : '/dashboard';
        console.log('🚀 Registro exitoso, redirigiendo a', redirectPath, 'para rol:', userRole);
        window.location.href = redirectPath;
        return { success: true };
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