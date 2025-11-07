import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

/**
 * Configuración de seguridad para la aplicación Express
 */
export const configureSecurityMiddleware = (app: Express) => {
  // Helmet - Protección de headers HTTP
  app.use(helmet({
    // Configuración personalizada para permitir el funcionamiento con el frontend
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // En producción, CSP más restrictivo sin 'unsafe-inline' ni 'unsafe-eval'
        // En desarrollo, permite 'unsafe-inline' y 'unsafe-eval' para HMR y React DevTools
        scriptSrc: process.env.NODE_ENV === 'production' 
          ? ["'self'"]
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting general - Prevenir abuso de la API
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por ventana
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(generalLimiter);

  // Rate limiting estricto para autenticación
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 intentos de login
    message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo más tarde.',
    skipSuccessfulRequests: true, // No contar requests exitosos
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Rate limiting para endpoints de IA (más costosos)
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // Máximo 10 requests por minuto
    message: 'Demasiadas solicitudes al asistente de IA, por favor espera un momento.',
  });

  app.use('/api/ai', aiLimiter);

  console.log('✓ Middleware de seguridad configurado');
};

/**
 * Rate limiter específico para crear tareas en bulk
 */
export const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 operaciones bulk por minuto
  message: 'Demasiadas operaciones masivas, por favor espera un momento.',
});

/**
 * Sanitización de inputs - Prevenir inyección de código
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover tags de script
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remover iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remover event handlers inline
    .substring(0, 10000); // Limitar longitud máxima
};

/**
 * Validar que un ID sea un UUID válido
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Configuración de CORS segura que permite acceso desde red local
 */
export const getCorsOptions = () => {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir requests sin origin (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Parse the origin URL
      try {
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;

        // Permitir localhost variants
        const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0'];
        if (localhostVariants.includes(hostname)) {
          return callback(null, true);
        }

        // Permitir IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
        ) {
          return callback(null, true);
        }
        
        // Permitir IPv6 localhost y direcciones link-local
        if (
          hostname === '::1' ||
          hostname === '::' ||
          hostname.startsWith('fe80:') ||
          hostname.startsWith('[::1]') ||
          hostname.startsWith('[fe80:')
        ) {
          return callback(null, true);
        }

        // Permitir URL de frontend configurada si existe
        if (process.env.FRONTEND_URL) {
          const frontendUrl = new URL(process.env.FRONTEND_URL);
          if (hostname === frontendUrl.hostname) {
            return callback(null, true);
          }
        }

        // En producción, permitir dominio de producción si está configurado
        if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_FRONTEND_URL) {
          const productionUrl = new URL(process.env.PRODUCTION_FRONTEND_URL);
          if (hostname === productionUrl.hostname) {
            return callback(null, true);
          }
        }

        // Log rejected origins para debugging
        console.warn(`CORS: Origin no permitido: ${origin}`);
        return callback(null, false);
      } catch (e) {
        console.error(`CORS: URL de origin inválida: ${origin}`);
        return callback(null, false);
      }
    },
    credentials: true,
  };
};
