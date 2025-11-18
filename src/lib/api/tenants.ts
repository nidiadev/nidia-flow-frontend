import api from '../api';
import { ApiResponse, PaginationMeta } from '../api';

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  companyLegalName?: string;
  taxId?: string;
  industry?: string;
  companySize?: string;
  planType: string;
  planStatus: string;
  billingEmail: string;
  billingContactName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  paymentMethod?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
  currentUsers: number;
  maxUsers: number;
  maxStorageGb?: number;
  maxMonthlyEmails?: number;
  maxMonthlyWhatsapp?: number;
  maxMonthlyApiCalls?: number;
  currentStorageGb?: number;
  currentMonthlyEmails?: number;
  currentMonthlyWhatsapp?: number;
  currentMonthlyApiCalls?: number;
  trialEndsAt?: string;
  subscriptionStartsAt?: string;
  subscriptionEndsAt?: string;
  lastActivityAt?: string;
  lastBillingDate?: string;
  nextBillingDate?: string;
  provisionedAt?: string;
  referralSource?: string;
  notes?: string;
  enabledModules?: string[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  companyLegalName?: string;
  taxId?: string;
  industry?: string;
  companySize?: string;
  billingEmail: string;
  billingContactName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  paymentMethod?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  planType?: string;
  referralSource?: string;
  notes?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListTenantsResponse {
  data: Tenant[];
  pagination?: PaginationMeta;
}

export interface UpdateTenantStatusDto {
  isActive: boolean;
  reason?: string;
}

// API Service
export const tenantsApi = {
  // List all tenants
  list: async (params?: ListTenantsParams): Promise<ListTenantsResponse> => {
    const response = await api.get<ApiResponse<Tenant[]>>('/tenants', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
      },
    });
    // Handle both wrapped and direct responses
    const responseData = response.data;
    
    // Si la respuesta tiene la estructura { success: true, data: [...], pagination: {...} }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return {
        data: Array.isArray(responseData.data) ? responseData.data : [],
        pagination: responseData.pagination,
      };
    }
    
    // Si es un array directo
    if (Array.isArray(responseData)) {
      return {
        data: responseData,
        pagination: undefined,
      };
    }
    
    // Fallback
    return {
      data: [],
      pagination: undefined,
    };
  },

  // Get tenant by ID
  getById: async (id: string): Promise<Tenant> => {
    const response = await api.get<ApiResponse<Tenant>>(`/tenants/${id}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  // Get tenant by slug
  getBySlug: async (slug: string): Promise<Tenant> => {
    const response = await api.get<ApiResponse<Tenant>>(`/tenants/${slug}`);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  // Create tenant
  create: async (data: CreateTenantDto): Promise<Tenant> => {
    const response = await api.post<ApiResponse<Tenant>>('/tenants', data);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  // Update tenant
  update: async (id: string, data: UpdateTenantDto): Promise<Tenant> => {
    const response = await api.put<ApiResponse<Tenant>>(`/tenants/${id}`, data);
    const responseData = response.data;
    return responseData.data || responseData;
  },

  // Update tenant status
  updateStatus: async (id: string, data: UpdateTenantStatusDto): Promise<void> => {
    await api.put(`/tenants/${id}/status`, data);
  },

  // Delete tenant (if endpoint exists)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`);
  },

      // Get tenant usage
      getUsage: async (id: string) => {
        const response = await api.get(`/tenants/${id}/usage`);
        return response.data;
      },

      // Get dashboard statistics
      getDashboardStats: async () => {
        const response = await api.get<ApiResponse<any>>('/tenants/stats/dashboard');
        const responseData = response.data;
        return responseData.data || responseData;
      },

      // Validate slug availability
      validateSlug: async (slug: string): Promise<{ available: boolean; message: string }> => {
        const response = await api.get<{ available: boolean; message: string }>(`/tenants/validate-slug/${slug}`);
        return response.data;
      },
    };

