'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ArrowRight, Shield, Zap, Users, Package, ShoppingCart, CheckSquare, DollarSign, BarChart3, MessageSquare, MapPin, Settings, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { publicApi, PublicPlan, PublicModule } from '@/lib/api/public';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { WaitlistModal } from '@/components/waitlist/waitlist-modal';

// Icon mapping
const iconMap: Record<string, any> = {
  Users,
  Package,
  ShoppingCart,
  CheckSquare,
  DollarSign,
  BarChart3,
  MessageSquare,
  MapPin,
  Settings,
  FileText,
  Calendar,
};

function PlanCard({ plan, isPopular = false, billingPeriod = 'monthly', onWaitlistClick }: { plan: PublicPlan; isPopular?: boolean; billingPeriod?: 'monthly' | 'yearly'; onWaitlistClick?: () => void }) {
  const priceMonthly = plan.priceMonthly ? Number(plan.priceMonthly) : 0;
  const priceYearly = plan.priceYearly ? Number(plan.priceYearly) : 0;
  const yearlyDiscount = priceMonthly > 0 && priceYearly > 0 
    ? Math.round(((priceMonthly * 12 - priceYearly) / (priceMonthly * 12)) * 100)
    : 0;

  const currentPrice = billingPeriod === 'yearly' && priceYearly > 0 ? priceYearly : priceMonthly;
  const priceLabel = billingPeriod === 'yearly' ? '/año' : '/mes';

  // Determinar colores y badge
  const badgeText = plan.badge || (isPopular ? 'Más Popular' : null);
  const badgeColor = plan.badgeColor || (isPopular ? 'blue' : null);
  const accentColor = plan.accentColor || (isPopular ? 'blue' : 'green');
  
  // Mapeo de colores a clases CSS reales
  const getAccentGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-[#3B82F6] to-[#8B5CF6]'; // nidia-blue to nidia-purple
      case 'green':
        return 'from-[#10B981] to-[#14B8A6]'; // nidia-green to nidia-turquoise
      case 'purple':
        return 'from-[#8B5CF6] to-[#3B82F6]'; // nidia-purple to nidia-blue
      default:
        return 'from-[#10B981] to-[#14B8A6]';
    }
  };

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-[#3B82F6]';
      case 'green':
        return 'bg-[#10B981]';
      case 'purple':
        return 'bg-[#8B5CF6]';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-[#3B82F6]';
    }
  };

  const getBorderColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-[#3B82F6]';
      case 'green':
        return 'border-[#10B981]';
      case 'purple':
        return 'border-[#8B5CF6]';
      default:
        return 'border-[#10B981]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={cn(
        'relative p-8 rounded-2xl bg-card dark:bg-card/40 border-2 shadow-sm overflow-hidden',
        isPopular 
          ? `${getBorderColorClass(accentColor)} shadow-lg scale-105` 
          : 'border-border'
      )}
    >
      {badgeText && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className={cn(getBadgeColorClass(badgeColor || 'blue'), 'text-white')}>
            {badgeText}
          </Badge>
        </div>
      )}
      
      {/* Barra de color superior - alineada correctamente */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
        getAccentGradient(accentColor)
      )} />
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold font-outfit text-foreground">{plan.displayName}</h3>
          <Badge variant="secondary" className="bg-nidia-green/20 text-nidia-green border-nidia-green/50">
            Base Dedicada
          </Badge>
        </div>
        <div className="mb-4">
          {currentPrice > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-outfit text-foreground">
                  {formatCurrency(currentPrice, plan.currency)}
                </span>
                <span className="text-muted-foreground font-outfit">{priceLabel}</span>
              </div>
              {billingPeriod === 'monthly' && priceYearly > 0 && yearlyDiscount > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    o {formatCurrency(priceYearly, plan.currency)}/año
                  </span>
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-600 dark:text-green-400">
                    Ahorra {yearlyDiscount}%
                  </Badge>
                </div>
              )}
              {billingPeriod === 'yearly' && yearlyDiscount > 0 && (
                <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-600 dark:text-green-400">
                  Ahorra {yearlyDiscount}% vs mensual
                </Badge>
              )}
            </>
          ) : (
            <span className="text-4xl font-bold font-outfit text-foreground">Gratis</span>
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
              {plan.maxStorageGb === -1 ? 'Almacenamiento ilimitado' : `${plan.maxStorageGb} GB almacenamiento`}
            </span>
          </li>
        )}
        {plan.maxMonthlyEmails && (
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
            <span className="text-sm font-outfit text-foreground">
              {plan.maxMonthlyEmails === -1 ? 'Emails ilimitados' : `${plan.maxMonthlyEmails.toLocaleString()} emails/mes`}
            </span>
          </li>
        )}
        {plan.maxMonthlyWhatsapp && (
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
            <span className="text-sm font-outfit text-foreground">
              {plan.maxMonthlyWhatsapp === -1 ? 'WhatsApp ilimitado' : `${plan.maxMonthlyWhatsapp.toLocaleString()} mensajes WhatsApp/mes`}
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
          <span className="text-sm font-outfit text-foreground">Base de datos dedicada y privada</span>
        </li>
        {plan.moduleAssignments && plan.moduleAssignments.length > 0 && (
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-nidia-green flex-shrink-0 mt-0.5" />
            <span className="text-sm font-outfit text-foreground">
              {plan.moduleAssignments.length} módulo{plan.moduleAssignments.length > 1 ? 's' : ''} incluido{plan.moduleAssignments.length > 1 ? 's' : ''}
            </span>
          </li>
        )}
      </ul>

      <Button 
        className="w-full" 
        variant={isPopular ? 'default' : 'outline'}
        onClick={onWaitlistClick}
      >
        Únete a la Lista de Espera
      </Button>
    </motion.div>
  );
}

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
      className="group relative p-6 rounded-xl bg-card dark:bg-card/40 border-2 border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted dark:bg-muted/20" />
      
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-muted dark:bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border-2 border-border">
          <Icon className="h-7 w-7 text-foreground dark:text-muted-foreground" />
        </div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold font-outfit text-foreground">{module.displayName}</h3>
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
        {module.description && (
          <p className="font-outfit text-muted-foreground leading-relaxed text-sm mb-4">
            {module.description}
          </p>
        )}
        {roadmap && !isAvailable && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-outfit text-muted-foreground">
              {roadmap.description || 'Este módulo estará disponible próximamente'}
            </p>
            {roadmap.expectedDate && (
              <p className="text-xs font-outfit text-muted-foreground mt-1">
                Fecha estimada: {roadmap.expectedDate}
              </p>
            )}
          </div>
        )}
        {module.subModules && module.subModules.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold font-outfit text-foreground mb-2">Submódulos:</p>
            <div className="flex flex-wrap gap-2">
              {module.subModules.slice(0, 3).map((subModule) => (
                <Badge key={subModule.id} variant="outline" className="text-xs">
                  {subModule.displayName}
                </Badge>
              ))}
              {module.subModules.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{module.subModules.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PlansPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Smooth scroll behavior
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => publicApi.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Plans query state:', { 
        plans, 
        plansLoading, 
        plansError,
        plansLength: plans?.length 
      });
    }
  }, [plans, plansLoading, plansError]);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['public-modules'],
    queryFn: () => publicApi.getModules(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  // Separar módulos disponibles y futuros
  // Si no tiene metadata.roadmap o status es 'available', está disponible
  const availableModules = modules?.filter(m => {
    if (!m.metadata?.roadmap) {
      // Si no tiene roadmap, asumimos que está disponible
      return true;
    }
    return m.metadata.roadmap.status === 'available';
  }) || [];
  
  const comingSoonModules = modules?.filter(m => 
    m.metadata?.roadmap?.status === 'coming_soon'
  ) || [];
  
  const plannedModules = modules?.filter(m => 
    m.metadata?.roadmap?.status === 'planned'
  ) || [];

  // Determinar plan popular (el del medio o el más caro)
  const sortedPlans = plans?.sort((a, b) => {
    const priceA = a.priceMonthly ? Number(a.priceMonthly) : 0;
    const priceB = b.priceMonthly ? Number(b.priceMonthly) : 0;
    return priceA - priceB;
  }) || [];
  const popularPlanIndex = sortedPlans.length > 0 ? Math.floor(sortedPlans.length / 2) : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-outfit mb-6 text-foreground">
              Planes y Precios
            </h1>
            <p className="text-lg sm:text-xl font-outfit text-muted-foreground max-w-3xl mx-auto mb-8">
              Elige el plan perfecto para tu negocio. Todos los planes incluyen base de datos dedicada y privada.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 dark:bg-muted/20 border border-border mb-8">
              <Shield className="h-4 w-4 text-nidia-green" />
              <span className="text-sm font-outfit text-muted-foreground">
                <strong className="text-foreground">Privacidad Total:</strong> Cada empresa tiene su propia base de datos dedicada
              </span>
            </div>
            
            {/* Toggle Mensual/Anual */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={cn(
                "text-sm font-outfit transition-colors",
                billingPeriod === 'monthly' ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                Mensual
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={cn(
                  "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                  billingPeriod === 'yearly' ? "bg-nidia-green" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                    billingPeriod === 'yearly' ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
              <span className={cn(
                "text-sm font-outfit transition-colors flex items-center gap-2",
                billingPeriod === 'yearly' ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                Anual
                {billingPeriod === 'yearly' && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                    Ahorra hasta 20%
                  </Badge>
                )}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {plansLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
            </div>
          ) : plansError ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Error al cargar los planes. Por favor, intenta nuevamente.</p>
              <Button onClick={() => window.location.reload()}>Recargar</Button>
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {sortedPlans.map((plan, index) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  isPopular={index === popularPlanIndex}
                  billingPeriod={billingPeriod}
                  onWaitlistClick={() => setWaitlistOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No hay planes disponibles en este momento.</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-muted-foreground">
                  Debug: plans={plans ? `${plans.length} planes` : 'undefined'}, 
                  sortedPlans={sortedPlans.length}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparar" className="py-20 px-4 bg-background scroll-mt-20">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-outfit mb-4 text-foreground">
              Compara los Planes
            </h2>
            <p className="text-base sm:text-lg font-outfit text-muted-foreground max-w-2xl mx-auto">
              Compara todas las características y elige el plan perfecto para tu negocio
            </p>
          </motion.div>

          {plansLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-background px-6 py-4 text-left text-sm font-semibold font-outfit text-foreground border-r border-border">
                        Característica
                      </th>
                      {sortedPlans.map((plan) => (
                        <th
                          key={plan.id}
                          className="px-6 py-4 text-center text-sm font-semibold font-outfit text-foreground"
                        >
                          <div className="space-y-2">
                            <div className="text-lg">{plan.displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {billingPeriod === 'monthly' && plan.priceMonthly
                                ? formatCurrency(plan.priceMonthly, plan.currency)
                                : billingPeriod === 'yearly' && plan.priceYearly
                                ? formatCurrency(plan.priceYearly, plan.currency)
                                : 'Gratis'}
                              {billingPeriod === 'monthly' ? '/mes' : '/año'}
                            </div>
                            {plan.badge && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {plan.badge}
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {/* Precio */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Precio
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {billingPeriod === 'monthly' && plan.priceMonthly ? (
                            <div>
                              <div className="font-semibold text-foreground">
                                {formatCurrency(plan.priceMonthly, plan.currency)}/mes
                              </div>
                              {plan.priceYearly && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  o {formatCurrency(plan.priceYearly, plan.currency)}/año
                                </div>
                              )}
                            </div>
                          ) : billingPeriod === 'yearly' && plan.priceYearly ? (
                            <div>
                              <div className="font-semibold text-foreground">
                                {formatCurrency(plan.priceYearly, plan.currency)}/año
                              </div>
                              {plan.priceMonthly && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  equivalente a {formatCurrency(Math.round(plan.priceYearly / 12), plan.currency)}/mes
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-foreground">Gratis</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Usuarios */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Usuarios
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.maxUsers === -1 ? (
                            <span className="font-semibold text-foreground">Ilimitados</span>
                          ) : plan.maxUsers ? (
                            <span className="text-foreground">{plan.maxUsers}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Almacenamiento */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Almacenamiento
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.maxStorageGb === -1 ? (
                            <span className="font-semibold text-foreground">Ilimitado</span>
                          ) : plan.maxStorageGb ? (
                            <span className="text-foreground">{plan.maxStorageGb} GB</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Emails mensuales */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Emails/mes
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.maxMonthlyEmails === -1 ? (
                            <span className="font-semibold text-foreground">Ilimitados</span>
                          ) : plan.maxMonthlyEmails ? (
                            <span className="text-foreground">{plan.maxMonthlyEmails.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* WhatsApp mensual */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        WhatsApp/mes
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.maxMonthlyWhatsapp === -1 ? (
                            <span className="font-semibold text-foreground">Ilimitado</span>
                          ) : plan.maxMonthlyWhatsapp ? (
                            <span className="text-foreground">{plan.maxMonthlyWhatsapp.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* API Calls */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Llamadas API/mes
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.maxMonthlyApiCalls === -1 ? (
                            <span className="font-semibold text-foreground">Ilimitadas</span>
                          ) : plan.maxMonthlyApiCalls ? (
                            <span className="text-foreground">{plan.maxMonthlyApiCalls.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Base de datos dedicada */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Base de datos dedicada
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center">
                          <Check className="h-5 w-5 text-nidia-green mx-auto" />
                        </td>
                      ))}
                    </tr>

                    {/* Módulos incluidos */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                        Módulos incluidos
                      </td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                          {plan.moduleAssignments && plan.moduleAssignments.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-foreground font-semibold">
                                {plan.moduleAssignments.length} módulo{plan.moduleAssignments.length > 1 ? 's' : ''}
                              </span>
                              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                {plan.moduleAssignments.slice(0, 3).map((assignment) => (
                                  <div key={assignment.id}>{assignment.module.displayName}</div>
                                ))}
                                {plan.moduleAssignments.length > 3 && (
                                  <div>+{plan.moduleAssignments.length - 3} más</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Características destacadas */}
                    {sortedPlans.some((plan) => plan.featuredFeatures && plan.featuredFeatures.length > 0) && (
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-6 py-4 text-sm font-medium font-outfit text-foreground border-r border-border">
                          Características destacadas
                        </td>
                        {sortedPlans.map((plan) => (
                          <td key={plan.id} className="px-6 py-4 text-center text-sm font-outfit">
                            {plan.featuredFeatures && plan.featuredFeatures.length > 0 ? (
                              <ul className="space-y-1 text-left">
                                {plan.featuredFeatures.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-nidia-green flex-shrink-0 mt-0.5" />
                                    <span className="text-foreground text-xs">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Botón de acción */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-card px-6 py-4 border-r border-border"></td>
                      {sortedPlans.map((plan, idx) => (
                        <td key={plan.id} className="px-6 py-4 text-center">
                          <Button
                            onClick={() => setWaitlistOpen(true)}
                            variant={idx === popularPlanIndex ? 'default' : 'outline'}
                            className="w-full"
                          >
                            Únete a la Lista de Espera
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-outfit mb-4 text-foreground">
              Módulos y Funcionalidades
            </h2>
            <p className="text-base sm:text-lg font-outfit text-muted-foreground max-w-2xl mx-auto">
              Conoce todos los módulos disponibles y los que están por venir
            </p>
          </motion.div>

          {modulesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-nidia-green" />
            </div>
          ) : !modules || modules.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No hay módulos disponibles en este momento.</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-muted-foreground">
                  Debug: modules={modules ? `${modules.length} módulos` : 'undefined'}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Módulos Disponibles */}
              {availableModules.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-2xl font-bold font-outfit mb-6 text-foreground flex items-center gap-2">
                    <Check className="h-6 w-6 text-nidia-green" />
                    Módulos Disponibles Ahora
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}

              {/* Módulos Próximamente */}
              {comingSoonModules.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-2xl font-bold font-outfit mb-6 text-foreground flex items-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    Próximamente (Q2 2026)
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {comingSoonModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}

              {/* Módulos Planificados */}
              {plannedModules.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-2xl font-bold font-outfit mb-6 text-foreground flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-500" />
                    En el Roadmap (Q3 2026+)
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plannedModules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay módulos en ninguna categoría */}
              {availableModules.length === 0 && comingSoonModules.length === 0 && plannedModules.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    No se encontraron módulos para mostrar. Verifica que los módulos tengan el estado correcto en la base de datos.
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Total módulos: {modules?.length || 0}</p>
                      <p>Disponibles: {availableModules.length}</p>
                      <p>Próximamente: {comingSoonModules.length}</p>
                      <p>Planificados: {plannedModules.length}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-background">
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

