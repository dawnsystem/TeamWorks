import { PrismaClient } from '@prisma/client';
import { sseService } from './sseService';

const prisma = new PrismaClient();

class TaskSubscriptionService {
  /**
   * Subscribe a user to a task
   */
  async subscribe(taskId: string, userId: string) {
    try {
      // Check if already subscribed
      const existing = await prisma.taskSubscription.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      const subscription = await prisma.taskSubscription.create({
        data: {
          taskId,
          userId,
        },
      });

      console.log(`[TaskSubscription] User ${userId} subscribed to task ${taskId}`);

      // Send SSE event
      sseService.sendTaskEvent({
        type: 'task_subscription_created',
        projectId: 'global',
        taskId,
        userId,
        timestamp: new Date(),
        data: subscription,
      });

      return subscription;
    } catch (error) {
      console.error('[TaskSubscription] Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from a task
   */
  async unsubscribe(taskId: string, userId: string) {
    try {
      const subscription = await prisma.taskSubscription.deleteMany({
        where: {
          taskId,
          userId,
        },
      });

      console.log(`[TaskSubscription] User ${userId} unsubscribed from task ${taskId}`);

      // Send SSE event
      sseService.sendTaskEvent({
        type: 'task_subscription_deleted',
        projectId: 'global',
        taskId,
        userId,
        timestamp: new Date(),
        data: { taskId, userId },
      });

      return subscription;
    } catch (error) {
      console.error('[TaskSubscription] Error unsubscribing:', error);
      throw error;
    }
  }

  /**
   * Check if a user is subscribed to a task
   */
  async isSubscribed(taskId: string, userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.taskSubscription.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      return !!subscription;
    } catch (error) {
      console.error('[TaskSubscription] Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get all subscribers for a task
   */
  async getSubscribers(taskId: string): Promise<string[]> {
    try {
      const subscriptions = await prisma.taskSubscription.findMany({
        where: { taskId },
        select: { userId: true },
      });

      return subscriptions.map(s => s.userId);
    } catch (error) {
      console.error('[TaskSubscription] Error getting subscribers:', error);
      return [];
    }
  }

  /**
   * Get all task subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    try {
      const subscriptions = await prisma.taskSubscription.findMany({
        where: { userId },
        include: {
          task: {
            select: {
              id: true,
              titulo: true,
              projectId: true,
              completada: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return subscriptions;
    } catch (error) {
      console.error('[TaskSubscription] Error getting user subscriptions:', error);
      throw error;
    }
  }

  /**
   * Auto-subscribe creator when task is created
   */
  async autoSubscribeCreator(taskId: string, creatorId: string) {
    try {
      return await this.subscribe(taskId, creatorId);
    } catch (error) {
      console.error('[TaskSubscription] Error auto-subscribing creator:', error);
      // Don't throw, this is a non-critical operation
      return null;
    }
  }
}

export const taskSubscriptionService = new TaskSubscriptionService();
