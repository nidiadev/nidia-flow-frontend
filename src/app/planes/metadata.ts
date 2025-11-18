import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
const siteName = 'NIDIA Flow';

export const metadata: Metadata = {
  title: 'Planes y Precios | NIDIA Flow',
  description: 'Compara nuestros planes y elige el perfecto para tu negocio. Todos los planes incluyen base de datos dedicada y privada. Precios desde $0/mes.',
  keywords: [
    'planes ERP',
    'precios ERP',
    'planes CRM',
    'precios CRM',
    'planes software administrativo',
    'comparar planes ERP',
    'ERP Colombia precios',
    'SaaS ERP precios',
  ],
  openGraph: {
    title: 'Planes y Precios | NIDIA Flow',
    description: 'Compara nuestros planes y elige el perfecto para tu negocio. Todos los planes incluyen base de datos dedicada y privada.',
    url: `${baseUrl}/planes`,
    siteName,
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIDIA Flow - Planes y Precios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y Precios | NIDIA Flow',
    description: 'Compara nuestros planes y elige el perfecto para tu negocio.',
    images: ['/logo.png'],
    creator: '@nidiadev',
  },
  alternates: {
    canonical: `${baseUrl}/planes`,
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

