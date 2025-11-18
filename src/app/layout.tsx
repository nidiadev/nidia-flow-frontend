import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConsoleLoggerInit } from "@/components/console-logger-init";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
const siteName = 'NIDIA Flow';
const description = 'Sistema Micro-ERP + CRM completo para microempresas y empresas de servicios. Gestión de clientes, órdenes, inventario, contabilidad y operaciones en campo en una sola plataforma.';
const keywords = [
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
];

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${siteName} - Micro-ERP + CRM para Microempresas`,
    template: `%s | ${siteName}`,
  },
  description,
  keywords,
  authors: [{ name: 'NIDIA' }],
  creator: 'NIDIA',
  publisher: 'NIDIA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: baseUrl,
    siteName,
    title: `${siteName} - Micro-ERP + CRM para Microempresas`,
    description,
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIDIA Flow - Micro-ERP + CRM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Micro-ERP + CRM para Microempresas`,
    description,
    images: ['/logo.png'],
    creator: '@nidiadev',
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
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    // Agregar códigos de verificación cuando estén disponibles
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-outfit antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              <ConsoleLoggerInit />
              {children}
              <Toaster 
                position="top-right"
                richColors
                closeButton
                duration={4000}
                theme="dark"
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
