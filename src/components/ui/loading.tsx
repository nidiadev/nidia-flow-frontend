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

// Full page loading
export function PageLoading({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg border bg-card p-6', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Table loading skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-muted rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

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
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-6">
      <div className="flex items-center space-x-2 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <p className="text-center text-sm text-muted-foreground max-w-md">
        {description}
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 w-full max-w-md">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Detalles del error (desarrollo)
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
      
      <Button onClick={resetError} variant="outline" className="mt-4">
        <RefreshCw className="mr-2 h-4 w-4" />
        Intentar nuevamente
      </Button>
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