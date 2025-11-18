'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Database, FileCode, User, Shield, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { AuthService } from '@/lib/auth';

interface ProvisioningStatus {
  status: 'pending' | 'provisioning' | 'creating_database' | 'running_migrations' | 'creating_initial_user' | 'completed' | 'failed' | 'not_found' | 'unknown';
  progress: number;
  currentStep: string;
  error?: string;
  startedAt: string | null;
  completedAt: string | null;
  jobId?: string;
  attempts?: number;
  maxAttempts?: number;
  nextRetryAt?: string | null;
}

const steps = [
  { 
    key: 'creating_database', 
    label: 'Preparando tu espacio de trabajo', 
    description: 'Configurando el entorno para tu empresa',
    icon: Database 
  },
  { 
    key: 'running_migrations', 
    label: 'Instalando servicios', 
    description: 'Activando todas las funcionalidades',
    icon: FileCode 
  },
  { 
    key: 'creating_initial_user', 
    label: 'Configurando tu cuenta', 
    description: 'Preparando tu acceso administrativo',
    icon: User 
  },
  { 
    key: 'completed', 
    label: 'Finalizando configuración', 
    description: 'Últimos ajustes para que todo esté listo',
    icon: Shield 
  },
];

export default function ProvisioningPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { login } = useAuth();
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCriticalError, setIsCriticalError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async () => {
    if (!tenantId) {
      setError('ID de tenant no válido');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/tenant/provisioning/${tenantId}/status`);
      const data = response.data;
      
      setStatus(data);
      
      // Detectar errores críticos (especialmente relacionados con BD)
      const errorMessage = data.error || '';
      const isCritical = errorMessage.includes('CRITICAL') || 
                        errorMessage.includes('Database') && errorMessage.includes('NOT') ||
                        errorMessage.includes('does NOT exist') ||
                        errorMessage.includes('was NOT created');
      
      setIsCriticalError(isCritical);
      
      if (data.status === 'completed') {
        // Intentar auto-login con credenciales guardadas
        const pendingLogin = sessionStorage.getItem('pendingLogin');
        if (pendingLogin && !isLoggingIn) {
          try {
            const credentials = JSON.parse(pendingLogin);
            // Verificar que las credenciales no sean muy antiguas (máximo 10 minutos)
            const maxAge = 10 * 60 * 1000; // 10 minutos
            if (Date.now() - credentials.timestamp < maxAge) {
              setIsLoggingIn(true);
              // Esperar un momento para que el backend termine de procesar
              setTimeout(async () => {
                try {
                  const loginResult = await login({
                    email: credentials.email,
                    password: credentials.password,
                  });
                  
                  if (loginResult.success) {
                    // Limpiar credenciales después de login exitoso
                    sessionStorage.removeItem('pendingLogin');
                    // El login ya redirige automáticamente
                  } else {
                    // Si falla el login, redirigir a login page
                    sessionStorage.removeItem('pendingLogin');
                    router.push('/login?provisioned=true');
                  }
                } catch (loginError) {
                  console.error('Auto-login error:', loginError);
                  sessionStorage.removeItem('pendingLogin');
                  router.push('/login?provisioned=true');
                }
              }, 2000);
            } else {
              // Credenciales muy antiguas, redirigir a login
              sessionStorage.removeItem('pendingLogin');
              router.push('/login?provisioned=true');
            }
          } catch (e) {
            console.error('Error parsing pending login:', e);
            sessionStorage.removeItem('pendingLogin');
            router.push('/login?provisioned=true');
          }
        } else {
          // No hay credenciales guardadas, redirigir a login
          setTimeout(() => {
            router.push('/login?provisioned=true');
          }, 2000);
        }
      } else if (data.status === 'failed') {
        setLoading(false);
        // Si es un error crítico, detener el polling
        if (isCritical) {
          return true; // Retornar true para detener el polling
        }
      }
      return false;
    } catch (err: any) {
      console.error('Error checking provisioning status:', err);
      const errorMsg = err.response?.data?.message || 'Error al verificar el estado de provisioning';
      setError(errorMsg);
      setIsCriticalError(errorMsg.includes('CRITICAL') || errorMsg.includes('Database'));
      setLoading(false);
      return true; // Detener polling en caso de error
    }
  };

  useEffect(() => {
    if (!tenantId) return;

    const startPolling = async () => {
      // Verificar inmediatamente
      const shouldStop = await checkStatus();
      setLoading(false);
      
      if (shouldStop) {
        return;
      }

      // Polling cada 3 segundos
      intervalRef.current = setInterval(async () => {
        const stop = await checkStatus();
        if (stop && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 3000);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tenantId]);
  
  // Detener polling cuando hay error crítico
  useEffect(() => {
    if (isCriticalError && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isCriticalError]);

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/register')} className="w-full">
              Volver al registro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = status?.status || 'unknown';
  const progress = status?.progress || 0;
  const isCompleted = currentStatus === 'completed';
  const isFailed = currentStatus === 'failed';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <motion.div
              animate={isCompleted ? { scale: [1, 1.1, 1] } : isFailed && isCriticalError ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              ) : isFailed && isCriticalError ? (
                <XCircle className="h-16 w-16 text-destructive mx-auto" />
              ) : isFailed ? (
                <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              ) : (
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
              )}
            </motion.div>
            <CardTitle className="text-2xl sm:text-3xl">
              {isCompleted
                ? '¡Todo está listo!'
                : isFailed && isCriticalError
                ? 'Error en la configuración'
                : isFailed
                ? 'Error en la configuración'
                : 'Preparando tu espacio de trabajo'}
            </CardTitle>
            <CardDescription className="text-base">
              {isCompleted
                ? isLoggingIn
                  ? 'Iniciando sesión automáticamente...'
                  : '¡Todo está listo! Redirigiendo...'
                : isFailed && isCriticalError
                ? 'No pudimos completar la configuración. Por favor, contacta al soporte.'
                : isFailed
                ? status?.error || 'Hubo un problema al configurar tu cuenta. Inténtalo nuevamente.'
                : 'Estamos configurando todo para que puedas comenzar a trabajar'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const stepKey = step.key;
                const isActive = currentStatus === stepKey;
                const isCompleted = progress > (index * 25 + 25);
                const Icon = step.icon;

                return (
                  <motion.div
                    key={stepKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : isActive ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <span
                        className={`block ${
                          isCompleted
                            ? 'text-foreground font-medium'
                            : isActive
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.description && (
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {step.description}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Error Message */}
            {isFailed && status?.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isCriticalError
                    ? 'bg-destructive/20 border-destructive/40 dark:bg-destructive/10'
                    : 'bg-destructive/10 border-destructive/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCriticalError ? (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    {isCriticalError && (
                      <p className="text-sm font-semibold text-destructive">
                        Error Crítico: No se puede continuar
                      </p>
                    )}
                    <p className={`text-sm ${isCriticalError ? 'text-destructive font-medium' : 'text-destructive'}`}>
                      {status.error}
                    </p>
                    {isCriticalError && (
                      <div className="mt-3 p-3 bg-background/50 rounded border border-destructive/20">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          ¿Qué significa esto?
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>La base de datos no se pudo crear en el servidor</li>
                          <li>El proceso de provisioning se ha detenido</li>
                          <li>Por favor, contacta al soporte técnico</li>
                        </ul>
                      </div>
                    )}
                    {status.attempts && status.maxAttempts && !isCriticalError && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Intentos: {status.attempts} / {status.maxAttempts}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Retry Info */}
            {isFailed && status?.nextRetryAt && !isCriticalError && (
              <div className="text-center text-sm text-muted-foreground">
                <p>El sistema reintentará automáticamente en unos momentos.</p>
              </div>
            )}
            
            {/* Critical Error Info */}
            {isFailed && isCriticalError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                      El proceso se ha detenido
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Este es un error crítico que requiere atención del equipo técnico. 
                      No se realizarán reintentos automáticos.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {isFailed && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/register')}
                  className="flex-1"
                >
                  Volver al registro
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {/* Estimated Time */}
            {!isCompleted && !isFailed && (
              <div className="text-center text-sm text-muted-foreground pt-2">
                <p className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Esto tomará aproximadamente 1-2 minutos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

