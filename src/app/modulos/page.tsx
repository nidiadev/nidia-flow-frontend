'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Zap, Calendar, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { publicApi, PublicModule } from '@/lib/api/public';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { WaitlistModal } from '@/components/waitlist/waitlist-modal';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Icon mapping
const iconMap: Record<string, any> = {
  Users: require('lucide-react').Users,
  Package: require('lucide-react').Package,
  ShoppingCart: require('lucide-react').ShoppingCart,
  CheckSquare: require('lucide-react').CheckSquare,
  DollarSign: require('lucide-react').DollarSign,
  BarChart3: require('lucide-react').BarChart3,
  MessageSquare: require('lucide-react').MessageSquare,
  MapPin: require('lucide-react').MapPin,
  Settings: require('lucide-react').Settings,
  FileText: require('lucide-react').FileText,
  Calendar: require('lucide-react').Calendar,
};

function ModuleCard({ module }: { module: PublicModule }) {
  const Icon = module.icon ? iconMap[module.icon] || Package : Package;
  const roadmap = module.metadata?.roadmap;
  const isAvailable = !roadmap || roadmap.status === 'available';
  const isComingSoon = roadmap?.status === 'coming_soon';
  const isPlanned = roadmap?.status === 'planned';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="group relative p-8 rounded-2xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nidia-green to-nidia-turquoise" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-xl bg-muted dark:bg-muted/20 flex items-center justify-center border-2 border-border group-hover:scale-110 transition-transform">
            <Icon className="h-8 w-8 text-foreground dark:text-muted-foreground" />
          </div>
          {isAvailable && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
              Disponible
            </Badge>
          )}
          {isComingSoon && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              Próximamente
            </Badge>
          )}
          {isPlanned && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400">
              Planificado
            </Badge>
          )}
        </div>
        
        <h3 className="text-2xl font-bold font-outfit text-foreground mb-3">{module.displayName}</h3>
        
        {module.description && (
          <p className="font-outfit text-muted-foreground leading-relaxed mb-4">
            {module.description}
          </p>
        )}
        
        {roadmap && !isAvailable && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-outfit text-muted-foreground">
              {roadmap.description || 'Este módulo estará disponible próximamente'}
            </p>
            {roadmap.expectedDate && (
              <p className="text-xs font-outfit text-muted-foreground mt-2">
                Fecha estimada: {new Date(roadmap.expectedDate).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
        
        {module.subModules && module.subModules.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold font-outfit text-foreground mb-3">Submódulos incluidos:</p>
            <div className="flex flex-wrap gap-2">
              {module.subModules.map((subModule) => (
                <Badge key={subModule.id} variant="outline" className="text-xs">
                  {subModule.displayName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ModulosPage() {
  const [mounted, setMounted] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['public-modules'],
    queryFn: () => publicApi.getModules(),
    staleTime: 5 * 60 * 1000,
  });

  const availableModules = modules?.filter(m => 
    !m.metadata?.roadmap || m.metadata?.roadmap?.status === 'available'
  ) || [];
  
  const comingSoonModules = modules?.filter(m => 
    m.metadata?.roadmap?.status === 'coming_soon'
  ) || [];
  
  const plannedModules = modules?.filter(m => 
    m.metadata?.roadmap?.status === 'planned'
  ) || [];

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
              Módulos y Funcionalidades
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-outfit text-muted-foreground max-w-3xl mx-auto mb-8">
              Descubre todas las herramientas que NIDIA Flow ofrece para optimizar tu negocio
            </p>
          </motion.div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
            </div>
          ) : (
            <>
              {/* Módulos Disponibles */}
              {availableModules.length > 0 && (
                <div className="mb-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-3xl sm:text-4xl font-bold font-outfit mb-4 text-foreground flex items-center justify-center gap-3">
                      <Check className="h-8 w-8 text-nidia-green" />
                      Módulos Disponibles Ahora
                    </h2>
                    <p className="text-muted-foreground font-outfit">
                      Funcionalidades completas listas para usar desde el primer día
                    </p>
                  </motion.div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}

              {/* Módulos Próximamente */}
              {comingSoonModules.length > 0 && (
                <div className="mb-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-3xl sm:text-4xl font-bold font-outfit mb-4 text-foreground flex items-center justify-center gap-3">
                      <Zap className="h-8 w-8 text-yellow-500" />
                      Próximamente (Q2 2026)
                    </h2>
                    <p className="text-muted-foreground font-outfit">
                      Funcionalidades avanzadas que estamos desarrollando
                    </p>
                  </motion.div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {comingSoonModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}

              {/* Módulos Planificados */}
              {plannedModules.length > 0 && (
                <div className="mb-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-3xl sm:text-4xl font-bold font-outfit mb-4 text-foreground flex items-center justify-center gap-3">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      En el Roadmap (Q3 2026+)
                    </h2>
                    <p className="text-muted-foreground font-outfit">
                      Funcionalidades planificadas para el futuro
                    </p>
                  </motion.div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plannedModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}
            </>
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

