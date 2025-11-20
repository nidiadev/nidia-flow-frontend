'use client';

import { Suspense, ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Full page loading - uses AppLoading for consistency
export function PageLoading({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
}

// Re-export skeletons from dedicated file for backward compatibility
export {
  CardSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageSkeleton,
  ChartSkeleton,
  GridSkeleton,
} from './skeletons';

// Button loading state
interface LoadingButtonProps {
  loading?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LoadingButton({ 
  loading = false, 
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={loading || disabled} 
      className={cn(className)}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

// Error boundary fallback
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  title = 'Algo salió mal',
  description = 'Ha ocurrido un error inesperado. Puedes intentar recargar la página.'
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-card/95 backdrop-blur-sm border-2 border-destructive/20 rounded-xl shadow-xl p-8 space-y-6"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-lg animate-pulse" />
            <AlertCircle className="h-8 w-8 text-destructive relative z-10" />
          </div>
          <h2 className="text-xl font-bold text-destructive">{title}</h2>
        </div>
        
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 bg-muted/50 rounded-lg border border-border overflow-hidden">
            <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Detalles del error (desarrollo)
            </summary>
            <pre className="mt-2 px-4 pb-4 text-xs bg-background/80 p-3 rounded-md overflow-auto max-h-40 border-t border-border">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <Button 
          onClick={resetError} 
          variant="outline" 
          className="w-full mt-4 border-2 hover:bg-muted/50 transition-all"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Intentar nuevamente
        </Button>
      </motion.div>
    </div>
  );
}

// Suspense wrapper with loading fallback
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function SuspenseWrapper({ 
  children, 
  fallback = <PageLoading />,
  className 
}: SuspenseWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Query loading states for TanStack Query
interface QueryLoadingProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  emptyFallback?: ReactNode;
  onRetry?: () => void;
}

export function QueryLoading({
  isLoading,
  isError,
  error,
  isEmpty = false,
  children,
  loadingFallback = <PageLoading />,
  errorFallback,
  emptyFallback = (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground">No hay datos disponibles</p>
    </div>
  ),
  onRetry,
}: QueryLoadingProps) {
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (isError) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    
    return (
      <ErrorFallback
        error={error || new Error('Error desconocido')}
        resetError={onRetry || (() => window.location.reload())}
        title="Error al cargar datos"
        description="No se pudieron cargar los datos. Verifica tu conexión e intenta nuevamente."
      />
    );
  }

  if (isEmpty) {
    return <>{emptyFallback}</>;
  }

  return <>{children}</>;
}

// Inline loading for smaller components
export function InlineLoading({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 py-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}