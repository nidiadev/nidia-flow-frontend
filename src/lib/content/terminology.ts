/**
 * Diccionario de términos: Técnicos (SEO) vs Amigables (UI)
 * 
 * Para SEO: Usar términos técnicos que la gente busca
 * Para UI: Usar lenguaje colombiano, claro y accesible
 */

export const terminology = {
  // Términos principales
  mainTitle: {
    seo: 'NIDIA Flow - Micro-ERP + CRM para Microempresas',
    friendly: 'NIDIA Flow - Sistema Completo para tu Negocio',
  },
  
  mainSubtitle: {
    seo: 'Sistema Micro-ERP + CRM completo para microempresas y empresas de servicios',
    friendly: 'Todo lo que necesitas para administrar tu negocio en un solo lugar',
  },
  
  mainDescription: {
    seo: 'Sistema administrativo-operacional completo para microempresas y empresas de servicios en Colombia',
    friendly: 'Gestiona clientes, pedidos, inventario, pagos y operaciones de campo desde una sola plataforma',
  },
  
  // Módulos y funcionalidades
  crm: {
    seo: 'CRM',
    friendly: 'Gestión de Clientes',
    description: 'Administra todos tus clientes, contactos y oportunidades de venta',
  },
  
  orders: {
    seo: 'Gestión de Órdenes',
    friendly: 'Control de Pedidos',
    description: 'Crea, gestiona y da seguimiento a todos tus pedidos y servicios',
  },
  
  inventory: {
    seo: 'Control de Inventario',
    friendly: 'Manejo de Productos',
    description: 'Lleva el control de tus productos, precios y stock',
  },
  
  accounting: {
    seo: 'Contabilidad',
    friendly: 'Pagos y Finanzas',
    description: 'Registra pagos, ingresos y gastos de tu negocio',
  },
  
  tasks: {
    seo: 'Gestión de Tareas',
    friendly: 'Asignación de Trabajos',
    description: 'Asigna y da seguimiento a las tareas de tu equipo',
  },
  
  reports: {
    seo: 'Dashboard y Reportes',
    friendly: 'Vista General y Reportes',
    description: 'Mira cómo va tu negocio con gráficas y números en tiempo real',
  },
  
  // Características
  multiTenant: {
    seo: 'Multi-tenant con aislamiento completo',
    friendly: 'Cada negocio tiene su espacio privado y seguro',
  },
  
  dedicatedDatabase: {
    seo: 'Base de datos dedicada',
    friendly: 'Tu información guardada de forma privada y segura',
  },
  
  // Beneficios
  benefits: {
    scalable: {
      seo: 'Arquitectura escalable',
      friendly: 'Crece con tu negocio sin límites',
    },
    secure: {
      seo: 'Seguridad Enterprise',
      friendly: 'Tu información protegida con los más altos estándares',
    },
    intuitive: {
      seo: 'Interfaz intuitiva',
      friendly: 'Fácil de usar, sin complicaciones',
    },
  },
};

/**
 * Función helper para obtener término amigable
 */
export function getFriendlyTerm(key: keyof typeof terminology): string {
  const term = terminology[key];
  if (typeof term === 'object' && 'friendly' in term) {
    return term.friendly;
  }
  return '';
}

/**
 * Función helper para obtener término SEO
 */
export function getSeoTerm(key: keyof typeof terminology): string {
  const term = terminology[key];
  if (typeof term === 'object' && 'seo' in term) {
    return term.seo;
  }
  return '';
}

