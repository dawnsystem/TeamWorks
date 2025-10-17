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
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necesario para React en desarrollo
        imgSrc: ["'self'", "data:", "https:"],
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
 * Configuración de CORS segura
 */
export const getCorsOptions = () => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ];

  // En producción, añadir más orígenes permitidos si es necesario
  if (process.env.NODE_ENV === 'production') {
    // Añadir dominio de producción
    if (process.env.PRODUCTION_FRONTEND_URL) {
      allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
    }
  }

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir requests sin origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin no permitido: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
  };
};
