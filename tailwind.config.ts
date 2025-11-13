import type { Config } from "tailwindcss";

/**
 * Configuración de Tailwind CSS v4
 * 
 * En Tailwind v4, la mayoría de la configuración se realiza en CSS usando @theme
 * en el archivo globals.css. Este archivo se mantiene principalmente para:
 * - Definir el contenido a escanear
 * - Agregar plugins si es necesario
 * 
 * La configuración de colores, tipografías, spacing, etc. se define en:
 * src/app/globals.css usando la directiva @theme
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // En Tailwind v4, theme.extend ya no es necesario si todo está en @theme
  // Se mantiene vacío para compatibilidad con código existente
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;