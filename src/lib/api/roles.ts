import api from '../api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
  isSystemRole?: boolean;
}

export interface PermissionsByModule {
  crm: string[];
  orders: string[];
  tasks: string[];
  products: string[];
  accounting: string[];
  reports: string[];
  users: string[];
  settings: string[];
}

export const rolesApi = {
  async list(): Promise<Role[]> {
    const response = await api.get('/roles');
    const responseData = response.data;
    return Array.isArray(responseData) ? responseData : responseData?.data || [];
  },

  async getById(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async create(data: CreateRoleDto): Promise<Role> {
    const response = await api.post('/roles', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    const response = await api.patch(`/roles/${id}`, data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  async getPermissions(): Promise<PermissionsByModule> {
    const response = await api.get('/roles/permissions');
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async createSystemRoles(): Promise<{ message: string }> {
    const response = await api.post('/roles/system/create');
    const responseData = response.data;
    return responseData?.data || responseData;
  },
};

