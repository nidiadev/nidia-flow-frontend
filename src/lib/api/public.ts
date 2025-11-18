import api from '../api';
import { getApiBaseURL } from '../api';

// Public API endpoints (no authentication required)

export interface PublicPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  currency: string;
  maxUsers?: number;
  maxStorageGb?: number;
  maxMonthlyEmails?: number;
  maxMonthlyWhatsapp?: number;
  maxMonthlyApiCalls?: number;
  features?: any;
  enabledModules?: string[];
  badge?: string;
  badgeColor?: string;
  accentColor?: string;
  featuredFeatures?: string[];
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  moduleAssignments?: Array<{
    id: string;
    isEnabled: boolean;
    module: {
      id: string;
      name: string;
      displayName: string;
      description?: string;
      icon?: string;
      path: string;
    };
  }>;
  subModuleAssignments?: Array<{
    id: string;
    isEnabled: boolean;
    subModule: {
      id: string;
      name: string;
      displayName: string;
      description?: string;
      icon?: string;
      path?: string;
    };
  }>;
}

export interface PublicModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
  metadata?: {
    roadmap?: {
      status: 'available' | 'coming_soon' | 'planned';
      expectedDate?: string;
      description?: string;
    };
    features?: string[];
  };
  subModules?: Array<{
    id: string;
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    path?: string;
    sortOrder: number;
    isActive: boolean;
    isVisible: boolean;
  }>;
}

export const publicApi = {
  getPlans: async (): Promise<PublicPlan[]> => {
    try {
      // Usar getApiBaseURL para obtener la URL base correcta (ya incluye /api/v1)
      const baseURL = getApiBaseURL();
      const url = `${baseURL}/plans/public`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fetching plans from:', url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Plans response:', { 
          hasData: !!data.data, 
          dataLength: data.data?.length || 0,
          fullData: data 
        });
      }
      
      const plans = data.data || data || [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Returning plans:', plans.length);
      }
      
      return Array.isArray(plans) ? plans : [];
    } catch (error) {
      console.error('❌ Error fetching public plans:', error);
      return [];
    }
  },

  getModules: async (): Promise<PublicModule[]> => {
    try {
      // Usar getApiBaseURL para obtener la URL base correcta (ya incluye /api/v1)
      const baseURL = getApiBaseURL();
      const url = `${baseURL}/modules/public`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fetching modules from:', url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Modules response:', { 
          hasData: !!data.data, 
          dataLength: data.data?.length || 0 
        });
      }
      
      const modules = data.data || data || [];
      return Array.isArray(modules) ? modules : [];
    } catch (error) {
      console.error('❌ Error fetching public modules:', error);
      return [];
    }
  },
};

