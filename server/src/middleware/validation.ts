import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validar el body de la request usando un esquema de Zod
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar y parsear el body
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear errores de validación
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Errores de validación',
          details: errors,
        });
      }

      // Error inesperado
      console.error('Error en validación:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
};

/**
 * Middleware para validar query params usando un esquema de Zod
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Errores de validación en query params',
          details: errors,
        });
      }

      console.error('Error en validación de query:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
};

/**
 * Middleware para validar params de la URL usando un esquema de Zod
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Parámetros de URL inválidos',
          details: errors,
        });
      }

      console.error('Error en validación de params:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
};

// Helper para crear esquemas de params comunes
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid('ID de tarea inválido'),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
});

export const labelIdParamSchema = z.object({
  labelId: z.string().uuid('ID de etiqueta inválido'),
});
