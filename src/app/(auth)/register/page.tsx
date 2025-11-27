'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { registerSchema, type RegisterData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Building2, Users, Rocket, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api/tenants';
import { PhoneInput } from '@/components/ui/phone-input';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const slideInVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 },
  },
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get('planId');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar qué logo usar según el tema
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch form values
  const companyName = watch('companyName');
  const formSlug = watch('slug');
  const [slugValue, setSlugValue] = useState('');

  // Sync slugValue with form value
  useEffect(() => {
    setSlugValue(formSlug || '');
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
    enabled: debouncedSlug.length >= 3 && /^[a-z0-9-]+$/.test(debouncedSlug),
    retry: false,
  });

  // Auto-generate slug from company name
  useEffect(() => {
    if (!slugManuallyEdited && companyName) {
      const slug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (slug.length >= 2) {
        setValue('slug', slug, { shouldValidate: true });
        setSlugValue(slug);
      } else {
        setValue('slug', '');
        setSlugValue('');
      }
    }
  }, [companyName, slugManuallyEdited, setValue]);

  // Handle company name change
  const handleCompanyNameChange = (value: string) => {
    setValue('companyName', value);
  };

  // Handle slug manual edit
  const handleSlugChange = (value: string) => {
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setValue('slug', normalizedValue, { shouldValidate: true });
    setSlugValue(normalizedValue);
    
    if (normalizedValue.trim().length > 0) {
      setSlugManuallyEdited(true);
    } else {
      setSlugManuallyEdited(false);
    }
  };

  const onSubmit = async (data: RegisterData) => {
    setError(null);
    
    // Agregar planId del query param si existe
    const registerData: RegisterData = {
      ...data,
      planId: planIdFromQuery || undefined, // Incluir planId si viene del query param
    };
    
    // Guardar credenciales temporalmente para auto-login después del provisioning
    sessionStorage.setItem('pendingLogin', JSON.stringify({
      email: data.email,
      password: data.password,
      timestamp: Date.now(),
    }));
    
    const result = await registerUser(registerData);
    
    if (!result.success) {
      setError(result.message || 'Error al registrarse');
      // Limpiar credenciales si hay error
      sessionStorage.removeItem('pendingLogin');
    }
  };

  const benefits = [
    { icon: Building2, text: 'Gestión empresarial completa' },
    { icon: Users, text: 'Multi-tenant seguro' },
    { icon: Rocket, text: 'Escalable y flexible' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-0 relative overflow-hidden">
      {/* Background decorative elements - tech grid */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated tech grid pattern */}
        <div className="absolute inset-0 tech-grid-bg opacity-30 dark:opacity-20 animate-tech-grid" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-7xl mx-auto relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 items-center min-h-[600px] lg:min-h-[700px]">
          {/* Left side - Branding (hidden on mobile, shown on desktop) */}
          <motion.div
            variants={slideInVariants}
            className="hidden lg:flex flex-col justify-center items-start h-full px-8 xl:px-12 py-12"
          >
            <div className="w-full max-w-md space-y-8">
              {/* Logo and Brand */}
              <motion.div variants={itemVariants} className="space-y-4">
                <Link href="/" className="flex items-center gap-3 mb-6 group">
                  <Image
                    src={logoSrc}
                    alt="Logo"
                    width={96}
                    height={96}
                    className="w-20 h-20 md:w-24 md:h-24 transition-transform group-hover:scale-105"
                    priority
                  />
                </Link>
                
                <h2 className="text-4xl xl:text-5xl font-bold font-outfit text-foreground leading-tight">
                  Crea tu cuenta
                </h2>
                <p className="text-lg xl:text-xl font-outfit text-muted-foreground leading-relaxed">
                  Únete a las microempresas que están transformando su gestión.
                </p>
              </motion.div>

              {/* Benefits */}
              <motion.div variants={itemVariants} className="space-y-4 pt-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    variants={itemVariants}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-outfit text-foreground font-medium">
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
          </div>
          </motion.div>

          {/* Right side - Registration Form */}
          <motion.div
            variants={itemVariants}
            className="w-full flex items-center justify-center lg:justify-end"
          >
            <Card className="w-full max-w-md lg:max-w-lg border-2 border-border bg-card dark:bg-card/80 backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center space-y-3 pb-4 pt-6 px-6 sm:px-8">
                {/* Mobile Logo */}
                <motion.div
                  variants={itemVariants}
                  className="lg:hidden mx-auto mb-2"
                >
                  <Link href="/" className="flex items-center justify-center gap-3 mb-4 group">
                    <Image
                      src={logoSrc}
                      alt="Logo"
                      width={80}
                      height={80}
                      className="w-20 h-20 transition-transform group-hover:scale-105"
                      priority
                    />
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <CardTitle className="text-2xl sm:text-3xl font-bold font-outfit text-foreground mb-2">
                    Crear Cuenta
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base font-outfit text-muted-foreground">
            {planIdFromQuery 
              ? 'Completa tu registro para activar tu plan'
              : 'Regístrate para comenzar (se asignará el plan gratuito)'}
                  </CardDescription>
                </motion.div>
        </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-6">
                       <motion.form
                         variants={itemVariants}
                         onSubmit={handleSubmit(onSubmit)}
                         className="space-y-2.5 sm:space-y-3"
                       >
                  <AnimatePresence>
            {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="p-3 text-sm font-outfit text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-lg"
                      >
                {error}
                      </motion.div>
            )}
                  </AnimatePresence>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label 
                        htmlFor="firstName" 
                        className="text-sm font-outfit text-foreground font-medium"
                      >
                        Nombre
                      </Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  {...register('firstName')}
                        className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                          errors.firstName 
                            ? 'border-destructive focus-visible:ring-destructive' 
                            : 'border-primary/30 focus-visible:ring-primary'
                        }`}
                        autoComplete="given-name"
                      />
                      <AnimatePresence>
                {errors.firstName && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-outfit text-destructive"
                          >
                    {errors.firstName.message}
                          </motion.p>
                )}
                      </AnimatePresence>
              </div>

                    <div className="space-y-1">
                      <Label 
                        htmlFor="lastName" 
                        className="text-sm font-outfit text-foreground font-medium"
                      >
                        Apellido
                      </Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  {...register('lastName')}
                        className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                          errors.lastName 
                            ? 'border-destructive focus-visible:ring-destructive' 
                            : 'border-primary/30 focus-visible:ring-primary'
                        }`}
                        autoComplete="family-name"
                      />
                      <AnimatePresence>
                {errors.lastName && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-outfit text-destructive"
                          >
                    {errors.lastName.message}
                          </motion.p>
                )}
                      </AnimatePresence>
              </div>
            </div>

                  {/* Email Field */}
                  <div className="space-y-1">
                    <Label 
                      htmlFor="email" 
                      className="text-sm font-outfit text-foreground font-medium"
                    >
                      Email
                    </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                {...register('email')}
                      className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                        errors.email 
                          ? 'border-destructive focus-visible:ring-destructive' 
                          : 'border-primary/30 focus-visible:ring-primary'
                      }`}
                      autoComplete="email"
                    />
                    <AnimatePresence>
              {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs font-outfit text-destructive"
                        >
                  {errors.email.message}
                        </motion.p>
              )}
                    </AnimatePresence>
            </div>

                  {/* Company and Slug Fields - Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Company Field */}
                    <div className="space-y-1">
                      <Label 
                        htmlFor="companyName" 
                        className="text-sm font-outfit text-foreground font-medium"
                      >
                        Empresa
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Mi Empresa S.A.S."
                        {...register('companyName')}
                        onChange={(e) => {
                          handleCompanyNameChange(e.target.value);
                          register('companyName').onChange(e);
                        }}
                        className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                          errors.companyName 
                            ? 'border-destructive focus-visible:ring-destructive' 
                            : 'border-primary/30 focus-visible:ring-primary'
                        }`}
                        autoComplete="organization"
                      />
                      <AnimatePresence>
                        {errors.companyName && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-outfit text-destructive"
                          >
                            {errors.companyName.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Slug Field */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Label 
                          htmlFor="slug" 
                          className="text-sm font-outfit text-foreground font-medium"
                        >
                          Identificador
                        </Label>
                        {!slugManuallyEdited && companyName && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                          >
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs">Auto</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="slug"
                          placeholder="mi-empresa"
                          value={slugValue}
                          onChange={(e) => {
                            handleSlugChange(e.target.value);
                            register('slug').onChange(e);
                          }}
                          onBlur={register('slug').onBlur}
                          name={register('slug').name}
                          ref={register('slug').ref}
                          className={`h-10 sm:h-11 text-sm sm:text-base font-outfit lowercase ${
                            errors.slug 
                              ? 'border-destructive focus-visible:ring-destructive pr-10' 
                              : slugValidation && !slugValidation.available
                              ? 'border-destructive focus-visible:ring-destructive pr-10'
                              : slugValidation?.available
                              ? 'border-green-500 focus-visible:ring-green-500 pr-10'
                              : slugManuallyEdited
                              ? 'border-primary/30 focus-visible:ring-primary pr-10'
                              : 'border-primary/30 focus-visible:ring-primary pr-20'
                          }`}
                          autoComplete="off"
                        />
                        {!slugManuallyEdited && companyName && slugValue && (
                          <button
                            type="button"
                            onClick={() => {
                              setSlugManuallyEdited(false);
                              const slug = companyName
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '');
                              if (slug.length >= 2) {
                                setValue('slug', slug, { shouldValidate: true });
                                setSlugValue(slug);
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                            title="Regenerar desde nombre de empresa"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {slugValue.length >= 3 && /^[a-z0-9-]+$/.test(slugValue) && (
                          <div className={`absolute ${!slugManuallyEdited && companyName ? 'right-10' : 'right-3'} top-1/2 -translate-y-1/2`}>
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
                      <AnimatePresence>
                        {errors.slug && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs font-outfit text-destructive"
                          >
                            {errors.slug.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <p className="text-xs text-muted-foreground">
                        {slugValidation && !slugValidation.available ? (
                          <span className="text-destructive">{slugValidation.message}</span>
                        ) : slugValidation?.available ? (
                          <span className="text-green-600 dark:text-green-400">{slugValidation.message}</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            {!slugManuallyEdited && companyName ? (
                              <>
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span>Se genera automáticamente</span>
                              </>
                            ) : (
                              'Identificador único para tu empresa'
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-1">
                    <Label 
                      htmlFor="phone" 
                      className="text-sm font-outfit text-foreground font-medium"
                    >
                      Teléfono <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </Label>
                    <PhoneInput
                      id="phone"
                      value={watch('phone') || ''}
                      onChange={(value) => setValue('phone', value || undefined)}
                      onBlur={(e) => {
                        if (e) {
                          register('phone').onBlur(e);
                        } else {
                          register('phone').onBlur({ target: { value: watch('phone') } } as any);
                        }
                      }}
                      defaultCountry="CO"
                      placeholder="+57 300 123 4567"
                      className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                        errors.phone 
                          ? 'border-destructive focus-visible:ring-destructive' 
                          : 'border-primary/30 focus-visible:ring-primary'
                      }`}
                    />
                    <AnimatePresence>
              {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-sm font-outfit text-destructive"
                        >
                  {errors.phone.message}
                        </motion.p>
              )}
                    </AnimatePresence>
            </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <Label 
                      htmlFor="password" 
                      className="text-sm font-outfit text-foreground font-medium"
                    >
                      Contraseña
                    </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                        className={`h-10 sm:h-11 text-sm sm:text-base font-outfit pr-12 ${
                          errors.password 
                            ? 'border-destructive focus-visible:ring-destructive' 
                            : 'border-primary/30 focus-visible:ring-primary'
                        }`}
                        autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 touch-manipulation"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                          <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                          <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>
              </div>
                    <AnimatePresence>
              {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-sm font-outfit text-destructive"
                        >
                  {errors.password.message}
                        </motion.p>
              )}
                    </AnimatePresence>
                    <p className="text-xs text-muted-foreground">
                      Debe tener al menos 8 caracteres
                    </p>
            </div>

                  {/* Submit Button */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                    className="pt-1"
                  >
            <Button
              type="submit"
                      variant="default"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold font-outfit"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
                  </motion.div>
                </motion.form>

                {/* Login Link */}
                <motion.div 
                  variants={itemVariants} 
                  className="mt-4 text-center pt-3 border-t border-border"
                >
                  <p className="text-sm font-outfit text-muted-foreground mb-2">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                      className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>

                  {/* Terms and Privacy */}
                  <p className="text-xs font-outfit text-muted-foreground">
            Al registrarte, aceptas nuestros{' '}
                    <Link href="/terms" className="text-primary hover:text-primary/80 hover:underline transition-colors">
              Términos de Servicio
            </Link>{' '}
            y{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary/80 hover:underline transition-colors">
              Política de Privacidad
            </Link>
                  </p>
                </motion.div>
        </CardContent>
      </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
