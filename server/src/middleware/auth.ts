import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header o de query params (para SSE)
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    // Para SSE, permitir token en query params
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as { userId: string };

    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Export as 'auth' for backward compatibility
export const auth = authMiddleware;

