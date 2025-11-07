/**
 * Tipos para API y Request/Response
 * Define las interfaces comunes para peticiones y respuestas HTTP
 */

import { Request } from 'express';

/**
 * Request autenticado con userId
 * Extiende el Request de Express añadiendo información del usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Respuesta de error estándar
 */
export interface ErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Respuesta de éxito estándar
 */
export interface SuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Headers de claves API
 */
export interface APIKeyHeaders {
  'x-groq-api-key'?: string;
  'x-gemini-api-key'?: string;
}
