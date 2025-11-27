import api from '../api';
import { ApiClient } from '../api';

// ============================================
// DEALS / PIPELINE
// ============================================

export interface Deal {
  id: string;
  name: string;
  customerId: string;
  customer?: {
    id: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  stageId: string;
  stage?: {
    id: string;
    name: string;
    displayName: string;
    sortOrder: number;
    probability: number;
    color?: string;
  };
  amount: number;
  currency: string;
  probability: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  expectedCloseDate?: string;
  closedAt?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  contacts?: Array<{
    id: string;
    contactId: string;
    contact?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      position?: string;
    };
    role?: string;
    isPrimary?: boolean;
  }>;
  products?: Array<{
    id: string;
    productId: string;
    product?: {
      id: string;
      name: string;
      sku?: string;
    };
    quantity: number;
    unitPrice: number;
    discount?: number;
    total?: number;
    notes?: string;
  }>;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  daysInStage?: number;
  lastStageChangeAt?: string;
  stageHistory?: Array<{
    stageId: string;
    stageName: string;
    changedAt: string;
    changedBy: string;
    changedByName?: string;
  }>;
  createdBy?: string;
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
    const response = await ApiClient.get<DealStage[]>('/crm/deal-stages');
    return response;
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

  // Initialize default stages
  initialize: async () => {
    const response = await ApiClient.get<DealStage[]>('/crm/deal-stages/initialize');
    return response;
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
    const response = await ApiClient.get('/crm/inbox/conversations', { params });
    return response;
  },

  // Get conversation by ID
  getConversation: async (id: string) => {
    const response = await ApiClient.get(`/crm/inbox/conversations/${id}`);
    return response;
  },

  // Get messages
  getMessages: async (conversationId: string, params?: { page?: number; limit?: number }) => {
    const response = await ApiClient.get(`/crm/inbox/conversations/${conversationId}/messages`, { params });
    return response;
  },

  // Send message
  sendMessage: async (conversationId: string, data: SendMessageDto) => {
    const response = await ApiClient.post(`/crm/inbox/conversations/${conversationId}/messages`, data);
    return response;
  },

  // Update conversation status
  updateStatus: async (id: string, status: string) => {
    const response = await ApiClient.patch(`/crm/inbox/conversations/${id}/status`, { status });
    return response;
  },

  // Assign conversation
  assign: async (id: string, userId: string) => {
    const response = await ApiClient.patch(`/crm/inbox/conversations/${id}/assign`, { assignedTo: userId });
    return response;
  },

  // Get inbox statistics
  getStats: async () => {
    const response = await ApiClient.get('/crm/inbox/conversations/stats');
    return response;
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
  getView: async (view: 'month' | 'week' | 'day', date: string, params?: {
    year?: number;
    month?: number;
    week?: number;
    day?: number;
    assignedTo?: string;
    type?: string;
    priority?: string;
  }) => {
    const dateObj = new Date(date);
    
    // Ensure we have valid date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    // Calculate year and month, ensuring they are valid numbers
    const year = params?.year || dateObj.getFullYear();
    const month = params?.month !== undefined ? params.month : dateObj.getMonth() + 1;
    
    // Validate month is in range
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
    }
    
    // Build query params, ensuring all values are valid numbers
    // Axios will serialize numbers as strings in query params, but NestJS will transform them back
    const queryParams: Record<string, any> = {
      view,
      year: Number(year),
      month: Number(month),
    };
    
    // Only add optional params if they are defined and valid
    if (params?.week !== undefined && !isNaN(Number(params.week))) {
      queryParams.week = Number(params.week);
    }
    if (params?.day !== undefined && !isNaN(Number(params.day))) {
      queryParams.day = Number(params.day);
    }
    if (params?.assignedTo) {
      queryParams.assignedTo = params.assignedTo;
    }
    if (params?.type) {
      queryParams.type = params.type;
    }
    if (params?.priority) {
      queryParams.priority = params.priority;
    }
    
    const response = await ApiClient.get('/crm/calendar/view', { params: queryParams });
    return response;
  },

  // Get today's activities
  getToday: async () => {
    const response = await ApiClient.get('/crm/calendar/today');
    return response;
  },

  // Create recurring activity
  createRecurring: async (data: {
    customerId: string;
    type: string;
    subject: string;
    scheduledAt: string;
    recurrenceRule: string;
    recurrenceEndDate?: string;
    status?: string;
  }) => {
    const response = await ApiClient.post('/crm/calendar/recurring', data);
    return response;
  },

  // Add reminder
  addReminder: async (activityId: string, data: { reminderMinutes?: number; reminderAt?: string }) => {
    const response = await ApiClient.post(`/crm/calendar/activities/${activityId}/reminders`, data);
    return response;
  },

  // Complete activity
  complete: async (activityId: string, data: { content?: string; outcome?: string; durationMinutes?: number }) => {
    const response = await ApiClient.post(`/crm/calendar/activities/${activityId}/complete`, data);
    return response;
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
    autoUpdate?: boolean;
    isActive?: boolean;
    tags?: string[];
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

  // Get smart list members
  getMembers: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/crm/smart-lists/${id}/members`, { params });
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
    const response = await api.post('/crm/lead-scoring/recalculate', {});
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

// ============================================
// INTERACTIONS
// ============================================

export interface Interaction {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    type?: string;
  };
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'task';
  direction?: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  durationMinutes?: number | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  location?: string;
  locationUrl?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string | null;
  parentInteractionId?: string;
  completedAt?: string | null;
  outcome?: 'interested' | 'not_interested' | 'callback' | 'closed' | 'follow_up' | 'meeting_scheduled' | 'proposal_sent' | 'no_answer';
  nextAction?: string;
  nextActionDate?: string | null;
  relatedOrderId?: string;
  relatedTaskId?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInteractionDto {
  customerId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'task';
  direction?: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt?: string;
  scheduledEndAt?: string;
  durationMinutes?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  location?: string;
  locationUrl?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  outcome?: 'interested' | 'not_interested' | 'callback' | 'closed' | 'follow_up' | 'meeting_scheduled' | 'proposal_sent' | 'no_answer';
  nextAction?: string;
  nextActionDate?: string;
  relatedOrderId?: string;
  relatedTaskId?: string;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateInteractionDto {
  type?: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'task';
  direction?: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt?: string;
  scheduledEndAt?: string;
  durationMinutes?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  location?: string;
  locationUrl?: string;
  outcome?: 'interested' | 'not_interested' | 'callback' | 'closed' | 'follow_up' | 'meeting_scheduled' | 'proposal_sent' | 'no_answer';
  nextAction?: string;
  nextActionDate?: string;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const interactionsApi = {
  // Get all interactions
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    type?: string;
    status?: string;
    direction?: string;
    outcome?: string;
    createdBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await ApiClient.get('/crm/interactions', { params });
    return response;
  },

  // Get interaction by ID
  getById: async (id: string) => {
    const response = await ApiClient.get(`/crm/interactions/${id}`);
    return response;
  },

  // Create interaction
  create: async (data: CreateInteractionDto) => {
    const response = await ApiClient.post('/crm/interactions', data);
    return response;
  },

  // Update interaction
  update: async (id: string, data: UpdateInteractionDto) => {
    const response = await ApiClient.put(`/crm/interactions/${id}`, data);
    return response;
  },

  // Complete interaction
  complete: async (id: string, data: {
    content?: string;
    durationMinutes?: number;
    outcome?: string;
    nextAction?: string;
    nextActionDate?: string;
  }) => {
    const response = await ApiClient.put(`/crm/interactions/${id}/complete`, data);
    return response;
  },

  // Get customer interactions
  getCustomerInteractions: async (customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    const response = await ApiClient.get(`/crm/interactions/customer/${customerId}`, { params });
    return response;
  },

  // Get upcoming interactions
  getUpcoming: async (params?: {
    days?: number;
    assignedTo?: string;
  }) => {
    const response = await ApiClient.get('/crm/interactions/upcoming', { params });
    return response;
  },

  // Schedule interaction
  schedule: async (data: CreateInteractionDto & { scheduledAt: string }) => {
    const response = await ApiClient.post('/crm/interactions/schedule', data);
    return response;
  },
};

// ============================================
// WEB FORMS
// ============================================

export interface WebForm {
  id: string;
  name: string;
  description?: string;
  embedId: string;
  formConfig: any;
  isActive: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebFormDto {
  name: string;
  description?: string;
  formConfig: any;
  isActive?: boolean;
}

export interface UpdateWebFormDto {
  name?: string;
  description?: string;
  formConfig?: any;
  isActive?: boolean;
}

export const webFormsApi = {
  // Get all web forms
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/crm/web-forms', { params });
    return response.data;
  },

  // Get web form by ID
  getById: async (id: string) => {
    const response = await api.get(`/crm/web-forms/${id}`);
    return response.data;
  },

  // Get web form by embed ID (public)
  getByEmbedId: async (embedId: string) => {
    const response = await api.get(`/public/forms/${embedId}`);
    return response.data;
  },

  // Create web form
  create: async (data: CreateWebFormDto) => {
    const response = await api.post('/crm/web-forms', data);
    return response.data;
  },

  // Update web form
  update: async (id: string, data: UpdateWebFormDto) => {
    const response = await api.put(`/crm/web-forms/${id}`, data);
    return response.data;
  },

  // Delete web form
  delete: async (id: string) => {
    const response = await api.delete(`/crm/web-forms/${id}`);
    return response.data;
  },

  // Get form submissions
  getSubmissions: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get(`/crm/web-forms/${id}/submissions`, { params });
    return response.data;
  },

  // Submit form (public)
  submit: async (id: string, data: Record<string, any>) => {
    const response = await api.post(`/public/forms/${id}/submit`, data);
    return response.data;
  },
};

