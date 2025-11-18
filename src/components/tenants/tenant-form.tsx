'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { CreateTenantDto, tenantsApi } from '@/lib/api/tenants';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { plansApi } from '@/lib/api/plans';

const tenantFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(50, 'El slug no puede exceder 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .refine(async (slug) => {
      if (!slug || slug.length < 3) return true;
      try {
        const result = await tenantsApi.validateSlug(slug);
        return result.available;
      } catch {
        return true;
      }
    }, 'Este identificador ya está en uso'),
  companyLegalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  billingEmail: z.string().email('Email inválido'),
  billingContactName: z.string().max(255).optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingCountry: z.string().max(2).optional(),
  billingPostalCode: z.string().max(20).optional(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'cash', 'other']).optional(),
  primaryContactName: z.string().max(255).optional(),
  primaryContactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  primaryContactPhone: z.string().max(20).optional(),
  planType: z.string().min(1, 'Debe seleccionar un plan'),
  referralSource: z.string().max(100).optional(),
  notes: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export interface TenantFormRef {
  submit: () => void;
}

interface TenantFormProps {
  defaultValues?: Partial<CreateTenantDto>;
  onSubmit: (data: CreateTenantDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean; // Para controlar si se muestran los botones dentro del form
}

// Opciones predefinidas de industria (a nivel mundial)
const INDUSTRY_OPTIONS = [
  // Tecnología y Software
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Software', label: 'Software' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Desarrollo de Software', label: 'Desarrollo de Software' },
  { value: 'Inteligencia Artificial', label: 'Inteligencia Artificial' },
  { value: 'Ciberseguridad', label: 'Ciberseguridad' },
  { value: 'Cloud Computing', label: 'Cloud Computing' },
  { value: 'Telecomunicaciones', label: 'Telecomunicaciones' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Electrónica', label: 'Electrónica' },
  { value: 'Internet y Web', label: 'Internet y Web' },
  { value: 'Videojuegos', label: 'Videojuegos' },
  { value: 'Blockchain y Criptomonedas', label: 'Blockchain y Criptomonedas' },
  
  // Finanzas y Servicios Financieros
  { value: 'Finanzas', label: 'Finanzas' },
  { value: 'Banca', label: 'Banca' },
  { value: 'Servicios Financieros', label: 'Servicios Financieros' },
  { value: 'Inversiones', label: 'Inversiones' },
  { value: 'Seguros', label: 'Seguros' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Contabilidad', label: 'Contabilidad' },
  { value: 'Auditoría', label: 'Auditoría' },
  { value: 'Bienes Raíces Financieros', label: 'Bienes Raíces Financieros' },
  { value: 'Crowdfunding', label: 'Crowdfunding' },
  
  // Retail y Comercio
  { value: 'Retail', label: 'Retail' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Comercio Electrónico', label: 'Comercio Electrónico' },
  { value: 'Moda y Textiles', label: 'Moda y Textiles' },
  { value: 'Belleza y Cosméticos', label: 'Belleza y Cosméticos' },
  { value: 'Joyería', label: 'Joyería' },
  { value: 'Deportes y Recreación', label: 'Deportes y Recreación' },
  { value: 'Muebles y Decoración', label: 'Muebles y Decoración' },
  { value: 'Electrodomésticos', label: 'Electrodomésticos' },
  { value: 'Supermercados', label: 'Supermercados' },
  { value: 'Farmacia', label: 'Farmacia' },
  
  // Manufactura e Industria
  { value: 'Manufactura', label: 'Manufactura' },
  { value: 'Industria Automotriz', label: 'Industria Automotriz' },
  { value: 'Aeroespacial', label: 'Aeroespacial' },
  { value: 'Química', label: 'Química' },
  { value: 'Farmacéutica', label: 'Farmacéutica' },
  { value: 'Biotecnología', label: 'Biotecnología' },
  { value: 'Energía', label: 'Energía' },
  { value: 'Petróleo y Gas', label: 'Petróleo y Gas' },
  { value: 'Energía Renovable', label: 'Energía Renovable' },
  { value: 'Minería', label: 'Minería' },
  { value: 'Metalurgia', label: 'Metalurgia' },
  { value: 'Papel y Pulpa', label: 'Papel y Pulpa' },
  { value: 'Textiles Industriales', label: 'Textiles Industriales' },
  { value: 'Plásticos', label: 'Plásticos' },
  
  // Salud y Bienestar
  { value: 'Salud', label: 'Salud' },
  { value: 'Hospitales', label: 'Hospitales' },
  { value: 'Clínicas', label: 'Clínicas' },
  { value: 'Medicina', label: 'Medicina' },
  { value: 'Odontología', label: 'Odontología' },
  { value: 'Salud Mental', label: 'Salud Mental' },
  { value: 'Fisioterapia', label: 'Fisioterapia' },
  { value: 'Bienestar', label: 'Bienestar' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Nutrición', label: 'Nutrición' },
  { value: 'Equipos Médicos', label: 'Equipos Médicos' },
  { value: 'Dispositivos Médicos', label: 'Dispositivos Médicos' },
  
  // Educación
  { value: 'Educación', label: 'Educación' },
  { value: 'Educación Superior', label: 'Educación Superior' },
  { value: 'Educación Primaria y Secundaria', label: 'Educación Primaria y Secundaria' },
  { value: 'Educación Online', label: 'Educación Online' },
  { value: 'E-learning', label: 'E-learning' },
  { value: 'Capacitación Corporativa', label: 'Capacitación Corporativa' },
  { value: 'Idiomas', label: 'Idiomas' },
  { value: 'Tutoría', label: 'Tutoría' },
  
  // Servicios Profesionales
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Consultoría', label: 'Consultoría' },
  { value: 'Consultoría de Gestión', label: 'Consultoría de Gestión' },
  { value: 'Consultoría Tecnológica', label: 'Consultoría Tecnológica' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Abogacía', label: 'Abogacía' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Publicidad', label: 'Publicidad' },
  { value: 'Marketing Digital', label: 'Marketing Digital' },
  { value: 'Relaciones Públicas', label: 'Relaciones Públicas' },
  { value: 'Diseño', label: 'Diseño' },
  { value: 'Diseño Gráfico', label: 'Diseño Gráfico' },
  { value: 'Arquitectura', label: 'Arquitectura' },
  { value: 'Ingeniería', label: 'Ingeniería' },
  { value: 'Recursos Humanos', label: 'Recursos Humanos' },
  { value: 'Outsourcing', label: 'Outsourcing' },
  { value: 'BPO', label: 'BPO' },
  
  // Inmobiliaria y Construcción
  { value: 'Inmobiliaria', label: 'Inmobiliaria' },
  { value: 'Bienes Raíces', label: 'Bienes Raíces' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Desarrollo Inmobiliario', label: 'Desarrollo Inmobiliario' },
  { value: 'Arquitectura y Planificación', label: 'Arquitectura y Planificación' },
  { value: 'Ingeniería Civil', label: 'Ingeniería Civil' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  
  // Transporte y Logística
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Transporte Aéreo', label: 'Transporte Aéreo' },
  { value: 'Transporte Marítimo', label: 'Transporte Marítimo' },
  { value: 'Transporte Terrestre', label: 'Transporte Terrestre' },
  { value: 'Mensajería', label: 'Mensajería' },
  { value: 'Almacenamiento', label: 'Almacenamiento' },
  { value: 'Distribución', label: 'Distribución' },
  { value: 'Cadena de Suministro', label: 'Cadena de Suministro' },
  
  // Alimentación y Bebidas
  { value: 'Alimentación', label: 'Alimentación' },
  { value: 'Restaurantes', label: 'Restaurantes' },
  { value: 'Hotelería', label: 'Hotelería' },
  { value: 'Catering', label: 'Catering' },
  { value: 'Bebidas', label: 'Bebidas' },
  { value: 'Alimentos Procesados', label: 'Alimentos Procesados' },
  { value: 'Agricultura', label: 'Agricultura' },
  { value: 'Ganadería', label: 'Ganadería' },
  { value: 'Pesca', label: 'Pesca' },
  { value: 'Acuicultura', label: 'Acuicultura' },
  
  // Turismo y Entretenimiento
  { value: 'Turismo', label: 'Turismo' },
  { value: 'Viajes', label: 'Viajes' },
  { value: 'Agencias de Viajes', label: 'Agencias de Viajes' },
  { value: 'Hoteles', label: 'Hoteles' },
  { value: 'Entretenimiento', label: 'Entretenimiento' },
  { value: 'Medios de Comunicación', label: 'Medios de Comunicación' },
  { value: 'Televisión', label: 'Televisión' },
  { value: 'Radio', label: 'Radio' },
  { value: 'Cine', label: 'Cine' },
  { value: 'Música', label: 'Música' },
  { value: 'Eventos', label: 'Eventos' },
  { value: 'Deportes Profesionales', label: 'Deportes Profesionales' },
  
  // Servicios Gubernamentales y No Lucrativos
  { value: 'Gobierno', label: 'Gobierno' },
  { value: 'Sector Público', label: 'Sector Público' },
  { value: 'Organizaciones Sin Fines de Lucro', label: 'Organizaciones Sin Fines de Lucro' },
  { value: 'ONG', label: 'ONG' },
  { value: 'Fundaciones', label: 'Fundaciones' },
  { value: 'Asociaciones', label: 'Asociaciones' },
  
  // Otros Servicios
  { value: 'Servicios de Limpieza', label: 'Servicios de Limpieza' },
  { value: 'Seguridad', label: 'Seguridad' },
  { value: 'Servicios de Seguridad', label: 'Servicios de Seguridad' },
  { value: 'Jardinería', label: 'Jardinería' },
  { value: 'Peluquería y Estética', label: 'Peluquería y Estética' },
  { value: 'Veterinaria', label: 'Veterinaria' },
  { value: 'Fotografía', label: 'Fotografía' },
  { value: 'Video', label: 'Video' },
  { value: 'Música y Audio', label: 'Música y Audio' },
  { value: 'Traducción', label: 'Traducción' },
  { value: 'Servicios de Traducción', label: 'Servicios de Traducción' },
  
  // Energía y Utilidades
  { value: 'Utilidades', label: 'Utilidades' },
  { value: 'Agua', label: 'Agua' },
  { value: 'Electricidad', label: 'Electricidad' },
  { value: 'Gas Natural', label: 'Gas Natural' },
  { value: 'Servicios Públicos', label: 'Servicios Públicos' },
  
  // Investigación y Desarrollo
  { value: 'Investigación y Desarrollo', label: 'Investigación y Desarrollo' },
  { value: 'I+D', label: 'I+D' },
  { value: 'Ciencia', label: 'Ciencia' },
  { value: 'Laboratorios', label: 'Laboratorios' },
  
  // Agricultura y Recursos Naturales
  { value: 'Silvicultura', label: 'Silvicultura' },
  { value: 'Recursos Naturales', label: 'Recursos Naturales' },
  { value: 'Medio Ambiente', label: 'Medio Ambiente' },
  { value: 'Sostenibilidad', label: 'Sostenibilidad' },
  
  // Otros
  { value: 'Otros', label: 'Otros' },
];

export const TenantForm = forwardRef<TenantFormRef, TenantFormProps>(({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  showActions = false,
}, ref) => {
  // Fetch plans from API
  const { data: plans = [], isLoading: isLoadingPlans, error: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
    retry: 1,
  });

  // Log plans for debugging
  React.useEffect(() => {
    if (plansError) {
      console.error('Error loading plans:', plansError);
    } else if (plans.length > 0) {
      console.log('Plans loaded:', plans);
    } else if (!isLoadingPlans) {
      console.warn('No plans found');
    }
  }, [plans, isLoadingPlans, plansError]);

      const form = useForm<TenantFormValues>({
        resolver: zodResolver(tenantFormSchema),
        defaultValues: {
          name: defaultValues?.name || '',
          slug: defaultValues?.slug || '',
          companyLegalName: defaultValues?.companyLegalName || '',
          taxId: defaultValues?.taxId || '',
          industry: defaultValues?.industry || '',
          companySize: defaultValues?.companySize as 'small' | 'medium' | 'large' | 'enterprise' | undefined,
          billingEmail: defaultValues?.billingEmail || '',
          billingContactName: defaultValues?.billingContactName || '',
          billingAddress: defaultValues?.billingAddress || '',
          billingCity: defaultValues?.billingCity || '',
          billingState: defaultValues?.billingState || '',
          billingCountry: defaultValues?.billingCountry || 'CO',
          billingPostalCode: defaultValues?.billingPostalCode || '',
          paymentMethod: defaultValues?.paymentMethod as 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'other' | undefined,
          primaryContactName: defaultValues?.primaryContactName || '',
          primaryContactEmail: defaultValues?.primaryContactEmail || '',
          primaryContactPhone: defaultValues?.primaryContactPhone || '',
          planType: defaultValues?.planType || '',
          referralSource: defaultValues?.referralSource || '',
          notes: defaultValues?.notes || '',
        },
      });

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(handleSubmit)();
    },
  }));

  const handleSubmit = async (data: TenantFormValues) => {
    const submitData: CreateTenantDto = {
      name: data.name,
      slug: data.slug,
      companyLegalName: data.companyLegalName || undefined,
      taxId: data.taxId || undefined,
      industry: data.industry || undefined,
      companySize: data.companySize || undefined,
      billingEmail: data.billingEmail,
      billingContactName: data.billingContactName || undefined,
      billingAddress: data.billingAddress || undefined,
      billingCity: data.billingCity || undefined,
      billingState: data.billingState || undefined,
      billingCountry: data.billingCountry || undefined,
      billingPostalCode: data.billingPostalCode || undefined,
      paymentMethod: data.paymentMethod || undefined,
      primaryContactName: data.primaryContactName || undefined,
      primaryContactEmail: data.primaryContactEmail || undefined,
      primaryContactPhone: data.primaryContactPhone || undefined,
      planType: data.planType,
      referralSource: data.referralSource || undefined,
      notes: data.notes || undefined,
    };
    await onSubmit(submitData);
  };

  // Track if slug was manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!defaultValues?.slug);
  
  // Watch slug value from form
  const formSlug = form.watch('slug');
  
  // Initialize slugValue from form
  const [slugValue, setSlugValue] = useState(() => formSlug || defaultValues?.slug || '');

  // Sync slugValue with form value when form changes (only if different to avoid loops)
  useEffect(() => {
    if (formSlug !== slugValue) {
      setSlugValue(formSlug || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSlug]);

  // Debounce slug for validation
  const [debouncedSlug, setDebouncedSlug] = useState(slugValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slugValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [slugValue]);

  // Validate slug availability
  const { data: slugValidation, isLoading: isValidatingSlug } = useQuery({
    queryKey: ['validate-slug', debouncedSlug],
    queryFn: () => tenantsApi.validateSlug(debouncedSlug),
    enabled: debouncedSlug.length >= 3 && /^[a-z0-9-]+$/.test(debouncedSlug) && (!defaultValues || debouncedSlug !== defaultValues.slug),
    retry: false,
  });

  // Auto-generate slug from name (only if not manually edited)
  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    // Solo generar slug automáticamente si no fue editado manualmente
    if (!slugManuallyEdited) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug.length >= 3) {
        form.setValue('slug', slug, { shouldValidate: true });
        setSlugValue(slug); // Actualizar directamente para que se vea inmediatamente
      } else {
        form.setValue('slug', '');
        setSlugValue('');
      }
    }
  };

  // Handle slug manual edit
  const handleSlugChange = (value: string) => {
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    form.setValue('slug', normalizedValue, { shouldValidate: true });
    // Marcar como editado manualmente solo si el usuario realmente escribió algo
    if (normalizedValue.trim().length > 0) {
      setSlugManuallyEdited(true);
    } else {
      // Si borra todo, permitir que se regenere desde el nombre
      setSlugManuallyEdited(false);
      const nameValue = form.getValues('name');
      if (nameValue) {
        handleNameChange(nameValue);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-4">
        {/* Información Básica */}
        <div className="space-y-4 pb-4 border-b border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Información Básica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nombre de la Empresa *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese el nombre comercial"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs leading-tight">
                    Nombre comercial público (ej: "Tech Solutions")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="identificador-unico" 
                        value={slugValue}
                        onChange={(e) => {
                          handleSlugChange(e.target.value);
                          field.onChange(e);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className={slugValidation && !slugValidation.available ? 'border-destructive' : slugValidation?.available ? 'border-green-500' : ''}
                      />
                      {slugValue.length >= 3 && /^[a-z0-9-]+$/.test(slugValue) && (!defaultValues || slugValue !== defaultValues.slug) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidatingSlug ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : slugValidation?.available ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : slugValidation && !slugValidation.available ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs leading-tight">
                    {slugValidation && !slugValidation.available ? (
                      <span className="text-destructive">{slugValidation.message}</span>
                    ) : slugValidation?.available ? (
                      <span className="text-green-600 dark:text-green-400">{slugValidation.message}</span>
                    ) : (
                      'Se genera automáticamente desde el nombre'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyLegalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Razón social registrada" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs leading-tight">
                    Nombre legal registrado (ej: "Tech Solutions S.A.S.")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT / Tax ID</FormLabel>
                  <FormControl>
                    <Input placeholder="900123456-1" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs leading-tight">
                    Identificador fiscal de la empresa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industria</FormLabel>
                  <FormControl>
                    <Combobox
                      options={INDUSTRY_OPTIONS}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar o escribir industria..."
                      allowCustom={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamaño de Empresa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tamaño" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Pequeña (1-10)</SelectItem>
                      <SelectItem value="medium">Mediana (11-50)</SelectItem>
                      <SelectItem value="large">Grande (51-200)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Facturación */}
        <div className="space-y-4 pb-4 border-b border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Información de Facturación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Facturación *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="facturacion@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto de Facturación</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo del contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="billingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de Facturación</FormLabel>
                <FormControl>
                  <Input placeholder="Calle 123 #45-67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingCity"
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
              name="billingState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado/Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Cundinamarca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'CO'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CO">Colombia</SelectItem>
                      <SelectItem value="MX">México</SelectItem>
                      <SelectItem value="AR">Argentina</SelectItem>
                      <SelectItem value="CL">Chile</SelectItem>
                      <SelectItem value="PE">Perú</SelectItem>
                      <SelectItem value="EC">Ecuador</SelectItem>
                      <SelectItem value="US">Estados Unidos</SelectItem>
                      <SelectItem value="ES">España</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingPostalCode"
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

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contacto Principal */}
        <div className="space-y-4 pb-4 border-b border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Contacto Principal</h3>
          
          <FormField
            control={form.control}
            name="primaryContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo del contacto principal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primaryContactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contacto@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono del Contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="+57 300 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Plan */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Plan Inicial</h3>
          
          <FormField
            control={form.control}
            name="planType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Plan</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isLoadingPlans}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingPlans ? "Cargando planes..." : "Seleccionar plan"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingPlans ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        Cargando planes...
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No hay planes disponibles
                      </div>
                    ) : (
                      plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.name}>
                          {plan.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Plan inicial asignado al cliente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Información Adicional */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Información Adicional</h3>
          
          <FormField
            control={form.control}
            name="referralSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuente de Referencia</FormLabel>
                <FormControl>
                  <Input placeholder="google_ads, facebook, recomendación, etc." {...field} />
                </FormControl>
                <FormDescription>
                  Cómo se enteró el cliente de NIDIA Flow
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Notas internas para el equipo de NIDIA (solo visible para superadmins)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Notas privadas para el equipo de NIDIA
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {defaultValues ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
});

TenantForm.displayName = 'TenantForm';

