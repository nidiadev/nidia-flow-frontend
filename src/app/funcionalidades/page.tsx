'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Users, ShoppingCart, Package, DollarSign, BarChart3, MessageSquare, MapPin, Zap, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { WaitlistModal } from '@/components/waitlist/waitlist-modal';
import { useEffect, useState } from 'react';

// Funcionalidades disponibles ahora (Lanzamiento: Marzo 2026) - Mismo diseño que Home
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

export default function FuncionalidadesPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-outfit mb-6 text-foreground">
              Funcionalidades Completas
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-outfit text-muted-foreground max-w-3xl mx-auto mb-8">
              Todo lo que necesitas para gestionar tu negocio de manera eficiente y profesional
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Mismo diseño que Home */}
      <section className="py-24 px-4 relative overflow-hidden bg-background">
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

      {/* CTA Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-outfit mb-6 text-foreground">
              ¿Listo para comenzar?
            </h2>
            <p className="text-base sm:text-lg font-outfit text-muted-foreground mb-10 max-w-2xl mx-auto">
              Únete a las empresas que ya están optimizando sus operaciones con NIDIA Flow
            </p>
            <Button 
              size="lg" 
              onClick={() => setWaitlistOpen(true)}
              className="bg-nidia-green hover:bg-nidia-green/90 text-white"
            >
              Únete a la Lista de Espera
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Modal de Lista de Espera */}
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </div>
  );
}

