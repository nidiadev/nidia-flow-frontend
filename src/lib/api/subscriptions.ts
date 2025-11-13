import api from '../api';
import { ApiResponse } from '../api';

// Types
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  billingCycle: string;
  amount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  trialStart?: string;
  trialEnd?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  plan?: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface ListSubscriptionsParams {
  page?: number;
  limit?: number;
  status?: string;
  tenantId?: string;
}

// API Service
export const subscriptionsApi = {
  list: async (params?: ListSubscriptionsParams): Promise<{ data: Subscription[]; pagination: any }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await api.get<ApiResponse<Subscription[]>>(
        `/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      const responseData = response.data;
      
      // Handle different response structures
      if (responseData?.success && responseData?.data) {
        return {
          data: Array.isArray(responseData.data) ? responseData.data : [],
          pagination: responseData.pagination || {},
        };
      }
      
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          pagination: {},
        };
      }
      
      console.warn('Unexpected response structure:', responseData);
      return { data: [], pagination: {} };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },
  
  getById: async (id: string): Promise<Subscription> => {
    const response = await api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },
  
  update: async (id: string, data: Partial<Subscription>): Promise<Subscription> => {
    const response = await api.put<ApiResponse<Subscription>>(`/subscriptions/${id}`, data);
    const responseData = response.data;
    return responseData.data || responseData;
  },
};

