import api from '../api';

export interface SubModule {
  id: string;
  moduleId: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
  permissions?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    name: string;
    displayName: string;
  };
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
}

export interface SubModuleWithPlanStatus extends SubModule {
  planStatus?: Array<{
    planId: string;
    planName: string;
    planDisplayName: string;
    isEnabled: boolean;
  }>;
}

export interface CreateSubModuleData {
  moduleId: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  path?: string;
  sortOrder?: number;
  isActive?: boolean;
  isVisible?: boolean;
  permissions?: string[];
  metadata?: any;
}

export interface UpdateSubModuleData extends Partial<CreateSubModuleData> {
  moduleId?: never; // Cannot update moduleId
}

export interface AssignSubModuleToPlanData {
  subModuleId: string;
  planId: string;
  isEnabled?: boolean;
}

export const subModulesApi = {
  list: async (moduleId?: string, includeInactive = false): Promise<SubModule[]> => {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    params.append('includeInactive', String(includeInactive));
    
    const response = await api.get<{ data: SubModule[] } | SubModule[]>(
      `/submodules?${params.toString()}`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  },

  get: async (id: string): Promise<SubModule> => {
    const response = await api.get<{ data: SubModule }>(`/submodules/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateSubModuleData): Promise<SubModule> => {
    const response = await api.post<{ data: SubModule } | SubModule>('/submodules', data);
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as SubModule;
    }
    return (response.data as { data: SubModule }).data;
  },

  update: async (id: string, data: UpdateSubModuleData): Promise<SubModule> => {
    const response = await api.put<{ data: SubModule } | SubModule>(`/submodules/${id}`, data);
    if (response.data && 'id' in response.data && !('data' in response.data)) {
      return response.data as SubModule;
    }
    return (response.data as { data: SubModule }).data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/submodules/${id}`);
  },

  getWithPlanStatus: async (): Promise<SubModuleWithPlanStatus[]> => {
    const response = await api.get<{ data: SubModuleWithPlanStatus[] }>(
      '/submodules/with-plan-status'
    );
    return response.data.data || response.data;
  },

  assignToPlan: async (data: AssignSubModuleToPlanData): Promise<void> => {
    await api.post('/submodules/assign-to-plan', data);
  },

  removeFromPlan: async (subModuleId: string, planId: string): Promise<void> => {
    await api.delete(`/submodules/assign-to-plan/${subModuleId}/${planId}`);
  },
};

