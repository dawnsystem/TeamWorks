import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

// GET /api/notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { read, type, limit, offset } = req.query;

    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type: type as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const notifications = await notificationService.getByUser(userId, filters);

    res.json(notifications);
  } catch (error) {
    console.error('Error en getNotifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// GET /api/notifications/unread/count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const count = await notificationService.countUnread(userId);

    res.json({ count });
  } catch (error) {
    console.error('Error en getUnreadCount:', error);
    res.status(500).json({ error: 'Error al contar notificaciones no leídas' });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;

    await notificationService.markAsRead(id, userId);

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error en markAsRead:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;

    await notificationService.markAllAsRead(userId);

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error en markAllAsRead:', error);
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas' });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;

    await notificationService.delete(id, userId);

    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error en deleteNotification:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};
