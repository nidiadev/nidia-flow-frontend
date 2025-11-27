'use client';

import { useState, useRef, useImperativeHandle, RefObject, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { PhoneInput } from '@/components/ui/phone-input';
import { CountrySelect } from '@/components/ui/country-select';
import { IndustrySelect } from '@/components/ui/industry-select';
import { SegmentSelect } from '@/components/ui/segment-select';
import { Tooltip, TooltipContent, TooltipProviderImmediate, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  Save,
  X,
  Plus,
  Trash2,
  Info,
  Loader2
} from 'lucide-react';
import { Customer, CustomerType, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { LeadScoreRanges } from './lead-score-indicator';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-api';
import { toast } from 'sonner';

// Validation schema
// Campos obligatorios importantes para tener data completa desde el inicio
const customerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'Máximo 100 caracteres'),
  email: z.string().min(1, 'El email es requerido').email('Email inválido').max(255, 'Máximo 255 caracteres'),
  phone: z.string().optional().refine((val) => !val || /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'El teléfono debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  mobile: z.string().optional().refine((val) => !val || /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'El móvil debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  whatsapp: z.string().min(1, 'WhatsApp es requerido').refine((val) => /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'WhatsApp debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  companyName: z.string().min(1, 'El nombre de la empresa es requerido').max(255, 'Máximo 255 caracteres'),
  type: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']),
  leadScore: z.number().min(0).max(100),
  leadSource: z.string().min(1, 'El origen del lead es requerido'),
  
  // Address - Required fields
  addressLine1: z.string().min(1, 'La dirección principal es requerida'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'El país es requerido').default('CO'),
  
  // Business info - Required fields
  industry: z.string().min(1, 'La industria es requerida'),
  segment: z.string().min(1, 'El segmento es requerido'),
  taxId: z.string().min(1, 'El NIT/Documento es requerido'),
  
  // Financial
  creditLimit: z.number().optional(),
  paymentTerms: z.number().default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  onSubmitTrigger?: RefObject<{ submit: () => void } | null>;
  isLoading?: boolean;
}

// Lead sources options
const LEAD_SOURCES = [
  { value: 'website', label: 'Sitio Web' },
  { value: 'referral', label: 'Referido' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'cold_call', label: 'Llamada en frío' },
  { value: 'social_media', label: 'Redes Sociales' },
  { value: 'email_marketing', label: 'Email Marketing' },
  { value: 'event', label: 'Evento' },
  { value: 'other', label: 'Otro' },
];

// Predefined tags for quick selection
const PREDEFINED_TAGS = [
  'VIP',
  'Cliente Recurrente',
  'Potencial Alto',
  'Urgente',
  'Seguimiento Requerido',
  'Negociación',
  'Prospecto Caliente',
  'Cliente Corporativo',
  'Pago Pendiente',
  'Nuevo Cliente',
  'Referido',
  'Oportunidad',
];

// Industries and Segments are now loaded from JSON files via components

export function CustomerForm({ customer, onSuccess, onCancel, onError, className, onSubmitTrigger, isLoading: externalIsLoading }: CustomerFormProps) {
  const [tags, setTags] = useState<string[]>(customer?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const isEditing = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  
  // Reset loading state on error
  useEffect(() => {
    if (createCustomer.isError) {
      onError?.(createCustomer.error as Error);
    }
    if (updateCustomer.isError) {
      onError?.(updateCustomer.error as Error);
    }
  }, [createCustomer.isError, updateCustomer.isError, createCustomer.error, updateCustomer.error, onError]);
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      mobile: customer?.mobile || '',
      whatsapp: customer?.whatsapp || '',
      companyName: customer?.companyName || '',
      type: customer?.type || 'lead',
      leadScore: customer?.leadScore || 0,
      leadSource: customer?.leadSource || '',
      addressLine1: customer?.addressLine1 || '',
      addressLine2: customer?.addressLine2 || '',
      city: customer?.city || '',
      state: customer?.state || '',
      postalCode: customer?.postalCode || '',
      country: customer?.country || 'CO',
      industry: customer?.industry || '',
      segment: customer?.segment || '',
      taxId: customer?.taxId || '',
      creditLimit: customer?.creditLimit || undefined,
      paymentTerms: customer?.paymentTerms || 0,
      tags: customer?.tags || [],
      notes: customer?.notes || '',
    },
    mode: 'onChange', // Validar mientras el usuario escribe
  });

  const leadScore = form.watch('leadScore');
  const leadScoreInfo = getLeadScoreInfo(leadScore);
  const customerType = form.watch('type') as CustomerType;
  const typeConfig = CUSTOMER_TYPE_CONFIG[customerType];
  
  // Track auto-fill state (only auto-fill once when first field is filled)
  const hasAutoFilledRef = useRef(false);
  
  // Reset auto-fill flag when customer changes (for edit mode)
  useEffect(() => {
    if (customer) {
      hasAutoFilledRef.current = false;
    } else {
      // Reset for new customer form
      hasAutoFilledRef.current = false;
    }
  }, [customer?.id]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Prepare customer data - keep required fields, convert empty optional fields to undefined
      const customerData = {
        ...data,
        tags,
        // Required fields - keep as is (already validated)
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp.trim(),
        companyName: data.companyName.trim(),
        leadSource: data.leadSource.trim(),
        addressLine1: data.addressLine1.trim(),
        city: data.city.trim(),
        country: data.country.trim() || 'CO',
        industry: data.industry.trim(),
        segment: data.segment.trim(),
        taxId: data.taxId.trim(),
        // Optional fields - convert empty strings to undefined
        phone: data.phone?.trim() || undefined,
        mobile: data.mobile?.trim() || undefined,
        addressLine2: data.addressLine2?.trim() || undefined,
        state: data.state?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };

      let result;
      if (isEditing) {
        result = await updateCustomer.mutateAsync({ 
          id: customer.id, 
          data: customerData 
        });
      } else {
        result = await createCustomer.mutateAsync(customerData);
      }

      toast.success(
        isEditing 
          ? 'Cliente actualizado correctamente' 
          : 'Cliente creado correctamente'
      );
      
      // Call onSuccess which will handle navigation and state reset
      onSuccess?.(result.data);
    } catch (error: any) {
      // Error is handled by the mutation hook and API interceptor
      // Notify parent to reset loading state
      onError?.(error instanceof Error ? error : new Error(error?.message || 'Error desconocido'));
      // Don't re-throw, the error is already handled and shown to user
    }
  };

  const addTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      if (!tagToAdd) {
        setNewTag('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const isLoading = externalIsLoading ?? (createCustomer.isPending || updateCustomer.isPending);
  
  // Create a ref for the form element
  const formRef = useRef<HTMLFormElement>(null);
  
  // Expose submit function if onSubmitTrigger is provided
  useImperativeHandle(onSubmitTrigger as any, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }), []);

  return (
    <div className={className}>
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input placeholder="Apellido" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ''}
                              onChange={(value) => {
                                const newValue = value || '';
                                field.onChange(newValue);
                                
                                // Auto-fill other fields only once if they're empty
                                if (!hasAutoFilledRef.current && newValue.trim() !== '') {
                                  const mobileVal = form.getValues('mobile') || '';
                                  const whatsappVal = form.getValues('whatsapp') || '';
                                  
                                  if (mobileVal.trim() === '' && whatsappVal.trim() === '') {
                                    form.setValue('mobile', newValue, { shouldValidate: false, shouldDirty: false });
                                    form.setValue('whatsapp', newValue, { shouldValidate: false, shouldDirty: false });
                                    hasAutoFilledRef.current = true;
                                  }
                                }
                              }}
                              onBlur={field.onBlur}
                              placeholder="+57 1 234 5678"
                              defaultCountry="CO"
                              className={cn(
                                form.formState.errors.phone && 'border-destructive focus-visible:ring-destructive'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Móvil</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ''}
                              onChange={(value) => {
                                const newValue = value || '';
                                field.onChange(newValue);
                                
                                // Auto-fill other fields only once if they're empty
                                if (!hasAutoFilledRef.current && newValue.trim() !== '') {
                                  const phoneVal = form.getValues('phone') || '';
                                  const whatsappVal = form.getValues('whatsapp') || '';
                                  
                                  if (phoneVal.trim() === '' && whatsappVal.trim() === '') {
                                    form.setValue('phone', newValue, { shouldValidate: false, shouldDirty: false });
                                    form.setValue('whatsapp', newValue, { shouldValidate: false, shouldDirty: false });
                                    hasAutoFilledRef.current = true;
                                  }
                                }
                              }}
                              onBlur={field.onBlur}
                              placeholder="+57 300 123 4567"
                              defaultCountry="CO"
                              className={cn(
                                form.formState.errors.mobile && 'border-destructive focus-visible:ring-destructive'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp *</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ''}
                              onChange={(value) => {
                                const newValue = value || '';
                                field.onChange(newValue);
                                
                                // Auto-fill other fields only once if they're empty
                                if (!hasAutoFilledRef.current && newValue.trim() !== '') {
                                  const phoneVal = form.getValues('phone') || '';
                                  const mobileVal = form.getValues('mobile') || '';
                                  
                                  if (phoneVal.trim() === '' && mobileVal.trim() === '') {
                                    form.setValue('phone', newValue, { shouldValidate: false, shouldDirty: false });
                                    form.setValue('mobile', newValue, { shouldValidate: false, shouldDirty: false });
                                    hasAutoFilledRef.current = true;
                                  }
                                }
                              }}
                              onBlur={field.onBlur}
                              placeholder="+57 300 123 4567"
                              defaultCountry="CO"
                              className={cn(
                                form.formState.errors.whatsapp && 'border-destructive focus-visible:ring-destructive'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Información de Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Empresa S.A.S." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Industria *</FormLabel>
                          <FormControl>
                            <IndustrySelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Selecciona una industria"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="segment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Segmento *</FormLabel>
                          <FormControl>
                            <SegmentSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Selecciona un segmento"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 block">NIT / Documento *</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fila 1: Dirección Principal y Dirección Secundaria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Dirección Principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle 123 #45-67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Dirección Secundaria</FormLabel>
                          <FormControl>
                            <Input placeholder="Apartamento, oficina, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Fila 2: País y Departamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">País *</FormLabel>
                          <FormControl>
                            <CountrySelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Selecciona un país"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Departamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Cundinamarca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Fila 3: Ciudad y Código Postal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Ciudad *</FormLabel>
                          <FormControl>
                            <Input placeholder="Bogotá" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Código Postal</FormLabel>
                          <FormControl>
                            <Input placeholder="110111" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Notas Adicionales
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center cursor-help group">
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-nidia-green transition-colors" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="start"
                          sideOffset={10}
                          className="max-w-sm"
                        >
                          <p className="font-semibold mb-2 text-nidia-green">¿Qué incluir en las notas?</p>
                          <ul className="text-sm space-y-1.5 leading-relaxed">
                            <li>• Información relevante sobre el cliente</li>
                            <li>• Preferencias y necesidades específicas</li>
                            <li>• Historial de interacciones importantes</li>
                            <li>• Recordatorios y próximos pasos</li>
                            <li>• Observaciones del equipo de ventas</li>
                            <li>• Detalles de negociación o acuerdos</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Ejemplo: Cliente interesado en productos premium. Prefiere comunicación por WhatsApp. Requiere seguimiento semanal. Última conversación: 15/01/2025 - Mencionó interés en expandir operaciones..."
                            className="min-h-[120px] resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground mt-1.5">
                          Agrega información relevante que ayude al equipo a entender mejor al cliente y su contexto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Type & Lead Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Clasificación
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center cursor-help group">
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-nidia-green transition-colors" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="center"
                          sideOffset={10}
                          className="max-w-xs"
                        >
                          <p className="font-semibold mb-1.5 text-nidia-green">Lead Score</p>
                          <p className="text-sm leading-relaxed">
                            Sistema de puntuación (0-100) que evalúa la probabilidad de conversión de un lead en cliente. 
                            Se calcula automáticamente según comportamiento, interacciones y datos demográficos.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => {
                      const selectedConfig = CUSTOMER_TYPE_CONFIG[field.value as CustomerType] || CUSTOMER_TYPE_CONFIG.lead;
                      
                      return (
                        <FormItem>
                          <FormLabel>Tipo de Cliente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-auto py-2">
                                <SelectValue>
                                  <div className="flex items-center gap-2 w-full">
                                    <Badge variant={selectedConfig.variant} className="text-xs shrink-0">
                                      {selectedConfig.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground truncate">
                                      {selectedConfig.description}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                              {Object.entries(CUSTOMER_TYPE_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="group">
                                  <div className="flex items-center gap-2.5 w-full">
                                    <Badge 
                                      variant={config.variant} 
                                      className="text-xs shrink-0 group-hover:opacity-90 group-focus:opacity-90 transition-opacity"
                                    >
                                      {config.label}
                                    </Badge>
                                    <span className="text-sm text-foreground/80 group-hover:text-foreground group-focus:text-foreground transition-colors flex-1">
                                      {config.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="leadScore"
                    render={({ field }) => {
                      const getSliderColor = (score: number) => {
                        if (score >= 80) return 'bg-green-500';
                        if (score >= 60) return 'bg-yellow-500';
                        if (score >= 40) return 'bg-orange-500';
                        return 'bg-red-500';
                      };
                      
                      return (
                        <FormItem>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-base font-semibold">Lead Score</FormLabel>
                              <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <span className={`font-bold text-lg ${leadScoreInfo.color}`}>
                                  {field.value}
                                </span>
                                <span className={`text-sm font-medium ${leadScoreInfo.color} ml-1`}>
                                  ({leadScoreInfo.label})
                                </span>
                              </div>
                            </div>
                            <FormControl>
                              <div className="relative py-2.5">
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(value: number[]) => field.onChange(value[0])}
                                  className="w-full [&>[data-radix-slider-track]]:h-2.5 [&>[data-radix-slider-track]]:bg-secondary/30 [&>[data-radix-slider-range]]:bg-transparent relative"
                                />
                                <div 
                                  className="absolute left-0 h-2.5 rounded-full pointer-events-none transition-all duration-200"
                                  style={{ 
                                    width: `${field.value}%`,
                                    backgroundColor: getSliderColor(field.value),
                                    top: 'calc(50% + 0.5rem)',
                                    transform: 'translateY(-50%)'
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                              <span className="font-medium">0</span>
                              <div className="flex items-center gap-3 text-[10px]">
                                <span>Bajo</span>
                                <span>Regular</span>
                                <span>Bueno</span>
                                <span>Excelente</span>
                              </div>
                              <span className="font-medium">100</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                    <FormField
                      control={form.control}
                      name="leadSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Fuente del Lead *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar fuente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SOURCES.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                  {source.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  {/* Lead Score Ranges Info */}
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <LeadScoreRanges />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Información Financiera
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center cursor-help group">
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-nidia-green transition-colors" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="start"
                          sideOffset={10}
                          className="max-w-xs"
                        >
                          <p className="font-semibold mb-1.5 text-nidia-green">Información Financiera</p>
                          <p className="text-sm leading-relaxed">
                            Configura los términos comerciales y límites de crédito para este cliente. 
                            Esta información se utiliza para gestionar pedidos y facturación.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => {
                      const formatCurrency = (value: number | undefined): string => {
                        if (!value) return '';
                        return new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value);
                      };

                      return (
                        <FormItem>
                          <FormLabel>Límite de Crédito</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium z-10">
                                COP
                              </span>
                              <Input 
                                type="text"
                                placeholder="0"
                                className="pl-12"
                                value={formatCurrency(field.value)}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                                  if (rawValue === '') {
                                    field.onChange(undefined);
                                  } else {
                                    const numValue = Number(rawValue);
                                    field.onChange(numValue);
                                  }
                                }}
                                onBlur={field.onBlur}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Monto máximo de crédito autorizado para este cliente en pesos colombianos (COP)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => {
                      const [inputValue, setInputValue] = useState<string>(
                        field.value !== undefined && field.value !== null ? String(field.value) : '0'
                      );
                      const [isFocused, setIsFocused] = useState(false);
                      const [isArrowKey, setIsArrowKey] = useState(false);

                      // Sync with form value when it changes externally (e.g., from arrows)
                      useEffect(() => {
                        if (!isFocused || isArrowKey) {
                          const newValue = field.value !== undefined && field.value !== null ? String(field.value) : '0';
                          setInputValue(newValue);
                          setIsArrowKey(false);
                        }
                      }, [field.value, isFocused, isArrowKey]);

                      return (
                        <FormItem>
                          <FormLabel>Términos de Pago</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                placeholder="0"
                                min="0"
                                step="1"
                                value={isFocused && inputValue === '0' && !isArrowKey ? '' : inputValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const newValue = e.target.value;
                                  setInputValue(newValue);
                                  setIsArrowKey(false);
                                  
                                  if (newValue === '') {
                                    field.onChange(0);
                                  } else {
                                    const numValue = Number(newValue);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      field.onChange(numValue);
                                    }
                                  }
                                }}
                                onFocus={() => {
                                  setIsFocused(true);
                                  if (inputValue === '0') {
                                    setInputValue('');
                                  }
                                }}
                                onBlur={(e) => {
                                  setIsFocused(false);
                                  setIsArrowKey(false);
                                  const value = e.target.value === '' ? '0' : e.target.value;
                                  setInputValue(value);
                                  field.onBlur();
                                  
                                  // Ensure we always have a valid number
                                  const numValue = value === '' ? 0 : Number(value);
                                  field.onChange(numValue >= 0 ? numValue : 0);
                                }}
                                onKeyDown={(e) => {
                                  // Detect arrow keys or mouse wheel on spinner
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    setIsArrowKey(true);
                                    // Let the default behavior handle the increment/decrement
                                    setTimeout(() => {
                                      const input = e.target as HTMLInputElement;
                                      const currentValue = Number(input.value) || 0;
                                      field.onChange(currentValue);
                                    }, 0);
                                  }
                                }}
                                className="pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                días
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            <span className="block mb-1">Número de días que el cliente tiene para pagar después de la facturación.</span>
                            <span className="text-xs text-muted-foreground">
                              <strong>0 días</strong> = Pago de contado (inmediato) | <strong>30 días</strong> = Pago a 30 días | <strong>60 días</strong> = Pago a 60 días
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Etiquetas
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center cursor-help group">
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-nidia-green transition-colors" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="start"
                          sideOffset={10}
                          className="max-w-xs"
                        >
                          <p className="font-semibold mb-1.5 text-nidia-green">Etiquetas</p>
                          <p className="text-sm leading-relaxed">
                            Organiza y categoriza tus clientes con etiquetas. Selecciona etiquetas predefinidas o crea las tuyas propias para facilitar la búsqueda y filtrado.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Predefined Tags */}
                  <div>
                    <FormDescription className="mb-2 text-xs font-medium text-muted-foreground">
                      Etiquetas Predefinidas
                    </FormDescription>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_TAGS.map((predefinedTag) => {
                        const isSelected = tags.includes(predefinedTag);
                        return (
                          <Badge
                            key={predefinedTag}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all hover:scale-105",
                              isSelected && "bg-nidia-green hover:bg-nidia-green/90"
                            )}
                            onClick={() => {
                              if (isSelected) {
                                removeTag(predefinedTag);
                              } else {
                                addTag(predefinedTag);
                              }
                            }}
                          >
                            {predefinedTag}
                            {isSelected && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Tags */}
                  {tags.length > 0 && (
                    <div>
                      <FormDescription className="mb-2 text-xs font-medium text-muted-foreground">
                        Etiquetas Seleccionadas
                      </FormDescription>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Tag Input */}
                  <div>
                    <FormDescription className="mb-2 text-xs font-medium text-muted-foreground">
                      Agregar Etiqueta Personalizada
                    </FormDescription>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe una etiqueta personalizada..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => addTag()}
                        disabled={!newTag.trim()}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Hidden submit button for external triggers (header buttons) */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Form>
    </div>
  );
}