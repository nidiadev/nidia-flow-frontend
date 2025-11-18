import api from '../api';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  OPERATOR = 'operator',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer',
}

export interface TenantUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  hireDate?: string;
  permissions?: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  hireDate?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  hireDate?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface InviteUserDto {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UsersListResponse {
  users: TenantUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  async list(params?: UsersListParams): Promise<UsersListResponse> {
    const response = await api.get('/users', { params });
    const responseData = response.data;
    // Handle different response structures
    if (responseData?.users) {
      return responseData;
    }
    if (responseData?.data) {
      return {
        users: Array.isArray(responseData.data) ? responseData.data : [],
        pagination: responseData.pagination,
      };
    }
    return {
      users: Array.isArray(responseData) ? responseData : [],
      pagination: responseData?.pagination,
    };
  },

  async getById(id: string): Promise<TenantUser> {
    const response = await api.get(`/users/${id}`);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async create(data: CreateUserDto): Promise<TenantUser> {
    const response = await api.post('/users', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async update(id: string, data: UpdateUserDto): Promise<TenantUser> {
    const response = await api.patch(`/users/${id}`, data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async invite(data: InviteUserDto): Promise<{ user: TenantUser; message: string }> {
    const response = await api.post('/users/invite', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async getProfile(): Promise<TenantUser> {
    const response = await api.get('/users/profile');
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateProfile(data: Partial<UpdateUserDto>): Promise<TenantUser> {
    const response = await api.patch('/users/profile', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },
};

