'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { StructuredData } from '@/components/seo/structured-data';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { WaitlistModal } from '@/components/waitlist/waitlist-modal';
import { useQuery } from '@tanstack/react-query';
import { publicApi, PublicPlan } from '@/lib/api/public';
import { formatCurrency, cn } from '@/lib/utils';
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
  Instagram,
  Settings
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

// Funcionalidades disponibles ahora (Lanzamiento: Marzo 2026)
const availableFeatures = [
  {
    icon: Users,
    title: 'Gestión de Clientes',
    description: 'Administra todos tus clientes, contactos y oportunidades. Lleva un registro de todas tus conversaciones y asigna seguimientos a tu equipo.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
  {
    icon: ShoppingCart,
    title: 'Gestión de Órdenes',
    description: 'Control completo del ciclo de vida de órdenes: creación, estados, múltiples productos, cálculo de totales y asignación.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
  {
    icon: CheckCircle,
    title: 'Gestión de Tareas',
    description: 'Asignación de tareas a técnicos, checklists, prioridades, vinculación con órdenes y seguimiento de estados.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
  {
    icon: Package,
    title: 'Control de Inventario',
    description: 'Catálogo de productos con categorías, variantes, imágenes, precios e impuestos. Alertas de stock bajo.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
  {
    icon: DollarSign,
    title: 'Pagos y Finanzas',
    description: 'Registra todos los pagos que recibes y los gastos que haces. Organiza tus finanzas por categorías y lleva el control de tus cuentas bancarias.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
  {
    icon: BarChart3,
    title: 'Vista General y Reportes',
    description: 'Mira cómo va tu negocio con gráficas y números en tiempo real. Ve tus pedidos, productos más vendidos, alertas de inventario y tareas pendientes.',
    bgGradient: 'from-muted/30 to-muted/20',
    iconBg: 'bg-muted/20',
    iconColor: 'text-foreground',
    borderColor: 'border-border',
  },
];

// Funcionalidades que vendrán próximamente (Roadmap 2026-2027)
// Q2 2026 = Abril-Junio, Q3 2026 = Julio-Septiembre, Q4 2026 = Octubre-Diciembre
const comingSoonFeatures = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Business',
    description: 'Envía mensajes automáticos a tus clientes, notificaciones de pedidos y recordatorios importantes directamente por WhatsApp.',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-500/30',
    badge: 'Q2 2026',
  },
  {
    icon: MapPin,
    title: 'Seguimiento GPS en Tiempo Real',
    description: 'Ubica a tu equipo en tiempo real, calcula distancias, optimiza rutas y visualiza todo en mapas interactivos.',
    bgGradient: 'from-blue-500/20 to-purple-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
    badge: 'Q2 2026',
  },
  {
    icon: Zap,
    title: 'App Móvil',
    description: 'Aplicación móvil para tu equipo con registro de ubicación, captura de fotos, firma digital y funcionamiento sin internet.',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30',
    badge: 'Q3 2026',
  },
  {
    icon: Shield,
    title: 'Firma Digital',
    description: 'Captura firmas de clientes directamente en tu dispositivo para confirmar servicios, entregas y acuerdos.',
    bgGradient: 'from-green-500/20 to-teal-500/20',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/30',
    badge: 'Q3 2026',
  },
  {
    icon: Users,
    title: 'Portal para Clientes',
    description: 'Tus clientes podrán ver el estado de sus pedidos, agendar citas y comunicarse contigo desde su propio portal.',
    bgGradient: 'from-indigo-500/20 to-blue-500/20',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500/30',
    badge: 'Q3 2026',
  },
  {
    icon: BarChart3,
    title: 'Reportes Avanzados',
    description: 'Análisis profundo de tu negocio con reportes personalizados, comparativas y proyecciones inteligentes.',
    bgGradient: 'from-pink-500/20 to-rose-500/20',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-500/30',
    badge: 'Q3 2026',
  },
  {
    icon: ShoppingCart,
    title: 'Integraciones E-commerce',
    description: 'Conecta tu tienda online con NIDIA Flow para sincronizar pedidos, inventario y clientes automáticamente.',
    bgGradient: 'from-cyan-500/20 to-teal-500/20',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-500/30',
    badge: 'Q4 2026',
  },
  {
    icon: Package,
    title: 'Múltiples Almacenes',
    description: 'Gestiona inventario en varias ubicaciones, transfiere productos entre almacenes y controla stock centralizado.',
    bgGradient: 'from-amber-500/20 to-yellow-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
    badge: 'Q4 2026',
  },
  {
    icon: DollarSign,
    title: 'Facturación Electrónica',
    description: 'Genera facturas electrónicas automáticamente, envíalas por email y mantén el control de tu facturación.',
    bgGradient: 'from-emerald-500/20 to-green-500/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30',
    badge: 'Q4 2026',
  },
  {
    icon: Settings,
    title: 'Automatizaciones Inteligentes',
    description: 'Crea reglas automáticas para tu negocio: notificaciones, asignaciones, recordatorios y más, sin intervención manual.',
    bgGradient: 'from-violet-500/20 to-purple-500/20',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-500/30',
    badge: 'Q4 2026',
  },
];

const benefits = [
  'Cada negocio tiene su espacio privado y seguro',
  'Diseñado para crecer con tu negocio',
  'Fácil de usar, sin complicaciones',
  'Funciona en todos tus dispositivos',
  'Múltiples usuarios con diferentes permisos',
  'Reportes y gráficas para tomar mejores decisiones',
];

// Componente para mostrar preview de planes
function PlansPreviewSection({ onWaitlistClick }: { onWaitlistClick: () => void }) {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => publicApi.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mostrar solo los primeros 3 planes
  const previewPlans = plans?.slice(0, 3) || [];
  const sortedPlans = [...previewPlans].sort((a, b) => {
    const priceA = a.priceMonthly ? Number(a.priceMonthly) : 0;
    const priceB = b.priceMonthly ? Number(b.priceMonthly) : 0;
    return priceA - priceB;
  });
  const popularPlanIndex = sortedPlans.length > 0 ? Math.floor(sortedPlans.length / 2) : -1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No hay planes disponibles en este momento.</p>
        <Button asChild>
          <Link href="/planes">Ver Planes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {sortedPlans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className={`relative p-8 rounded-2xl bg-card dark:bg-card/40 border-2 ${
            index === popularPlanIndex ? 'border-nidia-blue shadow-lg scale-105' : 'border-border shadow-sm'
          }`}
        >
          {(plan.badge || index === popularPlanIndex) && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className={`bg-${plan.badgeColor === 'blue' ? 'nidia-blue' : plan.badgeColor === 'green' ? 'nidia-green' : plan.badgeColor === 'purple' ? 'nidia-purple' : 'nidia-blue'} text-white`}>
                {plan.badge || 'Popular'}
              </Badge>
            </div>
          )}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            plan.accentColor === 'blue' ? 'from-nidia-blue to-nidia-purple' :
            plan.accentColor === 'green' ? 'from-nidia-green to-nidia-turquoise' :
            plan.accentColor === 'purple' ? 'from-nidia-purple to-nidia-blue' :
            index === popularPlanIndex ? 'from-nidia-blue to-nidia-purple' : 'from-nidia-green to-nidia-turquoise'
          }`} />
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold font-outfit text-foreground">{plan.displayName}</h3>
              <Badge variant="secondary" className="bg-nidia-green/20 text-nidia-green border-nidia-green/50">
                Base Dedicada
              </Badge>
            </div>
            <div className="mb-4">
              {plan.priceMonthly && Number(plan.priceMonthly) > 0 ? (
                <>
                  <span className="text-4xl font-bold font-outfit text-foreground">
                    {formatCurrency(Number(plan.priceMonthly), plan.currency)}
                  </span>
                  <span className="text-muted-foreground font-outfit">/mes</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold font-outfit text-foreground">Gratis</span>
                </>
              )}
            </div>
            {plan.description && (
              <p className="text-sm font-outfit text-muted-foreground mb-4">{plan.description}</p>
            )}
          </div>
          <ul className="space-y-3 mb-8">
            {/* Características destacadas primero si existen */}
            {plan.featuredFeatures && plan.featuredFeatures.length > 0 && (
              <>
                {plan.featuredFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-outfit text-foreground font-semibold">{feature}</span>
                  </li>
                ))}
              </>
            )}
            {plan.maxUsers && (
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
                <span className="text-sm font-outfit text-foreground">
                  {plan.maxUsers === -1 ? 'Usuarios ilimitados' : `${plan.maxUsers} usuarios`}
                </span>
              </li>
            )}
            {plan.maxStorageGb && (
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
                <span className="text-sm font-outfit text-foreground">
                  {plan.maxStorageGb === -1 ? 'Almacenamiento ilimitado' : `${plan.maxStorageGb} GB`}
                </span>
              </li>
            )}
            {plan.moduleAssignments && plan.moduleAssignments.length > 0 && (
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
                <span className="text-sm font-outfit text-foreground">
                  {plan.moduleAssignments.length} módulo{plan.moduleAssignments.length > 1 ? 's' : ''}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
              <span className="text-sm font-outfit text-foreground">Base de datos dedicada</span>
            </li>
          </ul>
          <Button 
            className="w-full" 
            variant={index === popularPlanIndex ? 'default' : 'outline'}
            onClick={onWaitlistClick}
          >
            Únete a la Lista de Espera
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { route, tenantSlug, isSuperAdmin } = useTenantRoutes();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Si es tenant autenticado pero no tiene slug, intentar refrescar el token
  // Solo una vez, no en loop
  const hasTriedRefresh = useRef(false);
  
  useEffect(() => {
    // Solo intentar refrescar si:
    // 1. Está autenticado
    // 2. No es superadmin
    // 3. No tiene tenantSlug
    // 4. No está ya refrescando
    // 5. No está cargando (para evitar refrescar durante la carga inicial)
    // 6. No se ha intentado refrescar antes (evitar loops)
    if (
      isAuthenticated && 
      !isLoading && 
      !isSuperAdmin && 
      !tenantSlug && 
      !isRefreshing && 
      !hasTriedRefresh.current
    ) {
      hasTriedRefresh.current = true;
      setIsRefreshing(true);
      
      const tryRefresh = async () => {
        try {
          console.log('🔄 Intentando refrescar token para obtener tenantSlug...');
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            console.log('✅ Token refrescado exitosamente');
            // Verificar si ahora tenemos tenantSlug
            const newTenantSlug = AuthService.getTenantSlug();
            if (newTenantSlug) {
              console.log('✅ tenantSlug obtenido:', newTenantSlug);
              // Recargar la página para actualizar el estado con el nuevo token
              window.location.reload();
            } else {
              console.warn('⚠️ Token refrescado pero aún no hay tenantSlug - puede ser un problema del backend');
              // Si después del refresh aún no hay slug, redirigir al login después de un delay
              setTimeout(() => {
                router.push('/login?expired=true');
              }, 2000);
            }
          } else {
            console.error('❌ No se pudo refrescar el token');
            // No se pudo refrescar, redirigir al login
            setTimeout(() => {
              router.push('/login?expired=true');
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Error al refrescar token:', error);
          // Error al refrescar, redirigir al login
          setTimeout(() => {
            router.push('/login?expired=true');
          }, 1000);
        } finally {
          setIsRefreshing(false);
        }
      };
      
      // Esperar un momento antes de intentar refrescar (para evitar conflictos con otros efectos)
      const timer = setTimeout(() => {
        tryRefresh();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Resetear el flag si el tenantSlug aparece (por ejemplo, después de un refresh exitoso)
    if (tenantSlug && hasTriedRefresh.current) {
      hasTriedRefresh.current = false;
    }
  }, [isAuthenticated, isLoading, isSuperAdmin, tenantSlug, isRefreshing, router]);
  
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
    <>
      <StructuredData />
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <PublicNavbar />

      {/* Hero Section - Layout horizontal profesional */}
      <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center px-4 sm:px-6 lg:px-8 bg-background pt-20">
        {/* Animated tech grid pattern - más sutil */}
        <motion.div 
          style={{ 
            y: heroY,
          }}
          className="absolute inset-0 z-0 tech-grid-bg opacity-10 dark:opacity-15 animate-tech-grid pointer-events-none" 
        />
        {/* Glowing orbs - más sutiles y posicionados mejor */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-nidia-green/5 dark:bg-nidia-green/3 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-nidia-purple/5 dark:bg-nidia-purple/3 rounded-full blur-3xl z-0"
        />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto max-w-7xl relative z-20 w-full py-8 lg:py-12"
        >
          {/* Layout horizontal: contenido a la izquierda, elementos visuales a la derecha */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Columna izquierda - Contenido principal */}
            <motion.div 
              variants={itemVariants} 
              className="space-y-8 lg:space-y-10"
            >
              {/* Badge de lanzamiento */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nidia-green/10 dark:bg-nidia-green/5 border border-nidia-green/30"
              >
                <Sparkles className="h-4 w-4 text-nidia-green" />
                <span className="text-xs sm:text-sm font-medium font-outfit text-nidia-green">
                  Próximamente - Marzo 2026
                </span>
              </motion.div>

              {/* Título principal */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-outfit text-foreground leading-[1.1] pb-1"
              >
                La Plataforma que{' '}
                <span className="block bg-gradient-to-r from-nidia-green via-nidia-turquoise to-nidia-green bg-clip-text text-transparent pb-0.5">
                  Transforma tu Negocio
                </span>
              </motion.h1>
              
              {/* Descripción principal */}
              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl md:text-2xl font-outfit text-foreground leading-relaxed font-medium"
              >
                La solución completa que tu empresa necesita para{' '}
                <span className="text-nidia-green font-semibold">crecer, optimizar y prosperar</span>
              </motion.p>
              
              {/* Descripción secundaria - Carta de presentación directa al cliente */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg font-outfit text-muted-foreground leading-relaxed max-w-xl"
              >
                Gestiona clientes, pedidos, inventario, pagos y operaciones desde una sola plataforma.{' '}
                <strong className="text-foreground">Tu información es 100% privada y segura</strong>, 
                diseñada exclusivamente para que puedas enfocarte en hacer crecer tu negocio.
              </motion.p>

              {/* CTA Principal - Lista de Espera */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-3 pt-6"
              >
                {isAuthenticated ? (
                  // Si está autenticado, mostrar botón "Ir al Dashboard"
                  (() => {
                    if (isSuperAdmin) {
                      return (
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Button
                            size="lg"
                            variant="default"
                            className="px-8 py-6 text-lg font-bold w-full sm:w-auto"
                            onClick={() => router.push('/superadmin/dashboard')}
                          >
                            <span className="flex items-center justify-center">
                              Ir al Dashboard
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </span>
                          </Button>
                        </motion.div>
                      );
                    }
                    
                    if (tenantSlug) {
                      return (
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Button
                            size="lg"
                            variant="default"
                            className="px-8 py-6 text-lg font-bold w-full sm:w-auto"
                            onClick={() => router.push(route('/dashboard'))}
                          >
                            <span className="flex items-center justify-center">
                              Ir al Dashboard
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </span>
                          </Button>
                        </motion.div>
                      );
                    }
                    
                    return (
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground text-center">Verificando sesión...</p>
                      </div>
                    );
                  })()
                ) : (
                  // Si NO está autenticado, mostrar botón de Lista de Espera con texto negro
                  <>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="relative"
                    >
                      <Button
                        size="lg"
                        variant="default"
                        className="px-8 py-6 text-lg font-bold bg-nidia-green hover:bg-nidia-green/90 text-black shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                        onClick={() => setWaitlistOpen(true)}
                      >
                        <span className="flex items-center justify-center">
                          Únete a la Lista de Espera
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
                    
                    {/* Texto de apoyo */}
                    <p className="text-sm font-outfit text-muted-foreground">
                      Sé el primero en conocer cuando NIDIA Flow esté disponible.{' '}
                      <strong className="text-foreground">Acceso prioritario y beneficios exclusivos</strong> para los primeros en unirse.
                    </p>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Columna derecha - Elementos visuales o información adicional */}
            <motion.div 
              variants={itemVariants}
              className="hidden lg:flex flex-col items-center justify-center space-y-8"
            >
              {/* Stats destacadas en formato vertical */}
              <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                {[
                  { icon: Package, value: '6+', label: 'Módulos', color: 'nidia-green' },
                  { icon: Shield, value: '100%', label: 'Privacidad', color: 'nidia-purple' },
                  { icon: Zap, value: '24/7', label: 'Disponible', color: 'nidia-blue' },
                  { icon: Database, value: 'Total', label: 'Seguridad', color: 'nidia-turquoise' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-6 rounded-xl bg-card dark:bg-card/40 border border-border hover:border-nidia-green/50 transition-all duration-300 text-center"
                  >
                    <stat.icon className={cn(
                      "h-6 w-6 mx-auto mb-3",
                      stat.color === 'nidia-green' && "text-nidia-green",
                      stat.color === 'nidia-purple' && "text-nidia-purple",
                      stat.color === 'nidia-blue' && "text-nidia-blue",
                      stat.color === 'nidia-turquoise' && "text-nidia-turquoise"
                    )} />
                    <div className="text-2xl font-bold font-outfit text-foreground mb-1">{stat.value}</div>
                    <div className="text-xs font-outfit text-muted-foreground font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Información adicional destacada */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-nidia-green/10 to-nidia-turquoise/10 dark:from-nidia-green/5 dark:to-nidia-turquoise/5 border border-nidia-green/20 w-full max-w-md"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-nidia-green/20 flex items-center justify-center flex-shrink-0 border border-nidia-green/30">
                    <Shield className="h-6 w-6 text-nidia-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-outfit text-foreground mb-2">
                      Base de Datos Dedicada
                    </h3>
                    <p className="text-sm font-outfit text-muted-foreground leading-relaxed">
                      Cada empresa tiene su propio espacio completamente privado. Tus datos nunca se mezclan con los de otras empresas.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Modal de Lista de Espera */}
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-4 relative overflow-hidden bg-background">
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nidia-green/10 dark:bg-nidia-green/5 border-2 border-nidia-green/30 mb-6"
            >
              <CheckCircle className="h-4 w-4 text-nidia-green" />
              <span className="text-xs sm:text-sm font-medium font-outfit text-nidia-green">
                Disponible desde Marzo 2026
              </span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-outfit mb-6 text-foreground px-4">
              Todo lo que Necesitas para Empezar
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground max-w-3xl mx-auto px-4">
              Desde el primer día tendrás acceso a todas estas funcionalidades. Diseñadas para que puedas gestionar tu negocio de forma completa y profesional.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30" />
                
                {/* Shine effect on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 dark:via-white/10 to-transparent pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                  <motion.div 
                      className="w-16 h-16 rounded-xl bg-muted/20 flex items-center justify-center border border-border group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="h-8 w-8 text-foreground" />
                  </motion.div>
                    <Badge variant="secondary" className="bg-muted/30 text-muted-foreground text-xs font-semibold border-border">
                      Disponible
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold font-outfit mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="font-outfit text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Features - Carousel Automático */}
          {comingSoonFeatures.length > 0 && (
            <div className="mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-outfit mb-4 text-foreground px-4">
                  Próximamente en el Roadmap
                </h2>
                <p className="text-base sm:text-lg font-outfit text-muted-foreground max-w-2xl mx-auto px-4">
                  Funcionalidades avanzadas que estamos desarrollando para 2026
                </p>
              </motion.div>

              {/* Carousel Container */}
              <div className="relative overflow-hidden py-4">
                {/* Gradient overlays para efecto fade */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                
                {/* Carousel animado */}
                <div className="flex gap-6 animate-scroll">
                  {/* Duplicar items para loop infinito */}
                  {[...comingSoonFeatures, ...comingSoonFeatures].map((feature, index) => (
                    <motion.div
                      key={`${feature.title}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="group relative flex-shrink-0 w-[320px] p-6 rounded-2xl bg-card dark:bg-card/40 border-2 border-border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.bgGradient}`} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <motion.div 
                            className="w-16 h-16 rounded-xl bg-muted dark:bg-muted/20 flex items-center justify-center border-2 border-border group-hover:scale-110 transition-transform"
                            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                          </motion.div>
                          {feature.badge && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
                              {feature.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className={`text-lg font-bold font-outfit mb-3 ${feature.iconColor}`}>
                          {feature.title}
                        </h3>
                        <p className="font-outfit text-muted-foreground leading-relaxed text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section - Mejorada e Interactiva */}
      <section className="py-24 px-4 relative bg-background overflow-hidden">
        {/* Animated background */}
            <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-muted/5 dark:bg-muted/3 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-muted/5 dark:bg-muted/3 rounded-full blur-3xl"
        />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            className="text-center mb-16"
            >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-outfit mb-6 text-foreground px-4">
                ¿Por qué elegir NIDIA Flow?
              </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground max-w-3xl mx-auto px-4">
              La solución completa que necesitas para hacer crecer tu negocio. Diseñado pensando en ti y en tu equipo.
            </p>
          </motion.div>

          {/* Grid de beneficios principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Shield,
                title: 'Tu Información 100% Privada',
                description: 'Cada negocio tiene su propia base de datos dedicada. Tus datos nunca se mezclan con los de otras empresas.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
              {
                icon: Zap,
                title: 'Rápido y Fácil de Usar',
                description: 'Diseñado para que cualquier persona pueda usarlo sin complicaciones. Sin necesidad de capacitaciones largas.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
              {
                icon: TrendingUp,
                title: 'Crece con tu Negocio',
                description: 'Empieza pequeño y crece sin límites. Añade más usuarios, más almacenamiento y más funcionalidades cuando las necesites.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
              {
                icon: Database,
                title: 'Todo en un Solo Lugar',
                description: 'Clientes, pedidos, inventario, pagos y operaciones. Todo centralizado para que no tengas que cambiar entre sistemas.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
              {
                icon: Lock,
                title: 'Seguridad de Nivel Empresarial',
                description: 'Tu información está protegida con los más altos estándares. Backups automáticos y encriptación de extremo a extremo.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
              {
                icon: Sparkles,
                title: 'Soporte Dedicado',
                description: 'Equipo de soporte listo para ayudarte cuando lo necesites. Respuestas rápidas y soluciones efectivas.',
                color: 'muted',
                gradient: 'from-muted/20 to-muted/10',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-border bg-muted/20">
                    <benefit.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-sm font-outfit text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lista de beneficios adicionales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
          >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border hover:bg-muted/50 transition-colors"
                  >
                <div className="mt-1 w-6 h-6 rounded-full bg-nidia-green/20 flex items-center justify-center flex-shrink-0 border-2 border-nidia-green/50">
                  <Check className="h-4 w-4 text-nidia-green" />
                    </div>
                    <p className="text-sm sm:text-base font-outfit text-foreground">{benefit}</p>
                  </motion.div>
                ))}
            </motion.div>
        </div>
      </section>

      {/* Privacy & Security Section - Mejorada */}
      <section className="py-24 px-4 relative bg-background overflow-hidden">
        {/* Animated background elements */}
            <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-72 h-72 bg-nidia-green/5 dark:bg-nidia-green/3 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-nidia-purple/5 dark:bg-nidia-purple/3 rounded-full blur-3xl"
        />

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nidia-green/10 dark:bg-nidia-green/5 border-2 border-nidia-green/30 mb-6"
            >
              <Shield className="h-4 w-4 text-nidia-green" />
              <span className="text-xs sm:text-sm font-medium font-outfit text-nidia-green">
                Seguridad y Privacidad Garantizadas
              </span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-outfit mb-6 text-foreground px-4">
              Tu Información, Tu Privacidad
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground max-w-3xl mx-auto px-4">
              Cada negocio tiene su propio espacio completamente privado. Tus datos son solo tuyos y están protegidos con los más altos estándares de seguridad.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: 'Tu Espacio Privado',
                description: 'Cada negocio tiene su propio espacio completamente separado. Tus datos nunca se mezclan con los de otras empresas, garantizando total privacidad.',
                gradient: 'from-muted/20 to-muted/10',
                iconBg: 'bg-muted/20',
                iconColor: 'text-foreground',
                borderColor: 'border-border',
              },
              {
                icon: Lock,
                title: 'Protección Total',
                description: 'Tu información está protegida con encriptación avanzada. Solo tú y tu equipo autorizado pueden acceder a tus datos.',
                gradient: 'from-muted/20 to-muted/10',
                iconBg: 'bg-muted/20',
                iconColor: 'text-foreground',
                borderColor: 'border-border',
              },
              {
                icon: Shield,
                title: 'Backups Automáticos',
                description: 'Tus datos se respaldan automáticamente todos los días. Nunca perderás información importante, incluso si algo sale mal.',
                gradient: 'from-muted/20 to-muted/10',
                iconBg: 'bg-muted/20',
                iconColor: 'text-foreground',
                borderColor: 'border-border',
              },
              {
                icon: Zap,
                title: 'Sincronización Instantánea',
                description: 'Todos tus cambios se guardan y sincronizan automáticamente. Accede a tu información actualizada desde cualquier dispositivo.',
                gradient: 'from-muted/20 to-muted/10',
                iconBg: 'bg-muted/20',
                iconColor: 'text-foreground',
                borderColor: 'border-border',
              },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30" />
                
                {/* Shine effect on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 dark:via-white/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-muted/20 flex items-center justify-center mb-4 border border-border group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="h-8 w-8 text-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-bold font-outfit mb-3 text-foreground">{item.title}</h3>
                  <p className="text-sm font-outfit text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

          {/* Additional privacy points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="p-8 rounded-2xl bg-muted/30 dark:bg-muted/10 border-2 border-border">
              <h3 className="text-xl sm:text-2xl font-bold font-outfit mb-6 text-center text-foreground">
                Comprometidos con tu Privacidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Nadie más puede ver tu información',
                  'Tus datos no se comparten con terceros',
                  'Acceso solo para tu equipo autorizado',
                  'Cumplimiento con estándares de protección de datos',
                ].map((point, index) => (
                  <motion.div
                    key={point}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 w-5 h-5 rounded-full bg-nidia-green/20 flex items-center justify-center flex-shrink-0 border-2 border-nidia-green/50">
                      <Check className="h-3 w-3 text-nidia-green" />
              </div>
                    <p className="text-sm sm:text-base font-outfit text-foreground">{point}</p>
            </motion.div>
                ))}
          </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-24 px-4 relative overflow-hidden bg-background">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-outfit mb-4 text-foreground px-4">
              Planes que se Adaptan a tu Negocio
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-outfit text-muted-foreground max-w-3xl mx-auto px-4 mb-6">
              Cada empresa tiene su propio espacio completamente privado y seguro, sin importar el plan que elijas
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 dark:bg-muted/20 border border-border mb-8">
              <Shield className="h-4 w-4 text-nidia-green" />
              <span className="text-sm font-outfit text-muted-foreground">
                <strong className="text-foreground">Privacidad Total:</strong> Cada empresa tiene su propia base de datos dedicada, garantizando máxima seguridad
              </span>
            </div>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/planes">
                Ver Todos los Planes y Módulos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <PlansPreviewSection onWaitlistClick={() => setWaitlistOpen(true)} />

          {/* Multi-Tenancy Explanation */}
              <motion.div
            initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            className="mt-16 p-8 rounded-2xl bg-muted/30 dark:bg-muted/10 border-2 border-border max-w-4xl mx-auto"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-nidia-green/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-nidia-green" />
                </div>
              <div>
                <h4 className="text-lg font-semibold font-outfit text-foreground mb-2">
                  Privacidad y Seguridad Garantizadas
                </h4>
                <p className="text-sm font-outfit text-muted-foreground mb-4">
                  En NIDIA Flow, cada empresa tiene su propio espacio completamente privado y seguro, sin importar el plan que elijas.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold font-outfit text-foreground">Base de Datos Dedicada para Todos</p>
                      <p className="text-xs font-outfit text-muted-foreground">
                        Cada empresa tiene su propia base de datos completamente aislada. Tus datos nunca se mezclan con los de otras empresas, 
                        garantizando máxima privacidad y seguridad desde el plan más básico.
                      </p>
          </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-nidia-purple flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold font-outfit text-foreground">Aislamiento Total</p>
                      <p className="text-xs font-outfit text-muted-foreground">
                        No hay riesgo de acceso cruzado entre empresas. Cada cliente tiene su propio espacio seguro, 
                        cumpliendo con los más altos estándares de seguridad y privacidad de datos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
                className="px-8 sm:px-10 md:px-12 py-6 sm:py-7 text-base sm:text-lg md:text-xl font-bold bg-nidia-green hover:bg-nidia-green/90 text-black shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setWaitlistOpen(true)}
              >
                <span className="flex items-center">
                  Únete a la Lista de Espera
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="ml-2"
                  >
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.span>
                </span>
              </Button>
            </motion.div>
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
                  width={56}
                  height={56}
                  className="w-14 h-14 md:w-16 md:h-16"
                  priority
                />
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
              © 2025 NIDIA. Todos los derechos reservados.
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
    </>
  );
}
