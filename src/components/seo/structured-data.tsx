export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.nidia.com.co';
  
  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'NIDIA Flow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'Sistema Micro-ERP + CRM completo para microempresas y empresas de servicios. Gestión de clientes, órdenes, inventario, contabilidad y operaciones en campo en una sola plataforma.',
    featureList: [
      'CRM Inteligente con pipeline visual',
      'Gestión de órdenes y facturación',
      'Control de inventario con alertas',
      'Operaciones en campo con GPS',
      'Contabilidad básica y reportes',
      'Comunicación integrada (WhatsApp, Email)',
      'Multi-tenant seguro',
      'Reportes y analytics en tiempo real',
    ],
    screenshot: `${baseUrl}/logo.png`,
    softwareVersion: '1.0',
    releaseNotes: 'Sistema completo de gestión empresarial para microempresas',
    url: baseUrl,
    downloadUrl: baseUrl,
    installUrl: baseUrl,
  };

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NIDIA',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Desarrolladores de software empresarial para microempresas y empresas de servicios',
    sameAs: [
      'https://www.instagram.com/nidiadev',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Spanish', 'English'],
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NIDIA Flow',
    url: baseUrl,
    description: 'Sistema Micro-ERP + CRM para microempresas',
    publisher: {
      '@type': 'Organization',
      name: 'NIDIA',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}

