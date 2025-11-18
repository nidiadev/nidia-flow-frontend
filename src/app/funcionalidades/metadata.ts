import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
const siteName = 'NIDIA Flow';

export const metadata: Metadata = {
  title: 'Funcionalidades Completas | NIDIA Flow',
  description: 'Conoce todas las funcionalidades de NIDIA Flow: CRM completo, gestión de órdenes, inventario, contabilidad, dashboard y más. Todo lo que necesitas para gestionar tu negocio desde el primer día.',
  keywords: [
    'funcionalidades ERP',
    'características CRM',
    'funcionalidades software administrativo',
    'características ERP Colombia',
    'funcionalidades gestión empresarial',
    'software gestión completo',
    'módulos ERP',
    'funcionalidades disponibles',
    'roadmap funcionalidades',
  ],
  openGraph: {
    title: 'Funcionalidades Completas | NIDIA Flow',
    description: 'Conoce todas las funcionalidades de NIDIA Flow. Todo lo que necesitas para gestionar tu negocio desde el primer día.',
    url: `${baseUrl}/funcionalidades`,
    siteName,
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NIDIA Flow - Funcionalidades Completas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funcionalidades Completas | NIDIA Flow',
    description: 'Conoce todas las funcionalidades de NIDIA Flow. Todo lo que necesitas para gestionar tu negocio.',
    images: ['/og-image.png'],
    creator: '@nidiadev',
  },
  alternates: {
    canonical: `${baseUrl}/funcionalidades`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

