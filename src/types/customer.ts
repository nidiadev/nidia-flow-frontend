export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  companyName?: string;
  type: CustomerType;
  leadScore: number;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  // Business info
  industry?: string;
  segment?: string;
  taxId?: string;
  
  // Financial
  creditLimit?: number;
  paymentTerms?: number;
  
  // Status
  status: CustomerStatus;
  isActive: boolean;
  convertedFromLeadAt?: string;
  firstPurchaseAt?: string;
  lastPurchaseAt?: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  leadSource?: string;
}

export type CustomerType = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface CustomerContact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  type: InteractionType;
  direction?: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status: InteractionStatus;
  scheduledAt?: string;
  durationMinutes?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
  relatedOrderId?: string;
  relatedTaskId?: string;
  metadata?: Record<string, any>;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type InteractionType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'task';

export type InteractionStatus = 'completed' | 'scheduled' | 'cancelled';

export interface CustomerFilters {
  search?: string;
  type?: CustomerType | 'all';
  status?: CustomerStatus | 'all';
  assignedTo?: string;
  leadSource?: string;
  city?: string;
  tags?: string[];
  leadScoreMin?: number;
  leadScoreMax?: number;
  createdAfter?: string;
  createdBefore?: string;
  lastContactAfter?: string;
  lastContactBefore?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeLeads: number;
  prospects: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnedCustomers: number;
  conversionRate: number;
  averageLeadScore: number;
  totalInteractions: number;
  interactionsThisWeek: number;
  interactionsThisMonth: number;
}

export const CUSTOMER_TYPE_CONFIG = {
  lead: { 
    label: 'Lead', 
    variant: 'info' as const, 
    color: 'bg-nidia-blue/20 text-nidia-blue dark:bg-nidia-blue/30 dark:text-nidia-blue',
    description: 'Contacto inicial, potencial cliente'
  },
  prospect: { 
    label: 'Prospecto', 
    variant: 'warning' as const, 
    color: 'bg-muted text-muted-foreground',
    description: 'Lead calificado, en proceso de evaluación'
  },
  active: { 
    label: 'Activo', 
    variant: 'success' as const, 
    color: 'bg-nidia-green/20 text-nidia-green dark:bg-nidia-green/30 dark:text-nidia-green',
    description: 'Cliente activo con compras recientes'
  },
  inactive: { 
    label: 'Inactivo', 
    variant: 'secondary' as const, 
    color: 'bg-muted text-muted-foreground',
    description: 'Cliente sin actividad reciente'
  },
  churned: { 
    label: 'Perdido', 
    variant: 'destructive' as const, 
    color: 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive',
    description: 'Cliente que se ha ido a la competencia'
  },
} as const;

export const LEAD_SCORE_RANGES = {
  excellent: { min: 80, max: 100, label: 'Excelente', color: 'text-green-600' },
  good: { min: 60, max: 79, label: 'Bueno', color: 'text-yellow-600' },
  fair: { min: 40, max: 59, label: 'Regular', color: 'text-orange-600' },
  poor: { min: 0, max: 39, label: 'Bajo', color: 'text-red-600' },
} as const;

export function getLeadScoreInfo(score: number) {
  for (const [key, range] of Object.entries(LEAD_SCORE_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return range;
    }
  }
  return LEAD_SCORE_RANGES.poor;
}