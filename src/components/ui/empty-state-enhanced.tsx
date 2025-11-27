'use client';

import { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateEnhancedProps {
  icon?: LucideIcon | ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  illustration?: 'products' | 'categories' | 'alerts' | 'variants' | 'pricing' | 'default';
  className?: string;
}

// SVG Illustrations
const ProductIllustration = () => (
  <svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-60"
  >
    {/* Main package */}
    <rect x="60" y="50" width="80" height="80" rx="4" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
    <rect x="65" y="55" width="70" height="70" rx="2" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
    <line x1="100" y1="55" x2="100" y2="125" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
    <line x1="65" y1="90" x2="135" y2="90" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
    
    {/* Small packages around */}
    <rect x="20" y="30" width="30" height="30" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <rect x="22" y="32" width="26" height="26" rx="1" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <rect x="150" y="30" width="30" height="30" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <rect x="152" y="32" width="26" height="26" rx="1" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <rect x="20" y="100" width="30" height="30" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <rect x="22" y="102" width="26" height="26" rx="1" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <rect x="150" y="100" width="30" height="30" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <rect x="152" y="102" width="26" height="26" rx="1" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
  </svg>
);

const CategoryIllustration = () => (
  <svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-60"
  >
    {/* Folder structure */}
    <rect x="40" y="40" width="60" height="50" rx="4" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
    <path d="M40 50 L40 40 L50 40 L55 45 L100 45 L100 90 L40 90 Z" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <rect x="40" y="40" width="60" height="50" rx="4" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
    
    <rect x="110" y="50" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
    <rect x="110" y="50" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <rect x="50" y="110" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
    <rect x="50" y="110" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <rect x="110" y="110" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
    <rect x="110" y="110" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
  </svg>
);

const AlertIllustration = () => (
  <svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-60"
  >
    {/* Bell icon */}
    <path
      d="M100 30 C85 30 75 40 75 55 L75 70 C75 75 73 80 70 85 L65 95 L135 95 L130 85 C127 80 125 75 125 70 L125 55 C125 40 115 30 100 30 Z"
      fill="currentColor"
      className="text-muted-foreground"
      opacity="0.2"
    />
    <path
      d="M100 30 C85 30 75 40 75 55 L75 70 C75 75 73 80 70 85 L65 95 L135 95 L130 85 C127 80 125 75 125 70 L125 55 C125 40 115 30 100 30 Z"
      stroke="currentColor"
      className="text-muted-foreground"
      strokeWidth="2"
      fill="none"
    />
    <line x1="100" y1="95" x2="100" y2="110" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
    <circle cx="100" cy="120" r="5" fill="currentColor" className="text-muted-foreground" />
    
    {/* Warning triangles */}
    <path d="M30 50 L45 80 L15 80 Z" fill="currentColor" className="text-orange-500" opacity="0.3" />
    <path d="M30 50 L45 80 L15 80 Z" stroke="currentColor" className="text-orange-500" strokeWidth="1.5" fill="none" />
    
    <path d="M170 50 L185 80 L155 80 Z" fill="currentColor" className="text-orange-500" opacity="0.3" />
    <path d="M170 50 L185 80 L155 80 Z" stroke="currentColor" className="text-orange-500" strokeWidth="1.5" fill="none" />
  </svg>
);

const DefaultIllustration = () => (
  <svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-60"
  >
    <circle cx="100" cy="80" r="40" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <circle cx="100" cy="80" r="40" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
    <circle cx="100" cy="80" r="25" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
    
    {/* Small circles around */}
    <circle cx="50" cy="40" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <circle cx="50" cy="40" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <circle cx="150" cy="40" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <circle cx="150" cy="40" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <circle cx="50" cy="120" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <circle cx="50" cy="120" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
    
    <circle cx="150" cy="120" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
    <circle cx="150" cy="120" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
  </svg>
);

const illustrationMap = {
  products: ProductIllustration,
  categories: CategoryIllustration,
  alerts: AlertIllustration,
  variants: ProductIllustration,
  pricing: DefaultIllustration,
  default: DefaultIllustration,
};

export function EmptyStateEnhanced({
  icon,
  title = 'No hay datos disponibles',
  description,
  action,
  illustration = 'default',
  className,
}: EmptyStateEnhancedProps) {
  const Illustration = illustrationMap[illustration];

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {/* Illustration */}
      <div className="mb-6 flex items-center justify-center">
        {icon ? (
          typeof icon === 'function' ? (
            <icon className="h-16 w-16 text-muted-foreground opacity-50" />
          ) : (
            <div className="text-muted-foreground opacity-50">{icon}</div>
          )
        ) : (
          <div className="text-muted-foreground">
            <Illustration />
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-2">
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}

