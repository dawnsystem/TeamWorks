import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sseService } from '../services/sseService';
import { v4 as uuidv4 } from 'uuid';

export const sseConnection = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const clientId = uuidv4();

    // Agregar cliente al servicio SSE
    sseService.addClient(clientId, userId, res);

    // Enviar evento de bienvenida
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId })}\n\n`);

    // No cerrar la respuesta aquí - se mantendrá abierta
  } catch (error) {
    console.error('[SSE] Error al establecer conexión SSE:', error);
    res.status(500).json({ error: 'Error al establecer conexión SSE' });
  }
};

export const sseStats = async (req: any, res: Response) => {
  try {
    const stats = sseService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[SSE] Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
