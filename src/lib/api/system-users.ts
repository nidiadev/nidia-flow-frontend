import api from '../api';

export interface SystemUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  systemRole: 'super_admin' | 'support';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  systemRole: 'super_admin' | 'support';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UpdateSystemUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  systemRole?: 'super_admin' | 'support';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface SystemUsersStats {
  total: number;
  superAdmins: number;
  support: number;
  active: number;
  inactive: number;
}

export const systemUsersApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    systemRole?: 'super_admin' | 'support';
    isActive?: boolean;
  }): Promise<{ data: SystemUser[]; pagination?: any }> {
    const response = await api.get('/system-users', { params });
    const responseData = response.data;
    // Handle different response structures
    if (responseData?.data) {
      return responseData;
    }
    return { data: Array.isArray(responseData) ? responseData : [], pagination: responseData?.pagination };
  },

  async getById(id: string): Promise<SystemUser> {
    const response = await api.get(`/system-users/${id}`);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async create(data: CreateSystemUserDto): Promise<SystemUser> {
    const response = await api.post('/system-users', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async update(id: string, data: UpdateSystemUserDto): Promise<SystemUser> {
    const response = await api.patch(`/system-users/${id}`, data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/system-users/${id}`);
  },

  async getStats(): Promise<SystemUsersStats> {
    const response = await api.get('/system-users/stats');
    const responseData = response.data;
    return responseData?.data || responseData;
  },
};

