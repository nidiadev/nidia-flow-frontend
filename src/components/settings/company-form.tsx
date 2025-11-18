'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { CompanySettings, UpdateCompanySettingsDto } from '@/lib/api/settings';
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
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const companyFormSchema = z.object({
  companyName: z.string().min(1, 'El nombre de la empresa es requerido').max(200),
  legalName: z.string().max(200).optional().or(z.literal('')),
  taxId: z.string().max(50).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().min(2).max(2).default('CO'),
  timezone: z.string().default('America/Bogota'),
  currency: z.string().length(3).default('COP'),
  locale: z.string().default('es-CO'),
  defaultTaxRate: z.number().min(0).max(100).default(19),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export interface CompanyFormRef {
  submit: () => void;
}

interface CompanyFormProps {
  defaultValues?: Partial<CompanySettings>;
  onSubmit: (data: UpdateCompanySettingsDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

const countries = [
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'US', name: 'Estados Unidos' },
];

const timezones = [
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
];

const currencies = [
  { code: 'COP', name: 'Peso Colombiano (COP)' },
  { code: 'MXN', name: 'Peso Mexicano (MXN)' },
  { code: 'ARS', name: 'Peso Argentino (ARS)' },
  { code: 'CLP', name: 'Peso Chileno (CLP)' },
  { code: 'PEN', name: 'Sol Peruano (PEN)' },
  { code: 'USD', name: 'Dólar Estadounidense (USD)' },
];

export const CompanyForm = forwardRef<CompanyFormRef, CompanyFormProps>(
  ({ defaultValues, onSubmit, onCancel, isLoading = false, showActions = true }, ref) => {
    const form = useForm<CompanyFormValues>({
      resolver: zodResolver(companyFormSchema) as any,
      defaultValues: {
        companyName: defaultValues?.companyName || '',
        legalName: defaultValues?.legalName || '',
        taxId: defaultValues?.taxId || '',
        phone: defaultValues?.phone || '',
        email: defaultValues?.email || '',
        website: defaultValues?.website || '',
        address: defaultValues?.address || '',
        city: defaultValues?.city || '',
        state: defaultValues?.state || '',
        postalCode: defaultValues?.postalCode || '',
        country: defaultValues?.country || 'CO',
        timezone: defaultValues?.timezone || 'America/Bogota',
        currency: defaultValues?.currency || 'COP',
        locale: defaultValues?.locale || 'es-CO',
        defaultTaxRate: defaultValues?.defaultTaxRate || 19,
      },
    });

    useEffect(() => {
      if (defaultValues) {
        form.reset({
          companyName: defaultValues.companyName || '',
          legalName: defaultValues.legalName || '',
          taxId: defaultValues.taxId || '',
          phone: defaultValues.phone || '',
          email: defaultValues.email || '',
          website: defaultValues.website || '',
          address: defaultValues.address || '',
          city: defaultValues.city || '',
          state: defaultValues.state || '',
          postalCode: defaultValues.postalCode || '',
          country: defaultValues.country || 'CO',
          timezone: defaultValues.timezone || 'America/Bogota',
          currency: defaultValues.currency || 'COP',
          locale: defaultValues.locale || 'es-CO',
          defaultTaxRate: defaultValues.defaultTaxRate || 19,
        });
      }
    }, [defaultValues, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(handleSubmit)();
      },
    }));

    const handleSubmit = async (values: CompanyFormValues) => {
      const submitData: UpdateCompanySettingsDto = {
        companyName: values.companyName,
        ...(values.legalName && { legalName: values.legalName }),
        ...(values.taxId && { taxId: values.taxId }),
        ...(values.phone && { phone: values.phone }),
        ...(values.email && { email: values.email }),
        ...(values.website && { website: values.website }),
        ...(values.address && { address: values.address }),
        ...(values.city && { city: values.city }),
        ...(values.state && { state: values.state }),
        ...(values.postalCode && { postalCode: values.postalCode }),
        country: values.country,
        timezone: values.timezone,
        currency: values.currency,
        locale: values.locale,
        defaultTaxRate: values.defaultTaxRate,
      };

      await onSubmit(submitData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos principales de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Empresa S.A.S." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Empresa Sociedad por Acciones Simplificada" {...field} />
                      </FormControl>
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
                        <Input placeholder="900123456-7" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+57 1 234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contacto@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://www.empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Dirección */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
              <CardDescription>
                Información de ubicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle 123 #45-67" {...field} />
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
                      <FormLabel>Departamento/Estado</FormLabel>
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

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Configuración de Negocio */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Negocio</CardTitle>
              <CardDescription>
                Parámetros generales del negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.name}
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
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona Horaria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una zona horaria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
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
                name="defaultTaxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Impuesto por Defecto (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="19.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tasa de impuesto predeterminada para facturación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {showActions && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

CompanyForm.displayName = 'CompanyForm';

