import { sseService } from './sseService';
import { taskSubscriptionService } from './taskSubscriptionService';
import prisma from '../lib/prisma';

export type NotificationType = 
  | 'reminder'
  | 'comment'
  | 'task_completed'
  | 'due_date'
  | 'mention'
  | 'ai_action'
  | 'project_created'
  | 'section_created'
  | 'project_shared'
  | 'project_unshared';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  commentId?: string;
  projectId?: string;
  sectionId?: string;
  labelId?: string;
  metadata?: any;
}

class NotificationService {
  /**
   * Crear una nueva notificación
   */
  async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.notifications.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          taskId: data.taskId,
          commentId: data.commentId,
          projectId: data.projectId,
          sectionId: data.sectionId,
          labelId: data.labelId,
          metadata: data.metadata,
        },
      });

      // Enviar evento SSE
      sseService.sendTaskEvent({
        type: 'notification_created',
        projectId: data.projectId || 'global',
        userId: data.userId,
        timestamp: new Date(),
        data: notification,
      });

      console.log(`[Notification] Created: ${data.type} for user ${data.userId}`);

      return notification;
    } catch (error) {
      console.error('[Notification] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getByUser(
    userId: string,
    filters?: {
      read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const where: any = { userId };

      if (filters?.read !== undefined) {
        where.read = filters.read;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      const notifications = await prisma.notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          tasks: {
            select: {
              id: true,
              titulo: true,
              projectId: true,
            },
          },
          comments: {
            select: {
              id: true,
              contenido: true,
            },
          },
          projects: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      return notifications;
    } catch (error) {
      console.error('[Notification] Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string, userId: string) {
    try {
      const notification = await prisma.notifications.updateMany({
        where: { id, userId },
        data: { read: true },
      });

      // Enviar evento SSE
      sseService.sendTaskEvent({
        type: 'notification_read',
        projectId: 'global',
        userId: userId,
        timestamp: new Date(),
        data: { id },
      });

      return notification;
    } catch (error) {
      console.error('[Notification] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notifications.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      // Enviar evento SSE
      sseService.sendTaskEvent({
        type: 'notification_read',
        projectId: 'global',
        userId: userId,
        timestamp: new Date(),
        data: { all: true },
      });

      return result;
    } catch (error) {
      console.error('[Notification] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async delete(id: string, userId: string) {
    try {
      const notification = await prisma.notifications.deleteMany({
        where: { id, userId },
      });

      // Enviar evento SSE
      sseService.sendTaskEvent({
        type: 'notification_deleted',
        projectId: 'global',
        userId: userId,
        timestamp: new Date(),
        data: { id },
      });

      return notification;
    } catch (error) {
      console.error('[Notification] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  async countUnread(userId: string) {
    try {
      const count = await prisma.notifications.count({
        where: { userId, read: false },
      });

      return count;
    } catch (error) {
      console.error('[Notification] Error counting unread:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días)
   */
  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notifications.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(`[Notification] Cleaned ${result.count} old notifications`);

      return result;
    } catch (error) {
      console.error('[Notification] Error cleaning old notifications:', error);
      throw error;
    }
  }

  /**
   * Crear notificaciones para suscriptores de una tarea (excluyendo al actor)
   */
  async createForTaskSubscribers(
    taskId: string,
    actorUserId: string,
    notificationData: Omit<CreateNotificationData, 'userId'>,
  ) {
    try {
      // Get all subscribers for the task
      const subscriberIds = await taskSubscriptionService.getSubscribers(taskId);

      // Filter out the actor (no auto-notifications)
      const targetUserIds = subscriberIds.filter(userId => userId !== actorUserId);

      if (targetUserIds.length === 0) {
        console.log(`[Notification] No subscribers to notify for task ${taskId}`);
        return [];
      }

      // Create notifications for all subscribers
      const notifications = await Promise.all(
        targetUserIds.map(userId =>
          this.create({
            ...notificationData,
            userId,
            taskId,
          }),
        ),
      );

      console.log(`[Notification] Created ${notifications.length} notifications for task ${taskId} subscribers`);

      return notifications;
    } catch (error) {
      console.error('[Notification] Error creating notifications for subscribers:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
