import api from '../api';

// ============================================
// DEALS / PIPELINE
// ============================================

export interface Deal {
  id: string;
  name: string;
  customerId: string;
  customer?: {
    id: string;
    companyName: string;
    firstName: string;
    lastName: string;
  };
  stageId: string;
  stage?: {
    id: string;
    displayName: string;
    sortOrder: number;
    probability: number;
  };
  amount: number;
  currency: string;
  probability: number;
  status: 'open' | 'won' | 'lost';
  expectedCloseDate?: string;
  closedAt?: string;
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  contacts?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DealStage {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  probability: number;
  isActive: boolean;
  color?: string;
}

export interface CreateDealDto {
  name: string;
  customerId: string;
  stageId: string;
  amount: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  contactIds?: string[];
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateDealDto {
  name?: string;
  stageId?: string;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export const dealsApi = {
  // Get all deals
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    stageId?: string;
    assignedTo?: string;
    customerId?: string;
    search?: string;
  }) => {
    const response = await api.get('/crm/deals', { params });
    return response.data;
  },

  // Get deal by ID
  getById: async (id: string) => {
    const response = await api.get(`/crm/deals/${id}`);
    return response.data;
  },

  // Create deal
  create: async (data: CreateDealDto) => {
    const response = await api.post('/crm/deals', data);
    return response.data;
  },

  // Update deal
  update: async (id: string, data: UpdateDealDto) => {
    const response = await api.put(`/crm/deals/${id}`, data);
    return response.data;
  },

  // Delete deal
  delete: async (id: string) => {
    const response = await api.delete(`/crm/deals/${id}`);
    return response.data;
  },

  // Change deal stage
  changeStage: async (id: string, stageId: string) => {
    const response = await api.patch(`/crm/deals/${id}/stage`, { stageId });
    return response.data;
  },

  // Win deal
  win: async (id: string, data?: { notes?: string; closedAt?: string }) => {
    const response = await api.patch(`/crm/deals/${id}/win`, data || {});
    return response.data;
  },

  // Lose deal
  lose: async (id: string, reason: string, notes?: string) => {
    const response = await api.patch(`/crm/deals/${id}/lose`, { reason, notes });
    return response.data;
  },

  // Assign deal
  assign: async (id: string, userId: string) => {
    const response = await api.patch(`/crm/deals/${id}/assign`, { assignedTo: userId });
    return response.data;
  },

  // Get pipeline statistics
  getStats: async () => {
    const response = await api.get('/crm/deals/statistics');
    return response.data;
  },

  // Get forecast
  getForecast: async (year: number, month: number) => {
    const response = await api.get('/crm/deals/forecast', {
      params: { year, month },
    });
    return response.data;
  },
};

export const dealStagesApi = {
  // Get all stages
  getAll: async () => {
    const response = await api.get('/crm/deal-stages');
    return response.data;
  },

  // Get stage by ID
  getById: async (id: string) => {
    const response = await api.get(`/crm/deal-stages/${id}`);
    return response.data;
  },

  // Create stage
  create: async (data: { name: string; displayName: string; probability: number; color?: string }) => {
    const response = await api.post('/crm/deal-stages', data);
    return response.data;
  },

  // Update stage
  update: async (id: string, data: Partial<DealStage>) => {
    const response = await api.put(`/crm/deal-stages/${id}`, data);
    return response.data;
  },

  // Delete stage
  delete: async (id: string) => {
    const response = await api.delete(`/crm/deal-stages/${id}`);
    return response.data;
  },

  // Reorder stages
  reorder: async (stageIds: string[]) => {
    const response = await api.patch('/crm/deal-stages/reorder', { stageIds });
    return response.data;
  },
};

// ============================================
// INBOX / CONVERSATIONS
// ============================================

export interface Conversation {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
  contactId?: string;
  channel: 'whatsapp' | 'email' | 'sms';
  channelId?: string;
  recipient: string;
  recipientName?: string;
  status: 'open' | 'pending' | 'resolved' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  firstMessageAt: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  readAt?: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
}

export interface SendMessageDto {
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
}

export const inboxApi = {
  // Get all conversations
  getConversations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
    assignedTo?: string;
    search?: string;
  }) => {
    const response = await api.get('/crm/inbox/conversations', { params });
    return response.data;
  },

  // Get conversation by ID
  getConversation: async (id: string) => {
    const response = await api.get(`/crm/inbox/conversations/${id}`);
    return response.data;
  },

  // Get messages
  getMessages: async (conversationId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/crm/inbox/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId: string, data: SendMessageDto) => {
    const response = await api.post(`/crm/inbox/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  // Update conversation status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/crm/inbox/conversations/${id}/status`, { status });
    return response.data;
  },

  // Assign conversation
  assign: async (id: string, userId: string) => {
    const response = await api.patch(`/crm/inbox/conversations/${id}/assign`, { assignedTo: userId });
    return response.data;
  },
};

// ============================================
// CALENDAR / ACTIVITIES
// ============================================

export interface Activity {
  id: string;
  customerId: string;
  type: 'task' | 'call' | 'meeting' | 'email' | 'note';
  subject: string;
  content?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: string;
  scheduledEndAt?: string;
  completedAt?: string;
  assignedTo?: string;
  location?: string;
  locationUrl?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminders?: Array<{
    id: string;
    reminderAt: string;
    sent: boolean;
  }>;
}

export const calendarApi = {
  // Get calendar view
  getView: async (view: 'month' | 'week' | 'day', date: string) => {
    const response = await api.get('/crm/calendar/view', {
      params: { view, date },
    });
    return response.data;
  },

  // Get today's activities
  getToday: async () => {
    const response = await api.get('/crm/calendar/today');
    return response.data;
  },

  // Create recurring activity
  createRecurring: async (data: {
    customerId: string;
    type: string;
    subject: string;
    scheduledAt: string;
    recurrenceRule: string;
  }) => {
    const response = await api.post('/crm/calendar/recurring', data);
    return response.data;
  },

  // Add reminder
  addReminder: async (activityId: string, reminderAt: string) => {
    const response = await api.post(`/crm/calendar/activities/${activityId}/reminders`, {
      reminderAt,
    });
    return response.data;
  },

  // Complete activity
  complete: async (activityId: string, notes?: string) => {
    const response = await api.post(`/crm/calendar/activities/${activityId}/complete`, { notes });
    return response.data;
  },
};

// ============================================
// SMART LISTS / SEGMENTATION
// ============================================

export interface SmartList {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  filterConfig: any;
  filterLogic: 'AND' | 'OR';
  autoUpdate: boolean;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const smartListsApi = {
  // Get all smart lists
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/crm/smart-lists', { params });
    return response.data;
  },

  // Get smart list by ID
  getById: async (id: string) => {
    const response = await api.get(`/crm/smart-lists/${id}`);
    return response.data;
  },

  // Create smart list
  create: async (data: {
    name: string;
    description?: string;
    filterConfig: any;
    filterLogic?: 'AND' | 'OR';
  }) => {
    const response = await api.post('/crm/smart-lists', data);
    return response.data;
  },

  // Update smart list
  update: async (id: string, data: Partial<SmartList>) => {
    const response = await api.put(`/crm/smart-lists/${id}`, data);
    return response.data;
  },

  // Delete smart list
  delete: async (id: string) => {
    const response = await api.delete(`/crm/smart-lists/${id}`);
    return response.data;
  },

  // Evaluate smart list (get members)
  evaluate: async (id: string) => {
    const response = await api.get(`/crm/smart-lists/${id}/evaluate`);
    return response.data;
  },
};

// ============================================
// LEAD SCORING
// ============================================

export interface LeadScoringRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  points: number;
  category: 'demographic' | 'engagement' | 'behavior' | 'fit' | 'negative';
  conditions: any[];
}

export interface LeadScoreHistory {
  id: string;
  customerId: string;
  oldScore: number;
  newScore: number;
  pointsChange: number;
  triggerType: string;
  reason?: string;
  createdAt: string;
}

export const leadScoringApi = {
  // Get all rules
  getRules: async () => {
    const response = await api.get('/crm/lead-scoring/rules');
    return response.data;
  },

  // Get rule by ID
  getRule: async (id: string) => {
    const response = await api.get(`/crm/lead-scoring/rules/${id}`);
    return response.data;
  },

  // Create rule
  createRule: async (data: {
    name: string;
    description?: string;
    points: number;
    category: string;
    conditions: any[];
  }) => {
    const response = await api.post('/crm/lead-scoring/rules', data);
    return response.data;
  },

  // Update rule
  updateRule: async (id: string, data: Partial<LeadScoringRule>) => {
    const response = await api.put(`/crm/lead-scoring/rules/${id}`, data);
    return response.data;
  },

  // Delete rule
  deleteRule: async (id: string) => {
    const response = await api.delete(`/crm/lead-scoring/rules/${id}`);
    return response.data;
  },

  // Recalculate all scores
  recalculateAll: async () => {
    const response = await api.post('/crm/lead-scoring/recalculate-all');
    return response.data;
  },

  // Update customer score manually
  updateScore: async (customerId: string, score: number, reason?: string) => {
    const response = await api.patch(`/crm/lead-scoring/customers/${customerId}/score`, {
      score,
      reason,
    });
    return response.data;
  },
};

// ============================================
// REPORTS
// ============================================

export const crmReportsApi = {
  // Get pipeline KPIs
  getPipelineKPIs: async () => {
    const response = await api.get('/crm/reports/pipeline-kpis');
    return response.data;
  },

  // Get win rate
  getWinRate: async (sellerId?: string) => {
    const response = await api.get('/crm/reports/win-rate', {
      params: sellerId ? { sellerId } : {},
    });
    return response.data;
  },

  // Get average time to close
  getAverageTimeToClose: async (sellerId?: string) => {
    const response = await api.get('/crm/reports/average-time-to-close', {
      params: sellerId ? { sellerId } : {},
    });
    return response.data;
  },

  // Get forecast
  getForecast: async (year?: number, month?: number) => {
    const response = await api.get('/crm/reports/forecast', {
      params: { year, month },
    });
    return response.data;
  },

  // Get conversion funnel
  getConversionFunnel: async (dateFrom?: string, dateTo?: string) => {
    const response = await api.get('/crm/reports/conversion-funnel', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  // Get pipeline velocity
  getPipelineVelocity: async () => {
    const response = await api.get('/crm/reports/pipeline-velocity');
    return response.data;
  },

  // Get seller performance
  getSellerPerformance: async (dateFrom?: string, dateTo?: string) => {
    const response = await api.get('/crm/reports/seller-performance', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  // Get loss analysis
  getLossAnalysis: async (dateFrom?: string, dateTo?: string) => {
    const response = await api.get('/crm/reports/loss-analysis', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  // Get lead sources
  getLeadSources: async (dateFrom?: string, dateTo?: string) => {
    const response = await api.get('/crm/reports/lead-sources', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },
};

// ============================================
// WORKFLOWS / AUTOMATIONS
// ============================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig: any;
  steps: any[];
  maxSteps: number;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const workflowsApi = {
  // Get all workflows
  getAll: async (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    const response = await api.get('/crm/workflows', { params });
    return response.data;
  },

  // Get workflow by ID
  getById: async (id: string) => {
    const response = await api.get(`/crm/workflows/${id}`);
    return response.data;
  },

  // Create workflow
  create: async (data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig: any;
    steps: any[];
  }) => {
    const response = await api.post('/crm/workflows', data);
    return response.data;
  },

  // Update workflow
  update: async (id: string, data: Partial<Workflow>) => {
    const response = await api.put(`/crm/workflows/${id}`, data);
    return response.data;
  },

  // Delete workflow
  delete: async (id: string) => {
    const response = await api.delete(`/crm/workflows/${id}`);
    return response.data;
  },

  // Get executions
  getExecutions: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/crm/workflows/${id}/executions`, { params });
    return response.data;
  },

  // Get execution logs
  getExecutionLogs: async (executionId: string) => {
    const response = await api.get(`/crm/workflows/executions/${executionId}/logs`);
    return response.data;
  },
};

