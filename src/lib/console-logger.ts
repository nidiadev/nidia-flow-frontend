/**
 * Console Logger - Captura y guarda logs de la consola del navegador
 * 
 * Uso:
 * - En desarrollo, los logs se guardan automáticamente en localStorage
 * - Puedes descargar los logs con: downloadConsoleLogs()
 * - Los logs se limpian automáticamente después de 1000 entradas
 */

interface LogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
  stack?: string;
}

class ConsoleLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    // Guardar métodos originales de console
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Cargar logs guardados de localStorage
    this.loadLogs();

    // Interceptar console methods
    this.interceptConsole();
  }

  private loadLogs() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('console_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading console logs:', error);
    }
  }

  saveLogs() {
    if (typeof window === 'undefined') return;
    
    try {
      // Mantener solo los últimos maxLogs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      localStorage.setItem('console_logs', JSON.stringify(this.logs));
    } catch (error) {
      // No usar console.error aquí para evitar bucles infinitos
      // Si hay error, simplemente no guardar
    }
  }

  private interceptConsole() {
    const self = this;

    // Interceptar console.log
    console.log = function(...args: any[]) {
      self.addLog('log', args);
      self.originalConsole.log(...args);
      // Guardar inmediatamente para errores críticos
      self.saveLogs();
    };

    // Interceptar console.info
    console.info = function(...args: any[]) {
      self.addLog('info', args);
      self.originalConsole.info(...args);
    };

    // Interceptar console.warn
    console.warn = function(...args: any[]) {
      self.addLog('warn', args);
      self.originalConsole.warn(...args);
      // Guardar inmediatamente para warnings
      self.saveLogs();
    };

    // Interceptar console.error (más crítico)
    console.error = function(...args: any[]) {
      self.addLog('error', args);
      self.originalConsole.error(...args);
      // Guardar inmediatamente para errores
      self.saveLogs();
    };

    // Interceptar console.debug
    console.debug = function(...args: any[]) {
      self.addLog('debug', args);
      self.originalConsole.debug(...args);
    };

    // Interceptar window.onerror para capturar errores no manejados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        self.addLog('error', [
          `Uncaught Error: ${event.message}`,
          `File: ${event.filename}:${event.lineno}:${event.colno}`,
          event.error?.stack,
        ]);
        self.saveLogs();
      });

      // Interceptar unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        self.addLog('error', [
          `Unhandled Promise Rejection: ${event.reason}`,
          event.reason?.stack || String(event.reason),
        ]);
        self.saveLogs();
      });
    }
  }

  private addLog(level: LogEntry['level'], args: any[]) {
    const seen = new WeakSet();
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      args: args.map(arg => {
        // Serializar objetos de forma segura
        try {
          return JSON.parse(JSON.stringify(arg, (key, value) => {
            // Evitar circular references
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          }));
        } catch {
          return String(arg);
        }
      }),
    };

    // Capturar stack trace para errores
    if (level === 'error') {
      const stack = new Error().stack;
      if (stack) {
        entry.stack = stack;
      }
    }

    this.logs.push(entry);
    this.saveLogs();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('console_logs');
    }
  }

  downloadLogs(filename?: string) {
    const logs = this.getLogs();
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `console-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadLogsAsText(filename?: string) {
    const logs = this.getLogs();
    const lines = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString();
      const level = log.level.toUpperCase().padEnd(5);
      const message = log.message;
      const stack = log.stack ? `\n${log.stack}` : '';
      return `[${time}] ${level} ${message}${stack}`;
    });
    
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `console-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Instancia global
let consoleLogger: ConsoleLogger | null = null;

export function getConsoleLogger() {
  return consoleLogger;
}

// Función para exponer las funciones globales
function exposeGlobalFunctions() {
  if (typeof window === 'undefined') return;
  
  (window as any).downloadConsoleLogs = (format: 'json' | 'txt' = 'txt') => {
    const logger = getConsoleLogger();
    if (logger) {
      // Forzar guardado antes de descargar
      logger.saveLogs();
      if (format === 'json') {
        logger.downloadLogs();
      } else {
        logger.downloadLogsAsText();
      }
    } else {
      console.error('Console Logger no está inicializado. Recarga la página o espera a que se inicialice automáticamente.');
    }
  };

  (window as any).clearConsoleLogs = () => {
    const logger = getConsoleLogger();
    if (logger) {
      logger.clearLogs();
      console.log('✅ Logs de consola limpiados');
    } else {
      console.warn('Console Logger no está inicializado. Los logs no se han limpiado.');
    }
  };

  (window as any).getConsoleLogs = () => {
    const logger = getConsoleLogger();
    if (logger) {
      return logger.getLogs();
    }
    return [];
  };
}

export function initConsoleLogger() {
  if (typeof window === 'undefined') return;
  
  if (!consoleLogger) {
    consoleLogger = new ConsoleLogger();
    // Exponer la instancia del logger para acceso directo
    (window as any).__consoleLogger = consoleLogger;
    
    // Exponer las funciones globales cuando se inicializa
    exposeGlobalFunctions();
    
    console.log('📝 Console Logger inicializado. Usa downloadConsoleLogs() para descargar los logs.');
  }
  
  return consoleLogger;
}

// Exponer funciones globales inmediatamente si estamos en el navegador
// Esto asegura que estén disponibles incluso si initConsoleLogger no se ha llamado
if (typeof window !== 'undefined') {
  exposeGlobalFunctions();
}

