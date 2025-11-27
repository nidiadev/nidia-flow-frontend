'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Lazy load devtools only in development
const ReactQueryDevtools = React.lazy(() =>
  process.env.NODE_ENV === 'development'
    ? import('@tanstack/react-query-devtools').then((d) => ({
        default: d.ReactQueryDevtools,
      }))
    : Promise.resolve({ default: () => null })
);

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-lg w-full"
          >
            <div className="relative bg-card border border-border rounded-xl shadow-lg p-8 space-y-6">
              <div className="space-y-5">
                {/* Error Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-error/10 dark:bg-error/20 flex items-center justify-center border border-error/20 dark:border-error/30">
                    <AlertTriangle className="h-8 w-8 text-error" />
                  </div>
                </motion.div>

                {/* Error Message */}
                <div className="text-center space-y-2">
                  <motion.h1
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="text-2xl font-semibold text-foreground"
                  >
                    Error de aplicación
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    Ha ocurrido un error crítico en la aplicación. Por favor, intenta nuevamente o regresa al inicio.
                  </motion.p>
                </div>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && error && (
                  <motion.details
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.2 }}
                    className="mt-4 bg-muted/50 rounded-lg border border-border overflow-hidden"
                  >
                    <summary className="cursor-pointer px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                      <span>Detalles técnicos (desarrollo)</span>
                      <span className="text-xs">▼</span>
                    </summary>
                    <div className="px-4 pb-4 pt-2">
                      <pre className="text-xs bg-background p-3 rounded-md overflow-auto max-h-60 border border-border/50 font-mono">
                        <code className="text-error/90">{error.message}</code>
                        {error.stack && (
                          <code className="block mt-2 text-muted-foreground whitespace-pre-wrap break-words">
                            {error.stack}
                          </code>
                        )}
                      </pre>
                    </div>
                  </motion.details>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                >
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="flex-1 h-10 border-border hover:bg-muted transition-colors"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Ir al inicio
                  </Button>
                  <Button
                    onClick={resetError}
                    className="flex-1 h-10 bg-primary hover:bg-primary-hover text-primary-foreground transition-colors"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <React.Suspense fallback={null}>
            <ReactQueryDevtools 
              initialIsOpen={false}
            />
          </React.Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}