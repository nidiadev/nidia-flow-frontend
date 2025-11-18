import api from '../api';

export interface ModuleTenantAssignment {
  id: string;
  moduleId: string;
  tenantId: string;
  isEnabled: boolean;
  startsAt?: string;
  endsAt?: string;
  reason?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    name: string;
    displayName: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  assignedByUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface SubModuleTenantAssignment {
  id: string;
  subModuleId: string;
  tenantId: string;
  isEnabled: boolean;
  startsAt?: string;
  endsAt?: string;
  reason?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  subModule?: {
    id: string;
    name: string;
    displayName: string;
    module?: {
      id: string;
      name: string;
      displayName: string;
    };
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  assignedByUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AssignModuleToTenantData {
  moduleId: string;
  tenantId: string;
  isEnabled?: boolean;
  startsAt?: string;
  endsAt?: string;
  reason?: string;
}

export interface AssignSubModuleToTenantData {
  subModuleId: string;
  tenantId: string;
  isEnabled?: boolean;
  startsAt?: string;
  endsAt?: string;
  reason?: string;
}

export const tenantAssignmentsApi = {
  // Module assignments
  assignModuleToTenant: async (data: AssignModuleToTenantData): Promise<ModuleTenantAssignment> => {
    const response = await api.post<{ data: ModuleTenantAssignment } | ModuleTenantAssignment>(
      '/tenant-assignments/module',
      data
    );
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as ModuleTenantAssignment;
    }
    return (response.data as { data: ModuleTenantAssignment }).data;
  },

  removeModuleFromTenant: async (moduleId: string, tenantId: string): Promise<void> => {
    await api.delete(`/tenant-assignments/module/${moduleId}/${tenantId}`);
  },

  getTenantModuleAssignments: async (tenantId: string): Promise<ModuleTenantAssignment[]> => {
    const response = await api.get<{ data: ModuleTenantAssignment[] } | ModuleTenantAssignment[]>(
      `/tenant-assignments/tenant/${tenantId}/modules`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },

  getModuleTenantAssignments: async (moduleId: string): Promise<ModuleTenantAssignment[]> => {
    const response = await api.get<{ data: ModuleTenantAssignment[] } | ModuleTenantAssignment[]>(
      `/tenant-assignments/module/${moduleId}/tenants`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },

  // SubModule assignments
  assignSubModuleToTenant: async (
    data: AssignSubModuleToTenantData
  ): Promise<SubModuleTenantAssignment> => {
    const response = await api.post<
      { data: SubModuleTenantAssignment } | SubModuleTenantAssignment
    >('/tenant-assignments/submodule', data);
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as SubModuleTenantAssignment;
    }
    return (response.data as { data: SubModuleTenantAssignment }).data;
  },

  removeSubModuleFromTenant: async (subModuleId: string, tenantId: string): Promise<void> => {
    await api.delete(`/tenant-assignments/submodule/${subModuleId}/${tenantId}`);
  },

  getTenantSubModuleAssignments: async (
    tenantId: string
  ): Promise<SubModuleTenantAssignment[]> => {
    const response = await api.get<
      { data: SubModuleTenantAssignment[] } | SubModuleTenantAssignment[]
    >(`/tenant-assignments/tenant/${tenantId}/submodules`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },

  getSubModuleTenantAssignments: async (
    subModuleId: string
  ): Promise<SubModuleTenantAssignment[]> => {
    const response = await api.get<
      { data: SubModuleTenantAssignment[] } | SubModuleTenantAssignment[]
    >(`/tenant-assignments/submodule/${subModuleId}/tenants`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },
};

