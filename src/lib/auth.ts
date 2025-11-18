import { api } from './api';
import { z } from 'zod';
import axios from 'axios';
import { getApiBaseURL } from './api';

// JWT token utilities
interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

// Decode JWT token without verification (client-side only)
function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Check if token is expired or will expire soon (within 1 minute)
function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;
  
  return currentTime >= (expirationTime - bufferTime);
}

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  companyName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
  slug: z.string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export interface SubModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  permissions?: string[];
}

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path: string;
  category?: string;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  metadata?: any;
  subModules?: SubModule[];
}

export interface PlanLimits {
  maxUsers?: number;
  maxStorageGb?: number;
  maxMonthlyEmails?: number;
  maxMonthlyWhatsapp?: number;
  maxMonthlyApiCalls?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  systemRole?: string; // Rol del sistema (super_admin, support, billing_admin, tenant_admin)
  tenantId: string;
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  modules?: Module[]; // Módulos disponibles con su estado de habilitación
  limits?: PlanLimits | null; // Límites del plan actual
}

export interface AuthResponse {
  success: boolean;
  data: {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tenantId?: string;
    email?: string;
    estimatedTime?: string;
  };
  message?: string;
  status?: 'success' | 'provisioning' | 'failed';
}

// Auth service
export class AuthService {
  static async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Backend returns { accessToken, refreshToken, user } directly
      // We need to wrap it in the expected format
      const backendResponse = response.data;
      
      if (backendResponse.accessToken && backendResponse.refreshToken) {
        this.setTokens(backendResponse.accessToken, backendResponse.refreshToken);
        
        // Transform backend response to frontend format
        // Priorizar systemRole sobre role para determinar el rol del usuario
        const systemRole = backendResponse.user.systemRole;
        const role = backendResponse.user.role || systemRole || '';
        
        console.log('🔍 Mapeando usuario del backend:', {
          systemRole,
          role: backendResponse.user.role,
          finalRole: role,
        });
        
        return {
          success: true,
          data: {
            user: {
              id: backendResponse.user.id,
              email: backendResponse.user.email,
              firstName: backendResponse.user.firstName || '',
              lastName: backendResponse.user.lastName || '',
              role: role,
              systemRole: systemRole, // Priorizar systemRole
              tenantId: backendResponse.user.tenantId || '',
              permissions: [], // Will be fetched separately if needed
              avatar: backendResponse.user.avatarUrl,
              isActive: true,
            },
            accessToken: backendResponse.accessToken,
            refreshToken: backendResponse.refreshToken,
            expiresIn: 900, // 15 minutes default
          },
        };
      }
      
      // If response doesn't match expected format, treat as error
      return {
        success: false,
        data: {} as any,
        message: 'Formato de respuesta inválido',
      };
    } catch (error: any) {
      // Handle error response
      const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      return {
        success: false,
        data: {} as any,
        message: errorMessage,
      };
    }
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', data);
      
      // Backend returns different formats based on provisioning status
      const backendResponse = response.data;
      
      // If provisioning is in progress, return provisioning status
      if (backendResponse.status === 'provisioning') {
        return {
          success: true,
          status: 'provisioning',
          data: {
            tenantId: backendResponse.tenantId,
            email: backendResponse.email,
            estimatedTime: backendResponse.estimatedTime,
          },
          message: backendResponse.message || 'Registro exitoso. Configurando tu espacio de trabajo...',
        };
      }
      
      // If registration completed immediately (shouldn't happen with async provisioning, but handle it)
      if (backendResponse.accessToken && backendResponse.refreshToken) {
        this.setTokens(backendResponse.accessToken, backendResponse.refreshToken);
        
        return {
          success: true,
          status: 'success',
          data: {
            user: {
              id: backendResponse.user.id,
              email: backendResponse.user.email,
              firstName: backendResponse.user.firstName || '',
              lastName: backendResponse.user.lastName || '',
              role: backendResponse.user.role || backendResponse.user.systemRole || '',
              systemRole: backendResponse.user.systemRole,
              tenantId: backendResponse.user.tenantId || '',
              permissions: [],
              avatar: backendResponse.user.avatarUrl,
              isActive: true,
            },
            accessToken: backendResponse.accessToken,
            refreshToken: backendResponse.refreshToken,
            expiresIn: 900,
          },
        };
      }
      
      return {
        success: false,
        data: {} as any,
        message: 'Formato de respuesta inválido',
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrarse';
      return {
        success: false,
        status: 'failed',
        data: {} as any,
        message: errorMessage,
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  static async forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  }

  static async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      // Check if token exists and is not expired
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      // If token is expired or about to expire, try to refresh it first
      if (isTokenExpired(accessToken)) {
        console.log('🔄 Token expirado, intentando refrescar...');
        const newToken = await this.refreshToken();
        if (!newToken) {
          console.log('❌ No se pudo refrescar el token');
          this.clearTokens();
          return null;
        }
      }

      const response = await api.get('/auth/me');
      const userData = response.data.data || response.data;
      
      // Transform backend user to frontend User format
      if (userData) {
        return {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || userData.systemRole || '',
          systemRole: userData.systemRole,
          tenantId: userData.tenantId || '',
          permissions: userData.permissions || [],
          avatar: userData.avatarUrl || userData.avatar,
          isActive: userData.isActive !== false,
          modules: userData.modules || [],
          limits: userData.limits || null,
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      // If 401 or 403, clear tokens and return null
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.clearTokens();
      }
      
      return null;
    }
  }

  static async refreshToken(): Promise<string | null> {
    try {
      const refreshTokenValue = this.getRefreshToken();
      if (!refreshTokenValue) {
        console.log('❌ No hay refresh token disponible');
        return null;
      }

      // Check if refresh token is expired
      if (isTokenExpired(refreshTokenValue, 0)) {
        console.log('❌ Refresh token expirado');
        this.clearTokens();
        return null;
      }

      const refreshUrl = getApiBaseURL();
      const response = await axios.post(
        `${refreshUrl}/auth/refresh`,
        { refreshToken: refreshTokenValue }
      );
      
      const backendResponse = response.data;
      
      // Backend may return { accessToken, refreshToken, user } or just { accessToken }
      const accessToken = backendResponse.accessToken || backendResponse.data?.accessToken;
      const newRefreshToken = backendResponse.refreshToken || backendResponse.data?.refreshToken;
      
      if (accessToken) {
        // Guardar ambos tokens usando setTokens para mantener consistencia
        if (newRefreshToken) {
          this.setTokens(accessToken, newRefreshToken);
        } else {
          this.setAccessToken(accessToken);
        }
        
        console.log('✅ Token refrescado exitosamente');
        console.log('🔍 Verificando tenantSlug en nuevo token...');
        const payload = decodeJWT(accessToken);
        if (payload?.tenantSlug) {
          console.log('✅ tenantSlug encontrado en nuevo token:', payload.tenantSlug);
        } else {
          console.warn('⚠️ tenantSlug no encontrado en nuevo token');
        }
        
        return accessToken;
      }
      
      return null;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      return null;
    }
  }

  // Token management
  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      console.log('💾 Guardando tokens...');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Also set as cookies for middleware access
      // Usar HttpOnly sería ideal pero requiere backend, por ahora usamos cookies normales
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = isProduction 
        ? 'secure; samesite=strict; path=/' 
        : 'samesite=lax; path=/';
      
      // Access token: 15 minutos (mismo que expiración del JWT)
      const accessTokenExpiry = 15 * 60; // 15 minutos en segundos
      document.cookie = `accessToken=${accessToken}; ${cookieOptions}; max-age=${accessTokenExpiry}`;
      
      // Refresh token: 7 días (mismo que expiración del refresh token)
      const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 días en segundos
      document.cookie = `refreshToken=${refreshToken}; ${cookieOptions}; max-age=${refreshTokenExpiry}`;
      
      console.log('✅ Tokens guardados en localStorage y cookies');
    }
  }

  static setAccessToken(accessToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = isProduction 
        ? 'secure; samesite=strict; path=/' 
        : 'samesite=lax; path=/';
      const accessTokenExpiry = 15 * 60; // 15 minutos
      document.cookie = `accessToken=${accessToken}; ${cookieOptions}; max-age=${accessTokenExpiry}`;
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear cookies
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Try to refresh if refresh token exists
      const refreshToken = this.getRefreshToken();
      if (refreshToken && !isTokenExpired(refreshToken, 0)) {
        // Token is expired but refresh token is valid
        // Will be refreshed on next API call
        return true;
      }
      // Both tokens expired
      this.clearTokens();
      return false;
    }
    
    return true;
  }

  // Get token expiration time
  static getTokenExpiration(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return null;
    
    return new Date(payload.exp * 1000);
  }

  // Check if token needs refresh (expires within 2 minutes)
  // Reducido a 2 minutos para refrescar más proactivamente y mantener la sesión
  static shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // Refrescar si expira en los próximos 2 minutos (120 segundos)
    return isTokenExpired(token, 120);
  }

  /**
   * Obtener el tenantSlug del JWT token
   * @returns El slug del tenant o null si no está disponible
   */
  static getTenantSlug(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = decodeJWT(token);
    if (!payload) return null;
    return payload.tenantSlug || null;
  }

  /**
   * Obtener el tenantId del JWT token
   * @returns El ID del tenant o null si no está disponible
   */
  static getTenantId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = decodeJWT(token);
    if (!payload) return null;
    return payload.tenantId || null;
  }
}