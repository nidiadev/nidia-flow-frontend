'use client';

import { useState, useRef, useImperativeHandle, RefObject } from 'react';
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
  Info
} from 'lucide-react';
import { Customer, CustomerType, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { LeadScoreRanges } from './lead-score-indicator';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-api';
import { toast } from 'sonner';

// Validation schema
// Campos obligatorios según backend: type, firstName
const customerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().max(100, 'Máximo 100 caracteres').optional(),
  email: z.string().optional().refine((val) => {
    if (!val || val === '') return true;
    return z.string().email().safeParse(val).success;
  }, {
    message: 'Email inválido'
  }).refine((val) => !val || val.length <= 255, {
    message: 'Máximo 255 caracteres'
  }),
  phone: z.string().optional().refine((val) => !val || /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'El teléfono debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  mobile: z.string().optional().refine((val) => !val || /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'El móvil debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  whatsapp: z.string().optional().refine((val) => !val || /^\+[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: 'WhatsApp debe incluir el código de país (ej: +57 300 123 4567)'
  }),
  companyName: z.string().default(''),
  type: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']),
  leadScore: z.number().min(0).max(100),
  leadSource: z.string().default(''),
  
  // Address
  addressLine1: z.string().default(''),
  addressLine2: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('CO'),
  
  // Business info
  industry: z.string().default(''),
  segment: z.string().default(''),
  taxId: z.string().default(''),
  
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
  className?: string;
  onSubmitTrigger?: RefObject<{ submit: () => void }>;
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

// Industries options
const INDUSTRIES = [
  { value: 'technology', label: 'Tecnología' },
  { value: 'healthcare', label: 'Salud' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'education', label: 'Educación' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufactura' },
  { value: 'construction', label: 'Construcción' },
  { value: 'services', label: 'Servicios' },
  { value: 'other', label: 'Otro' },
];

// Segments options
const SEGMENTS = [
  { value: 'B2B', label: 'B2B (Empresa a Empresa)' },
  { value: 'B2C', label: 'B2C (Empresa a Consumidor)' },
  { value: 'Government', label: 'Gobierno' },
  { value: 'Non-profit', label: 'Sin ánimo de lucro' },
];

export function CustomerForm({ customer, onSuccess, onCancel, className, onSubmitTrigger, isLoading: externalIsLoading }: CustomerFormProps) {
  const [tags, setTags] = useState<string[]>(customer?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const isEditing = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  
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
  });

  const leadScore = form.watch('leadScore');
  const leadScoreInfo = getLeadScoreInfo(leadScore);
  const customerType = form.watch('type') as CustomerType;
  const typeConfig = CUSTOMER_TYPE_CONFIG[customerType];

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Remove empty optional fields before sending to backend
      const customerData = {
        ...data,
        tags,
        // Convert empty strings to undefined for optional fields
        lastName: data.lastName?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        mobile: data.mobile?.trim() || undefined,
        whatsapp: data.whatsapp?.trim() || undefined,
        companyName: data.companyName?.trim() || undefined,
        leadSource: data.leadSource?.trim() || undefined,
        addressLine1: data.addressLine1?.trim() || undefined,
        addressLine2: data.addressLine2?.trim() || undefined,
        city: data.city?.trim() || undefined,
        state: data.state?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        industry: data.industry?.trim() || undefined,
        segment: data.segment?.trim() || undefined,
        taxId: data.taxId?.trim() || undefined,
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
      
      onSuccess?.(result.data);
    } catch (error) {
      // Error is handled by the mutation hook
      // Reset external loading state if provided
      if (externalIsLoading !== undefined && typeof onSuccess === 'function') {
        // Loading state will be reset by parent component
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
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
                          <FormLabel>Apellido</FormLabel>
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
                        <FormLabel>Email</FormLabel>
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
                              onChange={(value) => field.onChange(value || '')}
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
                              onChange={(value) => field.onChange(value || '')}
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
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ''}
                              onChange={(value) => field.onChange(value || '')}
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
                        <FormLabel>Nombre de la Empresa</FormLabel>
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
                          <FormLabel>Industria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar industria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry.value} value={industry.value}>
                                  {industry.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="segment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segmento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar segmento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SEGMENTS.map((segment) => (
                                <SelectItem key={segment.value} value={segment.value}>
                                  {segment.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>NIT / Documento</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección Principal</FormLabel>
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
                        <FormLabel>Dirección Secundaria</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartamento, oficina, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Bogotá" {...field} />
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
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Cundinamarca" {...field} />
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
                          <FormLabel>Código Postal</FormLabel>
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
                  <CardTitle>Notas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Información adicional sobre el cliente..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
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
                          align="start"
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CUSTOMER_TYPE_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center">
                                  <Badge variant={config.variant} className="mr-2">
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {config.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <Badge variant="outline" className={cn('border', typeConfig.color)}>
                      {typeConfig.label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {typeConfig.description}
                    </p>
                  </div>

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
                          <FormLabel className="flex items-center justify-between">
                            <span>Lead Score</span>
                            <div className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className={`font-bold text-base ${leadScoreInfo.color}`}>
                                {field.value}
                              </span>
                            </div>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value: number[]) => field.onChange(value[0])}
                                className="w-full"
                              />
                              <div 
                                className="absolute top-0 left-0 h-2 rounded-full pointer-events-none transition-colors"
                                style={{ 
                                  width: `${field.value}%`,
                                  backgroundColor: getSliderColor(field.value)
                                }}
                              />
                            </div>
                          </FormControl>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                            <span>0</span>
                            <span className={`font-medium ${leadScoreInfo.color}`}>
                              {leadScoreInfo.label}
                            </span>
                            <span>100</span>
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
                        <FormLabel>Fuente del Lead</FormLabel>
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
                  <CardTitle>Información Financiera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de Crédito</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Límite de crédito en COP
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos de Pago</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Días de crédito (0 = contado)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nueva etiqueta"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Hidden submit button for external triggers */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Form>
    </div>
  );
}