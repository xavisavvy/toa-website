import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      node_version: process.version,
    }),
  },
  
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'api_key',
      'apiKey',
      'YOUTUBE_API_KEY',
      'ETSY_API_KEY',
      'SESSION_SECRET',
    ],
    remove: true,
  },
  
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Request logger middleware for Express
export function expressLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        ip: req.ip || req.connection.remoteAddress,
      };
      
      if (res.statusCode >= 500) {
        logger.error(logData, 'Request failed');
      } else if (res.statusCode >= 400) {
        logger.warn(logData, 'Request error');
      } else {
        logger.info(logData, 'Request completed');
      }
    });
    
    next();
  };
}

// Helper for logging errors with context
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    'Error occurred'
  );
}

// Helper for logging performance metrics
export function logPerformance(operation: string, duration: number, context?: Record<string, any>) {
  logger.info(
    {
      operation,
      duration,
      ...context,
    },
    'Performance metric'
  );
}
