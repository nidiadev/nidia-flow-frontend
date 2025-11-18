import api from '../api';
import { ApiResponse } from '../api';

// Types
export interface Plan {
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
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  createdAt: string;
  updatedAt: string;
}

// API Service
export const plansApi = {
  list: async (): Promise<Plan[]> => {
    try {
      const response = await api.get<ApiResponse<Plan[]>>('/plans');
      const responseData = response.data;
      console.log('Plans API response:', responseData);
      
      // Handle different response structures
      if (Array.isArray(responseData)) {
        return responseData;
      }
      
      if (responseData?.data) {
        return Array.isArray(responseData.data) ? responseData.data : [];
      }
      
      if (responseData?.success && responseData?.data) {
        return Array.isArray(responseData.data) ? responseData.data : [];
      }
      
      console.warn('Unexpected response structure:', responseData);
      return [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },
  
  get: async (id: string): Promise<Plan> => {
    const response = await api.get<ApiResponse<Plan>>(`/plans/${id}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  getById: async (id: string): Promise<Plan> => {
    const response = await api.get<ApiResponse<Plan>>(`/plans/${id}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },
  
  getByName: async (name: string): Promise<Plan> => {
    const response = await api.get<ApiResponse<Plan>>(`/plans/name/${name}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  create: async (data: Partial<Plan>): Promise<Plan> => {
    const response = await api.post<ApiResponse<Plan>>('/plans', data);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  update: async (id: string, data: Partial<Plan>): Promise<Plan> => {
    const response = await api.put<ApiResponse<Plan>>(`/plans/${id}`, data);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },
};

