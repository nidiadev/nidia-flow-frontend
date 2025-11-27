import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// JWT token utilities (shared with auth.ts)
// IMPORTANTE: Esta interfaz debe coincidir con JwtPayload del backend
interface JWTPayload {
  // Campos estándar JWT
  exp?: number;
  iat?: number;
  
  // Identificadores de usuario
  sub: string; // ID del usuario en la BD del tenant (para operaciones en tenant DB)
  email: string;
  superAdminUserId?: string; // ID del usuario en SuperAdmin DB (para referencias y auditoría)
  tenantUserId?: string; // ID del usuario en Tenant DB (alias de sub, para claridad)
  
  // Información del tenant
  tenantId?: string; // SIEMPRE presente para usuarios de tenant (nunca null)
  tenantSlug?: string; // Slug del tenant para URLs amigables (ej: "mi-empresa")
  dbName?: string; // SIEMPRE presente para usuarios de tenant: "tenant_{uuid}_{env}"
  
  // Roles y permisos
  systemRole: string; // 'super_admin' | 'tenant_admin' | 'tenant_user' | 'support'
  role?: string; // Rol dentro del tenant: 'admin' | 'manager' | 'sales' | etc (solo para tenant_user)
  permissions?: string[]; // Permisos específicos del usuario
  
  // Campos adicionales (para compatibilidad)
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

// Check if token is expired or will expire soon
function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;
  
  return currentTime >= (expirationTime - bufferTime);
}

// Enhanced API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// Create axios instance with enhanced config
// Direct connection to backend - no proxy
// Ensure we always use an absolute URL, never a relative one
export const getApiBaseURL = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If no URL is set or it's a relative URL (starts with /), use default
  if (!envUrl || envUrl.startsWith('/')) {
    return 'http://localhost:4001/api/v1';
  }
  
  // Ensure it ends with /api/v1 if it doesn't already
  if (!envUrl.includes('/api/v1')) {
    return envUrl.endsWith('/') ? `${envUrl}api/v1` : `${envUrl}/api/v1`;
  }
  
  return envUrl;
};

export const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000, // Increased timeout for better UX
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request ID for tracking
let requestId = 0;
const generateRequestId = () => `req_${Date.now()}_${++requestId}`;

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
    retryConfig?: Partial<RetryConfig>;
  }
}

// ============================================
// SISTEMA CENTRALIZADO DE REFRESH TOKEN
// ============================================
// Evita múltiples refreshes simultáneos que causan bucles
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken?: string } | null> | null = null;
const pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];
    
/**
 * Función centralizada para refrescar token
 * Garantiza que solo haya un refresh en curso, otros requests esperan
 */
async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string } | null> {
  // Si ya hay un refresh en curso, retornar la misma promesa
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Iniciar nuevo refresh
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        console.log('❌ No hay refresh token disponible');
        return null;
      }

      // Verificar si el refresh token está expirado
      if (isTokenExpired(refreshTokenValue, 0)) {
        console.log('❌ Refresh token expirado');
        return null;
      }

              const refreshUrl = getApiBaseURL();
              const response = await axios.post(
                `${refreshUrl}/auth/refresh`,
        { refreshToken: refreshTokenValue }
              );
              
              const backendResponse = response.data;
      const accessToken = backendResponse.accessToken || backendResponse.data?.accessToken;
              const newRefreshToken = backendResponse.refreshToken || backendResponse.data?.refreshToken;
              
      if (accessToken) {
        // Guardar tokens
        localStorage.setItem('accessToken', accessToken);
                
        // Actualizar cookies
                const isProduction = process.env.NODE_ENV === 'production';
                const cookieOptions = isProduction 
                  ? 'secure; samesite=strict; path=/' 
                  : 'samesite=lax; path=/';
                const accessTokenExpiry = 15 * 60; // 15 minutos
        document.cookie = `accessToken=${accessToken}; ${cookieOptions}; max-age=${accessTokenExpiry}`;
                
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken);
                  const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 días
                  document.cookie = `refreshToken=${newRefreshToken}; ${cookieOptions}; max-age=${refreshTokenExpiry}`;
                }
                
        console.log('✅ Token refrescado exitosamente');
        
        // Resolver todos los requests pendientes
        pendingRequests.forEach(({ resolve }) => resolve(accessToken));
        pendingRequests.length = 0;

        return { accessToken, refreshToken: newRefreshToken };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error al refrescar token:', error);
      
      // Limpiar tokens
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('tenantId');
              
      // Limpiar cookies
      if (typeof window !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }

      // Rechazar todos los requests pendientes
      pendingRequests.forEach(({ reject }) => reject(error));
      pendingRequests.length = 0;

      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
            }
  })();

  return refreshPromise;
}

/**
 * Obtener token válido, refrescando si es necesario
 * Si hay un refresh en curso, espera a que termine
 */
async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return null;
  }

  // Si el token está expirado o próximo a expirar, intentar refrescar
  if (isTokenExpired(token)) {
    // Si ya hay un refresh en curso, esperar a que termine
    if (isRefreshing && refreshPromise) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      });
    }

    // Iniciar nuevo refresh
    const result = await refreshAccessToken();
    return result?.accessToken || null;
  }

  return token;
}

// Request interceptor with enhanced logging and auth
api.interceptors.request.use(
  async (config) => {
    // Add request ID for tracking
    config.metadata = { requestId: generateRequestId(), startTime: Date.now() };
    
    // Add auth token - NO refrescar aquí, solo agregar el token válido
    // El refresh se maneja en el response interceptor para evitar condiciones de carrera
    if (typeof window !== 'undefined') {
      const token = await getValidToken();
      
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      } else if (!config.url?.includes('/auth/')) {
        // Si no hay token válido y no es un endpoint de auth, redirigir a login
        // Esto evita hacer requests sin autenticación
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const redirectPath = currentPath !== '/login' ? currentPath : undefined;
          const loginUrl = redirectPath 
            ? `/login?expired=true&redirect=${encodeURIComponent(redirectPath)}`
            : '/login?expired=true';
          window.location.href = loginUrl;
        }
        return Promise.reject(new Error('No valid token available'));
      }
    }

    // Add tenant context if available
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('tenantId');
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      const duration = response.config.metadata ? Date.now() - response.config.metadata.startTime : 0;
      console.log(`✅ API Response [${response.config.metadata?.requestId}]:`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean; 
      _retryCount?: number;
      metadata?: { requestId: string; startTime: number };
    };

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      const duration = originalRequest.metadata ? Date.now() - originalRequest.metadata.startTime : 0;
      console.error(`❌ API Error [${originalRequest.metadata?.requestId}]:`, {
        status: error.response?.status,
        duration: `${duration}ms`,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token refresh
    // Don't try to refresh token for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/forgot-password') ||
                          originalRequest.url?.includes('/auth/reset-password');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Usar la función centralizada de refresh que evita múltiples refreshes simultáneos
        const result = await refreshAccessToken();
        
        if (result?.accessToken) {
            // Update authorization header and retry
            if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            }
            
            return api(originalRequest);
        } else {
          // Refresh failed, redirect to login
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantId');
        
        // Clear cookies
        if (typeof window !== 'undefined') {
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        
        // Show error message
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        
        // Redirect to login with expired flag
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const redirectPath = currentPath !== '/login' ? currentPath : undefined;
          const loginUrl = redirectPath 
            ? `/login?expired=true&redirect=${encodeURIComponent(redirectPath)}`
            : '/login?expired=true';
          window.location.href = loginUrl;
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Implement retry logic for network errors and 5xx errors
    const retryConfig = { ...defaultRetryConfig, ...(originalRequest as any).retryConfig };
    const shouldRetry = retryConfig.retryCondition?.(error) && 
                       (originalRequest._retryCount || 0) < retryConfig.retries;

    if (shouldRetry) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Exponential backoff delay
      const delay = retryConfig.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
      
      console.log(`🔄 Retrying request [${originalRequest.metadata?.requestId}] (${originalRequest._retryCount}/${retryConfig.retries}) in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // Handle different error types with user-friendly messages
    handleApiError(error);
    
    return Promise.reject(error);
  }
);

// Enhanced error handling with user notifications
function handleApiError(error: AxiosError) {
  const response = error.response;
  const data = response?.data as ApiResponse;

  // Network errors
  if (!response) {
    toast.error('Error de conexión. Verifica tu conexión a internet.');
    return;
  }

  // Handle specific status codes
  switch (response.status) {
    case 400:
      if (data?.errors && data.errors.length > 0) {
        // Show validation errors
        data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(data?.message || 'Solicitud inválida');
      }
      break;
      
    case 401:
      // 401 is handled by the interceptor above, but if we get here, redirect
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const redirectPath = currentPath !== '/login' ? currentPath : undefined;
        const loginUrl = redirectPath 
          ? `/login?expired=true&redirect=${encodeURIComponent(redirectPath)}`
          : '/login?expired=true';
        window.location.href = loginUrl;
      }
      break;
      
    case 403:
      toast.error('No tienes permisos para realizar esta acción');
      // No redirigir automáticamente en 403 - dejar que el componente maneje el error
      // Solo redirigir si estamos en una ruta de autenticación
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/login') || currentPath.startsWith('/register')) {
          // Ya estamos en login/register, no redirigir
          break;
        }
        // No redirigir desde páginas de contenido - mostrar el error y dejar que el usuario decida
      }
      break;
      
    case 404:
      toast.error('Recurso no encontrado');
      // No redirigir en 404 - dejar que el componente muestre el estado vacío
      break;
      
    case 409:
      toast.error(data?.message || 'Conflicto en los datos');
      break;
      
    case 422:
      toast.error(data?.message || 'Datos de entrada inválidos');
      break;
      
    case 429:
      toast.error('Demasiadas solicitudes. Intenta nuevamente en unos minutos.');
      break;
      
    case 500:
      toast.error('Error interno del servidor. Intenta nuevamente.');
      break;
      
    case 502:
    case 503:
    case 504:
      toast.error('Servicio temporalmente no disponible. Intenta nuevamente.');
      break;
      
    default:
      toast.error(data?.message || 'Ha ocurrido un error inesperado');
  }
}

// Enhanced API client with typed methods
export class ApiClient {
  static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  static async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

// Utility function to create requests with custom retry config
export function createRequestWithRetry(retryConfig: Partial<RetryConfig>) {
  return {
    get: <T = any>(url: string, config?: AxiosRequestConfig) => 
      api.get<ApiResponse<T>>(url, { ...config, retryConfig }),
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      api.post<ApiResponse<T>>(url, data, { ...config, retryConfig }),
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      api.put<ApiResponse<T>>(url, data, { ...config, retryConfig }),
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      api.patch<ApiResponse<T>>(url, data, { ...config, retryConfig }),
    delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
      api.delete<ApiResponse<T>>(url, { ...config, retryConfig }),
  };
}

export default api;