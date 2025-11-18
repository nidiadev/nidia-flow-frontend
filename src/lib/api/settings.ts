import api from '../api';

export interface CompanySettings {
  id: string;
  companyName: string;
  legalName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  currency: string;
  locale: string;
  defaultTaxRate: number;
  businessHours?: Record<string, any>;
  // API Keys
  whatsappApiKey?: string;
  whatsappPhoneId?: string;
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  googleMapsApiKey?: string;
}

export interface UpdateCompanySettingsDto {
  companyName?: string;
  legalName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  defaultTaxRate?: number;
  businessHours?: Record<string, any>;
}

export interface UpdateWhatsAppApiKeyDto {
  apiKey: string;
  phoneId?: string;
}

export interface UpdateSendGridApiKeyDto {
  apiKey: string;
  fromEmail?: string;
}

export interface UpdateGoogleMapsApiKeyDto {
  apiKey: string;
}

export interface UpdateEnabledModulesDto {
  modules: string[];
}

export interface ModuleStatusResponse {
  module: string;
  enabled: boolean;
}

export interface BusinessConfigResponse {
  timezone: string;
  currency: string;
  locale: string;
  defaultTaxRate: number;
}

export const settingsApi = {
  async getSettings(): Promise<CompanySettings> {
    const response = await api.get('/settings');
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateSettings(data: UpdateCompanySettingsDto): Promise<CompanySettings> {
    const response = await api.put('/settings', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateWhatsAppApiKey(data: UpdateWhatsAppApiKeyDto): Promise<CompanySettings> {
    const response = await api.put('/settings/api-keys/whatsapp', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateSendGridApiKey(data: UpdateSendGridApiKeyDto): Promise<CompanySettings> {
    const response = await api.put('/settings/api-keys/sendgrid', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateGoogleMapsApiKey(data: UpdateGoogleMapsApiKeyDto): Promise<CompanySettings> {
    const response = await api.put('/settings/api-keys/google-maps', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async updateEnabledModules(data: UpdateEnabledModulesDto): Promise<CompanySettings> {
    const response = await api.put('/settings/modules', data);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async getModuleStatus(module: string): Promise<ModuleStatusResponse> {
    const response = await api.get(`/settings/modules/status?module=${module}`);
    const responseData = response.data;
    return responseData?.data || responseData;
  },

  async getBusinessConfig(): Promise<BusinessConfigResponse> {
    const response = await api.get('/settings/business-config');
    const responseData = response.data;
    return responseData?.data || responseData;
  },
};

