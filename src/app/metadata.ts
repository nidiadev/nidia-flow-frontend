import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
const siteName = 'NIDIA Flow';

export const homeMetadata: Metadata = {
  title: 'NIDIA Flow - Micro-ERP + CRM para Microempresas',
  description: 'Sistema Micro-ERP + CRM completo para microempresas y empresas de servicios. Gestión de clientes, órdenes, inventario, contabilidad y operaciones en campo en una sola plataforma. Base de datos dedicada y privada para cada empresa.',
  keywords: [
    'Micro-ERP',
    'CRM para microempresas',
    'Software administrativo',
    'ERP Colombia',
    'Sistema de gestión empresarial',
    'Software para empresas de servicios',
    'CRM integrado',
    'Gestión de inventario',
    'Control de órdenes',
    'Operaciones en campo',
    'Software contable',
    'ERP en la nube',
    'SaaS ERP',
    'Gestión de clientes',
    'Sistema multi-tenant',
    'Base de datos dedicada',
    'Privacidad empresarial',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: baseUrl,
    siteName,
    title: 'NIDIA Flow - Micro-ERP + CRM para Microempresas',
    description: 'Sistema Micro-ERP + CRM completo para microempresas. Gestión de clientes, órdenes, inventario, contabilidad y operaciones en campo en una sola plataforma.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIDIA Flow - Micro-ERP + CRM para Microempresas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NIDIA Flow - Micro-ERP + CRM para Microempresas',
    description: 'Sistema Micro-ERP + CRM completo para microempresas. Gestión de clientes, órdenes, inventario y más en una sola plataforma.',
    images: ['/logo.png'],
    creator: '@nidiadev',
  },
  alternates: {
    canonical: baseUrl,
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

