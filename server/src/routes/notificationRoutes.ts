import { Router } from 'express';
import { authMiddleware as auth } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', getNotifications);

// GET /api/notifications/unread/count - Contar no leídas
router.get('/unread/count', getUnreadCount);

// PATCH /api/notifications/read-all - Marcar todas como leídas
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read - Marcar una como leída
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id', deleteNotification);

export default router;
