'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2, 
  Users, 
  ShoppingCart, 
  CheckCircle, 
  DollarSign, 
  BarChart3,
  Package,
  MapPin,
  MessageSquare,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Check,
  Sparkles,
  Database,
  Lock,
  Mail,
  Phone,
  ExternalLink,
  Heart,
  Instagram
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const features = [
  {
    icon: Users,
    title: 'CRM Inteligente',
    description: 'Gestiona leads y clientes con pipeline visual, seguimiento automático y conversión de leads.',
    bgGradient: 'from-nidia-green/40 to-nidia-turquoise/40',
    iconBg: 'bg-nidia-green/30',
    iconColor: 'text-nidia-green',
    borderColor: 'border-nidia-green/50',
  },
  {
    icon: ShoppingCart,
    title: 'Gestión de Órdenes',
    description: 'Control completo del ciclo de vida de órdenes desde creación hasta entrega y facturación.',
    bgGradient: 'from-nidia-purple/40 to-nidia-blue/40',
    iconBg: 'bg-nidia-purple/30',
    iconColor: 'text-nidia-purple',
    borderColor: 'border-nidia-purple/50',
  },
  {
    icon: CheckCircle,
    title: 'Operaciones en Campo',
    description: 'Gestión de tareas con GPS, evidencias fotográficas y seguimiento en tiempo real.',
    bgGradient: 'from-nidia-turquoise/40 to-nidia-green/40',
    iconBg: 'bg-nidia-turquoise/30',
    iconColor: 'text-nidia-turquoise',
    borderColor: 'border-nidia-turquoise/50',
  },
  {
    icon: Package,
    title: 'Control de Inventario',
    description: 'Gestión de productos, servicios y combos con alertas automáticas de stock bajo.',
    bgGradient: 'from-nidia-blue/40 to-nidia-purple/40',
    iconBg: 'bg-nidia-blue/30',
    iconColor: 'text-nidia-blue',
    borderColor: 'border-nidia-blue/50',
  },
  {
    icon: DollarSign,
    title: 'Contabilidad Básica',
    description: 'Control financiero con reportes, análisis de rentabilidad y flujo de caja.',
    bgGradient: 'from-nidia-green/40 to-nidia-turquoise/40',
    iconBg: 'bg-nidia-green/30',
    iconColor: 'text-nidia-green',
    borderColor: 'border-nidia-green/50',
  },
  {
    icon: BarChart3,
    title: 'Reportes y Analytics',
    description: 'Dashboard con métricas en tiempo real, gráficos y análisis de rendimiento.',
    bgGradient: 'from-nidia-purple/40 to-nidia-blue/40',
    iconBg: 'bg-nidia-purple/30',
    iconColor: 'text-nidia-purple',
    borderColor: 'border-nidia-purple/50',
  },
  {
    icon: MessageSquare,
    title: 'Comunicación Integrada',
    description: 'Integración con WhatsApp Business y correo electrónico para atención al cliente.',
    bgGradient: 'from-nidia-turquoise/40 to-nidia-green/40',
    iconBg: 'bg-nidia-turquoise/30',
    iconColor: 'text-nidia-turquoise',
    borderColor: 'border-nidia-turquoise/50',
  },
  {
    icon: MapPin,
    title: 'Seguimiento GPS',
    description: 'Rastreo en tiempo real de operaciones en campo con geolocalización.',
    bgGradient: 'from-nidia-blue/40 to-nidia-purple/40',
    iconBg: 'bg-nidia-blue/30',
    iconColor: 'text-nidia-blue',
    borderColor: 'border-nidia-blue/50',
  },
];

const benefits = [
  'Multi-tenant con aislamiento completo de datos',
  'Arquitectura escalable y segura',
  'Interfaz intuitiva y moderna',
  'Actualizaciones en tiempo real',
  'Soporte para múltiples usuarios y roles',
  'Reportes y analytics avanzados',
];

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Parallax scroll effects - using window scroll instead of refs to avoid hydration issues
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const featuresY = useTransform(scrollYProgress, [0.2, 0.8], [0, -50]);

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true);
  }, []);

  // No auto-redirect - allow users to stay on home page if authenticated
  // They can click "Go to Dashboard" button to navigate

  // Determinar qué logo usar según el tema
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="font-outfit text-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Logo y selector de tema */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group">
              <Image
                src={logoSrc}
                alt="NIDIA Flow Logo"
                width={80}
                height={80}
                className="w-20 h-20 md:w-24 md:h-24 transition-transform group-hover:scale-105"
                priority
              />
            </Link>
            {/* Selector de tema */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden pt-40 pb-32 px-4 bg-background">
        {/* Animated tech grid pattern */}
        <motion.div 
          style={{ 
            y: heroY,
          }}
          className="absolute inset-0 z-0 tech-grid-bg opacity-30 dark:opacity-50 animate-tech-grid pointer-events-none" 
        />
        {/* Glowing orbs - más sutiles */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-64 h-64 bg-muted/20 dark:bg-muted/5 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-muted/20 dark:bg-muted/5 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-muted/5 dark:bg-muted/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0"
        />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto max-w-6xl relative z-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted dark:bg-muted/30 border-2 border-border mb-6 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium font-outfit text-muted-foreground">
                Micro-ERP + CRM para Microempresas
              </span>
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold font-outfit mb-6 text-foreground relative"
            >
            NIDIA Flow
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-outfit text-foreground mb-4 max-w-3xl mx-auto leading-relaxed font-light px-4"
            >
              Sistema administrativo-operacional completo para{' '}
              <span className="font-semibold text-foreground">microempresas</span> y{' '}
              <span className="font-semibold text-foreground">empresas de servicios</span>
            </motion.p>
            
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base md:text-lg font-outfit text-muted-foreground mb-12 max-w-2xl mx-auto px-4"
            >
              Combina gestión comercial, operativa y comunicacional en una plataforma unificada
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              {isAuthenticated ? (
                // Si está autenticado, mostrar botón "Ir al Dashboard"
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    y: -2,
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 20,
                    mass: 0.8
                  }}
                  className="relative"
                >
                  <Button
                    size="lg"
                    variant="default"
                    className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg font-bold z-20"
                    onClick={() => {
                      const userRole = user?.systemRole || user?.role;
                      const dashboardPath = userRole === 'super_admin' ? '/superadmin/dashboard' : '/dashboard';
                      router.push(dashboardPath);
                    }}
                  >
                    <span className="flex items-center">
                      Ir al Dashboard
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="ml-2"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </span>
                  </Button>
                </motion.div>
              ) : (
                // Si NO está autenticado, mostrar botones normales
                <>
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 20,
                      mass: 0.8
                    }}
                    className="relative"
                  >
                    <Button
                      size="lg"
                      variant="default"
                      className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg font-bold z-20"
                      asChild
                    >
                      <Link href="/register">
                        <span className="flex items-center">
                          Comenzar Ahora
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="ml-2"
                          >
                            <ArrowRight className="h-5 w-5" />
                          </motion.span>
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 20,
                      mass: 0.8
                    }}
                    className="relative"
                  >
                    <Button
                      size="lg"
                      variant="secondary"
                      className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg font-bold"
                      asChild
                    >
                      <Link href="/login">
                        Iniciar Sesión
                      </Link>
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto px-4"
          >
            {[
              { label: 'Módulos', value: '8+', borderClass: 'border-2 border-border' },
              { label: 'Multi-tenant', value: '100%', borderClass: 'border-2 border-border' },
              { label: 'Tiempo Real', value: '24/7', borderClass: 'border-2 border-border' },
              { label: 'Seguridad', value: 'Enterprise', borderClass: 'border-2 border-border' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`text-center p-3 sm:p-4 md:p-6 rounded-xl bg-card dark:bg-card/30 border-2 border-border shadow-sm`}
              >
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-outfit text-foreground mb-1 sm:mb-2 break-words">{stat.value}</div>
                <div className="text-xs sm:text-sm font-outfit text-muted-foreground font-medium break-words">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 relative overflow-hidden bg-background">
        {/* Animated background elements */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-96 h-96 bg-muted/5 dark:bg-muted/3 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-muted/5 dark:bg-muted/3 rounded-full blur-3xl"
        />
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-outfit mb-4 text-foreground px-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground max-w-2xl mx-auto px-4">
              Módulos integrados diseñados para optimizar tu negocio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className={`group relative p-6 rounded-xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300`}
              >
                {/* Tech accent lines with animation - más sutiles */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1 bg-muted dark:bg-muted/20"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Shine effect on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 dark:via-white/20 to-transparent pointer-events-none" />
                {/* Content */}
                <div className="relative z-10">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-muted dark:bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border-2 border-border"
                    whileHover={{
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <feature.icon className="h-7 w-7 text-foreground dark:text-muted-foreground" />
                  </motion.div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold font-outfit mb-2 text-foreground">{feature.title}</h3>
                  <p className="font-outfit text-muted-foreground leading-relaxed text-xs sm:text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 relative bg-background">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-outfit mb-6 text-foreground px-4">
                ¿Por qué elegir NIDIA Flow?
              </h2>
              <p className="text-sm sm:text-base md:text-lg font-outfit text-muted-foreground mb-8 leading-relaxed px-4">
                Diseñado específicamente para microempresas y empresas de servicios que buscan
                una solución completa, escalable y fácil de usar.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 w-6 h-6 rounded-full bg-muted dark:bg-muted/20 flex items-center justify-center flex-shrink-0 border-2 border-border">
                      <Check className="h-4 w-4 text-foreground dark:text-muted-foreground" />
                    </div>
                    <p className="text-sm sm:text-base font-outfit text-foreground">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative p-8 rounded-2xl bg-card dark:bg-card/30 border-2 border-border shadow-sm">
                {/* Tech accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted dark:bg-muted/20" />
                <div className="space-y-6">
                  {[
                    { icon: Shield, title: 'Seguridad Enterprise', desc: 'Aislamiento completo de datos por tenant' },
                    { icon: Zap, title: 'Rendimiento', desc: 'Arquitectura optimizada para velocidad' },
                    { icon: TrendingUp, title: 'Escalabilidad', desc: 'Crece con tu negocio sin límites' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 dark:bg-card/50 border-2 border-border"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted dark:bg-muted/20 flex items-center justify-center flex-shrink-0 border-2 border-border">
                        <item.icon className="h-6 w-6 text-foreground dark:text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold font-outfit text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm font-outfit text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-4 relative bg-background">
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-outfit mb-4 text-foreground px-4">
              Arquitectura Empresarial
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-outfit text-muted-foreground max-w-2xl mx-auto px-4">
              Construido con las mejores prácticas de seguridad y escalabilidad
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: 'Multi-Tenant', desc: 'Base de datos aislada por empresa' },
              { icon: Lock, title: 'Seguridad', desc: 'Aislamiento completo de datos' },
              { icon: Zap, title: 'Tiempo Real', desc: 'Actualizaciones instantáneas' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-xl bg-card dark:bg-card/30 border-2 border-border shadow-sm relative overflow-hidden group"
              >
                {/* Tech accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted dark:bg-muted/20" />
                <div className="w-16 h-16 rounded-xl bg-muted dark:bg-muted/20 flex items-center justify-center mb-4 border-2 border-border group-hover:scale-110 transition-transform">
                  <item.icon className="h-8 w-8 text-foreground dark:text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold font-outfit text-foreground mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base font-outfit text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden bg-background">
        {/* Animated tech grid pattern */}
        <div className="absolute inset-0 tech-grid-bg opacity-20 dark:opacity-15 animate-tech-grid" />
        <div className="container mx-auto max-w-4xl text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-outfit mb-6 text-foreground px-4">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground mb-10 max-w-2xl mx-auto px-4">
              Únete a las microempresas que ya están optimizando sus operaciones con NIDIA Flow
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20,
                  mass: 0.8
                }}
                className="relative"
              >
                  <Button
                    size="lg"
                  variant="default"
                  className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg font-bold"
                  asChild
                  >
                  <Link href="/register">
                    <span className="flex items-center">
                      Crear Cuenta Gratis
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="ml-2"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </span>
                  </Link>
                  </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20,
                  mass: 0.8
                }}
                className="relative"
              >
                  <Button
                    size="lg"
                    variant="outline"
                  className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg font-bold border-2"
                  asChild
                >
                  <Link href="/login">
                    Iniciar Sesión
                  </Link>
                  </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Simple y funcional */}
      <footer className="py-12 px-4 border-t border-border bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Logo y descripción */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={logoSrc}
                  alt="NIDIA Flow Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                  priority
                />
                <h3 className="text-lg font-bold font-outfit text-foreground">
                  NIDIA Flow
                </h3>
              </div>
              <p className="text-sm font-outfit text-muted-foreground mb-3">
                Ideas y soluciones a tus necesidades
              </p>
              <p className="text-sm font-outfit text-muted-foreground">
                Software personalizado y soluciones digitales innovadoras para empresas.
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="text-sm font-semibold font-outfit mb-4 text-foreground">Enlaces</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm font-outfit text-muted-foreground hover:text-primary transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://nidia.com.co" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-outfit text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    Sobre NIDIA
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://nidia.com.co/#contacto" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-outfit text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    Contacto
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-semibold font-outfit mb-4 text-foreground">Contacto</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:hola@nidia.com.co" 
                    className="text-sm font-outfit text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    hola@nidia.com.co
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/573226395193" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-outfit text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    +57 322 639 5193
                  </a>
                </li>
                <li>
                  <span className="text-sm font-outfit text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Cali, Colombia
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-outfit text-muted-foreground">
              © 2025 NIDIA Flow. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://nidia.com.co/privacidad" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-outfit text-muted-foreground hover:text-primary transition-colors"
              >
                Privacidad
              </a>
              <a 
                href="https://nidia.com.co/terminos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-outfit text-muted-foreground hover:text-primary transition-colors"
              >
                Términos
              </a>
              <span className="text-xs font-outfit text-muted-foreground flex items-center gap-1">
                Hecho con <Heart className="h-3 w-3 text-red-500 fill-red-500" /> con pasión
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
