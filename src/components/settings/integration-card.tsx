'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isConfigured: boolean;
  apiKey?: string; // Masked API key from backend
  onSubmit: (data: { apiKey: string; [key: string]: any }) => Promise<void>;
  isLoading?: boolean;
  additionalFields?: Array<{
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
    description?: string;
  }>;
}

// Dynamic schema based on additional fields
const createApiKeySchema = (additionalFields: IntegrationCardProps['additionalFields']) => {
  const baseSchema: Record<string, any> = {
    apiKey: z.string().min(1, 'La API key es requerida'),
  };

  if (additionalFields) {
    additionalFields.forEach((field) => {
      if (field.type === 'email') {
        baseSchema[field.name] = z.string().email('Email inválido').optional().or(z.literal(''));
      } else {
        baseSchema[field.name] = z.string().optional();
      }
    });
  }

  return z.object(baseSchema);
};


export function IntegrationCard({
  title,
  description,
  icon,
  isConfigured,
  apiKey,
  onSubmit,
  isLoading = false,
  additionalFields = [],
}: IntegrationCardProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isConfigured);

  const schema = createApiKeySchema(additionalFields);
  type FormValues = z.infer<typeof schema>;

  const defaultValues: Record<string, string> = {
    apiKey: '',
  };
  additionalFields.forEach((field) => {
    defaultValues[field.name] = '';
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as FormValues,
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values as { apiKey: string; [key: string]: any });
      setIsExpanded(false);
      form.reset();
    } catch (error) {
      // Error is handled by parent
    }
  };

  // Determine if API key is masked (ends with ***)
  const isMasked = apiKey?.endsWith('***') || false;
  const displayApiKey = isMasked ? apiKey : (showApiKey ? apiKey : '••••••••••••••••');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                No configurado
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar' : 'Configurar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {isConfigured && apiKey && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">API Key Actual</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="text"
                      value={displayApiKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    {!isMasked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa una nueva API key para actualizarla
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key {isConfigured ? '(Nueva)' : '*'}</FormLabel>
                    <FormControl>
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Ingresa tu API key"
                        className="font-mono"
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormDescription>
                      {isConfigured
                        ? 'Deja en blanco para mantener la actual'
                        : 'La API key se guardará de forma segura'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {additionalFields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as any}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          {...formField}
                          value={formField.value as string}
                        />
                      </FormControl>
                      {field.description && (
                        <FormDescription>{field.description}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(false);
                    form.reset();
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}

