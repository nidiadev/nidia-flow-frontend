'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { AuthService } from '@/lib/auth';
import { forgotPasswordSchema, type ForgotPasswordData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, CheckCircle2, Shield } from 'lucide-react';

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

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
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
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setError(null);
    
    try {
      const result = await AuthService.forgotPassword(data);
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.message || 'Error al enviar el email de recuperación');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al enviar el email de recuperación');
    }
  };

  if (isSubmitted) {
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 items-center min-h-[600px]">
            {/* Left side - Branding */}
            <motion.div
              variants={slideInVariants}
              className="hidden lg:flex flex-col justify-center items-start h-full px-8 xl:px-12 py-12"
            >
              <div className="w-full max-w-md space-y-8">
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
                    Email enviado
                  </h2>
                  <p className="text-lg xl:text-xl font-outfit text-muted-foreground leading-relaxed">
                    Revisa tu bandeja de entrada para restablecer tu contraseña de forma segura.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base font-outfit text-foreground font-medium">
                    Seguridad y privacidad garantizadas
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right side - Success Message */}
            <motion.div
              variants={successVariants}
              className="w-full flex items-center justify-center lg:justify-end"
            >
              <Card className="w-full max-w-md lg:max-w-lg border-2 border-border bg-card dark:bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-6 pt-8 px-6 sm:px-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="mx-auto w-20 h-20 bg-nidia-green/10 dark:bg-nidia-green/20 rounded-full flex items-center justify-center border-2 border-nidia-green/30 mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-nidia-green" />
                  </motion.div>
                  
                  <CardTitle className="text-2xl sm:text-3xl font-bold font-outfit text-foreground">
                    Email Enviado
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base font-outfit text-muted-foreground">
                    Hemos enviado un enlace de recuperación a{' '}
                    <span className="font-semibold text-primary">
                      {getValues('email')}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 sm:px-8 pb-8 space-y-4">
                  <p className="text-sm sm:text-base font-outfit text-muted-foreground text-center">
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                  
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-outfit"
                    >
                      Enviar de nuevo
                    </Button>
                    
                    <Link href="/login" className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-outfit"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Volver al inicio de sesión
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 items-center min-h-[600px]">
          {/* Left side - Branding */}
          <motion.div
            variants={slideInVariants}
            className="hidden lg:flex flex-col justify-center items-start h-full px-8 xl:px-12 py-12"
          >
            <div className="w-full max-w-md space-y-8">
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
                  <h1 className="text-3xl xl:text-4xl font-bold font-outfit text-foreground dark:text-nidia-white">
                  </h1>
                </Link>
                
                <h2 className="text-4xl xl:text-5xl font-bold font-outfit text-foreground leading-tight">
                  Recuperar contraseña
                </h2>
                <p className="text-lg xl:text-xl font-outfit text-muted-foreground leading-relaxed">
                  Te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-outfit text-foreground font-medium">
                  Recuperación segura y rápida
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            variants={itemVariants}
            className="w-full flex items-center justify-center lg:justify-end"
          >
            <Card className="w-full max-w-md lg:max-w-lg border-2 border-primary/20 dark:border-primary/30 bg-card/95 dark:bg-card/80 backdrop-blur-xl shadow-2xl">
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
                    <h1 className="text-2xl font-bold font-outfit text-foreground">
                    </h1>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/20 mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold font-outfit text-foreground mb-2">
                    Recuperar Contraseña
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base font-outfit text-muted-foreground">
                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
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
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="p-4 text-sm font-outfit text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-lg"
                      >
                        {error}
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-5 w-5" />
                          Enviar Enlace de Recuperación
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>

                {/* Back to Login Link */}
                <motion.div 
                  variants={itemVariants} 
                  className="mt-6 sm:mt-8 text-center pt-4 border-t border-border"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm sm:text-base font-outfit text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
