import api from '../api';

// API Response wrapper type
export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardMetrics {
  customers: {
    total: number;
    leads: number;
    prospects: number;
    active: number;
    conversionRate: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  sales: {
    totalRevenue: number;
    averageTicket: number;
    byStatus: {
      completed: number;
      pending: number;
      inProgress: number;
    };
  };
  performance: {
    leadsToOrders: number;
    ordersToSales: number;
    averageDaysToClose: number;
  };
}

export interface UserDashboardMetrics extends DashboardMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  period: {
    from: string;
    to: string;
  };
}

export interface UsersComparison {
  period: {
    from: string;
    to: string;
  };
  users: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    customers: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  }>;
  totals: {
    customers: number;
    orders: number;
    revenue: number;
  };
}

export interface RevenueStatistics {
  period: string;
  orderCount: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  totalValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string | null;
  type: string | null;
  price: number;
  imageUrl: string | null;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export const dashboardApi = {
  getMetrics: async (days?: number): Promise<DashboardMetrics> => {
    const response = await api.get<ApiResponseDto<DashboardMetrics>>('/dashboard/metrics', {
      params: { days },
    });
    return response.data.data;
  },

  getUserMetrics: async (userId: string, days?: number): Promise<UserDashboardMetrics> => {
    const response = await api.get<ApiResponseDto<UserDashboardMetrics>>(
      `/dashboard/users/${userId}/metrics`,
      {
        params: { days },
      },
    );
    return response.data.data;
  },

  getUsersComparison: async (days?: number): Promise<UsersComparison> => {
    const response = await api.get<ApiResponseDto<UsersComparison>>('/dashboard/users/comparison', {
      params: { days },
    });
    return response.data.data;
  },

  getRevenue: async (days?: number): Promise<RevenueStatistics[]> => {
    const response = await api.get<ApiResponseDto<RevenueStatistics[]>>('/dashboard/revenue', {
      params: { days },
    });
    return response.data.data;
  },

  getOrdersByStatus: async (days?: number): Promise<OrdersByStatus[]> => {
    const response = await api.get<ApiResponseDto<OrdersByStatus[]>>('/dashboard/orders-by-status', {
      params: { days },
    });
    return response.data.data;
  },

  getTopProducts: async (days?: number, limit?: number): Promise<TopProduct[]> => {
    const response = await api.get<ApiResponseDto<TopProduct[]>>('/dashboard/top-products', {
      params: { days, limit },
    });
    return response.data.data;
  },
};

