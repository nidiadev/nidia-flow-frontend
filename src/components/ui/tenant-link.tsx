'use client';

import Link from 'next/link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { ComponentProps } from 'react';

/**
 * Link component that automatically adds tenant slug to href
 * Use this instead of Next.js Link for tenant routes
 */
export function TenantLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { route } = useTenantRoutes();
  
  // If href is a string, add tenant slug
  const finalHref = typeof href === 'string' ? route(href) : href;
  
  return <Link href={finalHref} {...props} />;
}

