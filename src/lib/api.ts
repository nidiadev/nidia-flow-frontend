import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// JWT token utilities (shared with auth.ts)
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

// Request interceptor with enhanced logging and auth
api.interceptors.request.use(
  async (config) => {
    // Add request ID for tracking
    config.metadata = { requestId: generateRequestId(), startTime: Date.now() };
    
    // Add auth token and check expiration
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // Check if token is expired or about to expire (within 1 minute)
        const isExpired = isTokenExpired(token);
        
        if (isExpired) {
          // Try to refresh token before making the request
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken && !isTokenExpired(refreshToken, 0)) {
            try {
              const refreshUrl = getApiBaseURL();
              const response = await axios.post(
                `${refreshUrl}/auth/refresh`,
                { refreshToken }
              );
              
              const backendResponse = response.data;
              const newAccessToken = backendResponse.accessToken || backendResponse.data?.accessToken;
              const newRefreshToken = backendResponse.refreshToken || backendResponse.data?.refreshToken;
              
              if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
                
                // Actualizar cookies también
                const isProduction = process.env.NODE_ENV === 'production';
                const cookieOptions = isProduction 
                  ? 'secure; samesite=strict; path=/' 
                  : 'samesite=lax; path=/';
                const accessTokenExpiry = 15 * 60; // 15 minutos
                document.cookie = `accessToken=${newAccessToken}; ${cookieOptions}; max-age=${accessTokenExpiry}`;
                
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken);
                  const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 días
                  document.cookie = `refreshToken=${newRefreshToken}; ${cookieOptions}; max-age=${refreshTokenExpiry}`;
                }
                
                config.headers.Authorization = `Bearer ${newAccessToken}`;
              } else {
                // Refresh failed, clear tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                throw new Error('Token refresh failed');
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('tenantId');
              
              if (typeof window !== 'undefined' && !config.url?.includes('/auth/')) {
                window.location.href = '/login?expired=true';
              }
              
              return Promise.reject(refreshError);
            }
          } else {
            // Both tokens expired, clear and redirect
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tenantId');
            
            if (typeof window !== 'undefined' && !config.url?.includes('/auth/')) {
              window.location.href = '/login?expired=true';
            }
            
            return Promise.reject(new Error('Token expired'));
          }
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshUrl = getApiBaseURL();
          const response = await axios.post(
            `${refreshUrl}/auth/refresh`,
            { refreshToken }
          );
          
          // Backend may return { accessToken } directly or wrapped
          const backendResponse = response.data;
          const accessToken = backendResponse.accessToken || backendResponse.data?.accessToken;
          
          const newRefreshToken = backendResponse.refreshToken || backendResponse.data?.refreshToken;
          
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            
            // Actualizar cookies también
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
            
            // Update authorization header and retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return api(originalRequest);
          }
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
      // Redirect to dashboard if unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/dashboard';
      }
      break;
      
    case 404:
      toast.error('Recurso no encontrado');
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