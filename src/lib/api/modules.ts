import api from '../api';

export interface SubModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  permissions?: string[];
}

export interface Module {
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
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  subModules?: SubModule[];
  planAssignments?: Array<{
    id: string;
    planId: string;
    isEnabled: boolean;
    plan: {
      id: string;
      name: string;
      displayName: string;
    };
  }>;
  tenantAssignments?: Array<{
    id: string;
    tenantId: string;
    isEnabled: boolean;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

export interface ModuleWithPlanStatus extends Module {
  planStatus?: Array<{
    planId: string;
    planName: string;
    planDisplayName: string;
    isEnabled: boolean;
  }>;
}

export interface CreateModuleData {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
  isVisible?: boolean;
  metadata?: any;
}

export interface UpdateModuleData extends Partial<CreateModuleData> {}

export interface AssignModuleToPlanData {
  moduleId: string;
  planId: string;
  isEnabled?: boolean;
}

export const modulesApi = {
  list: async (includeInactive = false): Promise<Module[]> => {
    const response = await api.get<{ data: Module[] } | Module[]>(
      `/modules?includeInactive=${includeInactive}`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },

  get: async (id: string): Promise<Module> => {
    const response = await api.get<{ data: Module }>(`/modules/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateModuleData): Promise<Module> => {
    const response = await api.post<{ data: Module } | Module>('/modules', data);
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as Module;
    }
    return (response.data as { data: Module }).data;
  },

  update: async (id: string, data: UpdateModuleData): Promise<Module> => {
    const response = await api.put<{ data: Module } | Module>(`/modules/${id}`, data);
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as Module;
    }
    return (response.data as { data: Module }).data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/modules/${id}`);
  },

  getWithPlanStatus: async (): Promise<ModuleWithPlanStatus[]> => {
    const response = await api.get<{ data: ModuleWithPlanStatus[] }>(
      '/modules/with-plan-status'
    );
    return response.data.data || response.data;
  },

  assignToPlan: async (data: AssignModuleToPlanData): Promise<void> => {
    await api.post('/modules/assign-to-plan', data);
  },

  removeFromPlan: async (moduleId: string, planId: string): Promise<void> => {
    await api.delete(`/modules/${moduleId}/plans/${planId}`);
  },

  getModulesForPlan: async (planId: string): Promise<Module[]> => {
    const response = await api.get<{ data: Module[] } | Module[]>(`/modules/plans/${planId}`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },
};

