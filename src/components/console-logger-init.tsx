'use client';

import { useEffect } from 'react';
import { initConsoleLogger } from '@/lib/console-logger';

/**
 * Componente que inicializa el capturador de logs de consola
 * Se monta una vez y captura todos los logs de la consola del navegador
 */
export function ConsoleLoggerInit() {
  useEffect(() => {
    // Solo inicializar en desarrollo o cuando se necesite
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
      initConsoleLogger();
      
      // Mostrar instrucciones en la consola
      console.log('%c📝 Console Logger activado', 'color: #10b981; font-weight: bold; font-size: 14px;');
      console.log('%cComandos disponibles:', 'color: #6366f1; font-weight: bold;');
      console.log('  - downloadConsoleLogs("txt") - Descargar logs como texto');
      console.log('  - downloadConsoleLogs("json") - Descargar logs como JSON');
      console.log('  - clearConsoleLogs() - Limpiar logs guardados');
      console.log('  - getConsoleLogs() - Obtener logs en memoria');
    }
  }, []);

  return null; // Este componente no renderiza nada
}

