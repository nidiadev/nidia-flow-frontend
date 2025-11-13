'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { registerSchema, type RegisterData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Building2, Users, Rocket } from 'lucide-react';

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
  const { register: registerUser, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar qué logo usar según el tema
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setError(null);
    
    const result = await registerUser(data);
    
    if (!result.success) {
      setError(result.message || 'Error al registrarse');
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
            Regístrate para comenzar
                  </CardDescription>
                </motion.div>
        </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-6">
                <motion.form
                  variants={itemVariants}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3 sm:space-y-4"
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
                    <div className="space-y-1.5">
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
                            className="text-sm font-outfit text-destructive"
                          >
                    {errors.firstName.message}
                          </motion.p>
                )}
                      </AnimatePresence>
              </div>

                    <div className="space-y-1.5">
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
                            className="text-sm font-outfit text-destructive"
                          >
                    {errors.lastName.message}
                          </motion.p>
                )}
                      </AnimatePresence>
              </div>
            </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
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
                          className="text-sm font-outfit text-destructive"
                        >
                  {errors.email.message}
                        </motion.p>
              )}
                    </AnimatePresence>
            </div>

                  {/* Company Field */}
                  <div className="space-y-1.5">
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
                          className="text-sm font-outfit text-destructive"
                        >
                  {errors.companyName.message}
                        </motion.p>
              )}
                    </AnimatePresence>
            </div>

                  {/* Phone Field */}
                  <div className="space-y-1.5">
                    <Label 
                      htmlFor="phone" 
                      className="text-sm font-outfit text-foreground font-medium"
                    >
                      Teléfono <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+57 300 123 4567"
                {...register('phone')}
                      className={`h-10 sm:h-11 text-sm sm:text-base font-outfit ${
                        errors.phone 
                          ? 'border-destructive focus-visible:ring-destructive' 
                          : 'border-primary/30 focus-visible:ring-primary'
                      }`}
                      autoComplete="tel"
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
                  <div className="space-y-1.5">
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
