import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
const siteName = 'NIDIA Flow';

export const metadata: Metadata = {
  title: 'Módulos y Funcionalidades | NIDIA Flow',
  description: 'Descubre todos los módulos y funcionalidades de NIDIA Flow. CRM, gestión de órdenes, inventario, contabilidad y más. Módulos disponibles ahora y próximamente.',
  keywords: [
    'módulos ERP',
    'funcionalidades CRM',
    'módulos software administrativo',
    'características ERP',
    'módulos disponibles',
    'roadmap ERP',
    'funcionalidades software gestión',
  ],
  openGraph: {
    title: 'Módulos y Funcionalidades | NIDIA Flow',
    description: 'Descubre todos los módulos y funcionalidades de NIDIA Flow. Módulos disponibles ahora y próximamente.',
    url: `${baseUrl}/modulos`,
    siteName,
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIDIA Flow - Módulos y Funcionalidades',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Módulos y Funcionalidades | NIDIA Flow',
    description: 'Descubre todos los módulos y funcionalidades de NIDIA Flow.',
    images: ['/logo.png'],
    creator: '@nidiadev',
  },
  alternates: {
    canonical: `${baseUrl}/modulos`,
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

