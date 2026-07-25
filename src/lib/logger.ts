type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, module: string, message: string, data?: unknown) {
  const entry = {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  const fn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : level === 'info' ? console.info
    : console.debug;
  fn(`[${entry.timestamp}] [${level.toUpperCase()}] [${module}] ${message}`, data ?? '');
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => {
      if (import.meta.env.DEV) log('debug', module, msg, data);
    },
    info: (msg: string, data?: unknown) => log('info', module, msg, data),
    warn: (msg: string, data?: unknown) => log('warn', module, msg, data),
    error: (msg: string, data?: unknown) => log('error', module, msg, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
