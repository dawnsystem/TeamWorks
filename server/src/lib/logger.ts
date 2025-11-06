import pino from 'pino';

/**
 * Structured logger using Pino
 * 
 * Provides consistent, structured logging across the application
 * with automatic request tracking and contextual information.
 */

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// Configure logger based on environment
const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log helpers for common scenarios
 */
export const log = {
  /**
   * Log an informational message
   */
  info: (msg: string, data?: Record<string, any>) => {
    logger.info(data || {}, msg);
  },

  /**
   * Log a warning message
   */
  warn: (msg: string, data?: Record<string, any>) => {
    logger.warn(data || {}, msg);
  },

  /**
   * Log an error message
   */
  error: (msg: string, error?: Error | unknown, data?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error({
        ...data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }, msg);
    } else if (error) {
      logger.error({ ...data, error }, msg);
    } else {
      logger.error(data || {}, msg);
    }
  },

  /**
   * Log a debug message (only in development)
   */
  debug: (msg: string, data?: Record<string, any>) => {
    logger.debug(data || {}, msg);
  },

  /**
   * Log an HTTP request
   */
  http: (method: string, path: string, data?: Record<string, any>) => {
    logger.info({ method, path, ...data }, 'HTTP Request');
  },

  /**
   * Log a database query
   */
  db: (operation: string, model: string, data?: Record<string, any>) => {
    logger.debug({ operation, model, ...data }, 'Database Operation');
  },

  /**
   * Log an authentication event
   */
  auth: (event: string, userId?: string, data?: Record<string, any>) => {
    logger.info({ event, userId, ...data }, 'Authentication Event');
  },

  /**
   * Log an AI operation
   */
  ai: (operation: string, provider?: string, data?: Record<string, any>) => {
    logger.info({ operation, provider, ...data }, 'AI Operation');
  },
};

export default logger;
