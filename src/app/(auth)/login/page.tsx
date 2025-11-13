'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { loginSchema, type LoginData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Shield, Zap, TrendingUp } from 'lucide-react';

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

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { login, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar qué logo usar según el tema
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setError(null);
    
    const result = await login(data);
    
    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión');
    }
  };

  const features = [
    { icon: Shield, text: 'Seguridad Enterprise' },
    { icon: Zap, text: 'Tiempo Real' },
    { icon: TrendingUp, text: 'Escalable' },
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
                  Bienvenido de vuelta
                </h2>
                <p className="text-lg xl:text-xl font-outfit text-muted-foreground leading-relaxed">
                  Accede a tu plataforma de gestión empresarial y optimiza tus operaciones.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div variants={itemVariants} className="space-y-4 pt-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    variants={itemVariants}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-outfit text-foreground font-medium">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <motion.div
            variants={itemVariants}
            className="w-full flex items-center justify-center lg:justify-end"
          >
            <Card className="w-full max-w-md lg:max-w-lg border-2 border-border bg-card dark:bg-card/80 backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center space-y-4 pb-6 pt-8 px-6 sm:px-8">
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
                    Iniciar Sesión
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base font-outfit text-muted-foreground">
                    {expired 
                      ? 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
                      : 'Ingresa tus credenciales para acceder a tu cuenta'}
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-8">
                <motion.form
                  variants={itemVariants}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5 sm:space-y-6"
                >
                  <AnimatePresence>
                    {(error || expired) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="p-4 text-sm font-outfit text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-lg"
                      >
                        {error || (expired && 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label 
                      htmlFor="email" 
                      className="text-sm sm:text-base font-outfit text-foreground font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@empresa.com"
                      {...register('email')}
                      className={`h-11 sm:h-12 text-base sm:text-lg font-outfit ${
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

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label 
                      htmlFor="password" 
                      className="text-sm sm:text-base font-outfit text-foreground font-medium"
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        className={`h-11 sm:h-12 text-base sm:text-lg font-outfit pr-12 ${
                          errors.password 
                            ? 'border-destructive focus-visible:ring-destructive' 
                            : 'border-primary/30 focus-visible:ring-primary'
                        }`}
                        autoComplete="current-password"
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

                  {/* Forgot Password Link */}
                  <div className="flex items-center justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-sm sm:text-base font-outfit text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      variant="default"
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold font-outfit"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Iniciando sesión...
                        </>
                      ) : (
                        'Iniciar Sesión'
                      )}
                    </Button>
                  </motion.div>
                </motion.form>

                {/* Register Link */}
                <motion.div 
                  variants={itemVariants} 
                  className="mt-6 sm:mt-8 text-center pt-4 border-t border-border"
                >
                  <p className="text-sm sm:text-base font-outfit text-muted-foreground">
                    ¿No tienes una cuenta?{' '}
                    <Link
                      href="/register"
                      className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                    >
                      Regístrate aquí
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
