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
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-lg w-full"
          >
            <div className="relative bg-card/95 backdrop-blur-sm border-2 border-destructive/30 rounded-2xl shadow-2xl shadow-destructive/10 p-10 space-y-8 overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-destructive/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 space-y-6">
                {/* Error Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-destructive/30 rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className="relative bg-destructive/10 rounded-full p-4 border-2 border-destructive/20">
                      <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                <div className="text-center space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-3xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent"
                  >
                    Error de aplicación
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    Ha ocurrido un error crítico en la aplicación. Por favor, intenta nuevamente o regresa al inicio.
                  </motion.p>
                </div>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && error && (
                  <motion.details
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="mt-6 bg-muted/50 rounded-lg border border-border overflow-hidden"
                  >
                    <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                      <span>Detalles técnicos (desarrollo)</span>
                      <motion.span
                        className="text-xs"
                        animate={{ rotate: [0, 180] }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </summary>
                    <div className="px-4 pb-4">
                      <pre className="mt-3 text-xs bg-background/80 p-4 rounded-md overflow-auto max-h-60 border border-border/50 font-mono">
                        <code className="text-destructive/90">{error.message}</code>
                        {error.stack && (
                          <code className="block mt-2 text-muted-foreground whitespace-pre-wrap">
                            {error.stack}
                          </code>
                        )}
                      </pre>
                    </div>
                  </motion.details>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 pt-4"
                >
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="flex-1 h-11 border-2 hover:bg-muted/50 transition-all"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Ir al inicio
                  </Button>
                  <Button
                    onClick={resetError}
                    className="flex-1 h-11 bg-gradient-to-r from-nidia-green to-nidia-green/90 hover:from-nidia-green/90 hover:to-nidia-green text-white shadow-lg shadow-nidia-green/20 transition-all"
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