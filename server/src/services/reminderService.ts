import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';
import * as cron from 'node-cron';

const prisma = new PrismaClient();

class ReminderService {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Verificar recordatorios pendientes y enviar notificaciones
   */
  async checkPendingReminders() {
    try {
      const now = new Date();
      
      // Buscar recordatorios que ya pasaron y no han sido enviados
      const pendingReminders = await prisma.reminders.findMany({
        where: {
          enviado: false,
          fechaHora: {
            lte: now,
          },
        },
        include: {
          task: {
            include: {
              project: {
                select: {
                  userId: true,
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

      console.log(`[Reminder] Found ${pendingReminders.length} pending reminders`);

      // Enviar cada recordatorio
      for (const reminder of pendingReminders) {
        await this.sendReminder(reminder);
      }
    } catch (error) {
      console.error('[Reminder] Error checking pending reminders:', error);
    }
  }

  /**
   * Enviar un recordatorio específico
   */
  async sendReminder(reminder: any) {
    try {
      const userId = reminder.task.project.userId;
      const taskTitle = reminder.task.titulo;
      const projectName = reminder.task.project.nombre;

      // Crear notificación
      await notificationService.create({
        userId: userId,
        type: 'reminder',
        title: '🔔 Recordatorio',
        message: `Recordatorio para: "${taskTitle}" en ${projectName}`,
        taskId: reminder.taskId,
        projectId: reminder.task.projectId,
        metadata: {
          reminderDate: reminder.fechaHora,
        },
      });

      // Marcar recordatorio como enviado
      await prisma.reminders.update({
        where: { id: reminder.id },
        data: { enviado: true },
      });

      console.log(`[Reminder] Sent reminder ${reminder.id} for task ${reminder.taskId}`);
    } catch (error) {
      console.error('[Reminder] Error sending reminder:', error);
    }
  }

  /**
   * Iniciar el checker de recordatorios (cada minuto)
   */
  startReminderChecker() {
    if (this.cronJob) {
      console.log('[Reminder] Checker already running');
      return;
    }

    // Ejecutar cada minuto
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkPendingReminders();
    });

    console.log('[Reminder] Checker started (runs every minute)');
    
    // También ejecutar inmediatamente al iniciar
    this.checkPendingReminders();
  }

  /**
   * Detener el checker de recordatorios
   */
  stopReminderChecker() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Reminder] Checker stopped');
    }
  }

  /**
   * Chequear tareas que vencen hoy o mañana y crear notificaciones
   */
  async checkDueDates() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2);

      // Buscar tareas que vencen hoy o mañana y no están completadas
      const dueTasks = await prisma.tasks.findMany({
        where: {
          completada: false,
          fechaVencimiento: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          project: {
            select: {
              userId: true,
              id: true,
              nombre: true,
            },
          },
        },
      });

      console.log(`[Reminder] Found ${dueTasks.length} tasks due soon`);

      for (const task of dueTasks) {
        const dueDate = new Date(task.fechaVencimiento!);
        const isToday = dueDate.toDateString() === today.toDateString();
        
        // Verificar si ya existe una notificación reciente para esta tarea
        const existingNotification = await prisma.notifications.findFirst({
          where: {
            userId: task.project.userId,
            taskId: task.id,
            type: 'due_date',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
        });

        if (!existingNotification) {
          await notificationService.create({
            userId: task.project.userId,
            type: 'due_date',
            title: isToday ? '⚠️ Tarea vence hoy' : '📅 Tarea vence mañana',
            message: `"${task.titulo}" en ${task.project.nombre}`,
            taskId: task.id,
            projectId: task.projectId,
            metadata: {
              dueDate: task.fechaVencimiento,
              isToday,
            },
          });
        }
      }
    } catch (error) {
      console.error('[Reminder] Error checking due dates:', error);
    }
  }

  /**
   * Iniciar checker de fechas de vencimiento (cada hora)
   */
  startDueDateChecker() {
    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
      await this.checkDueDates();
    });

    console.log('[Reminder] Due date checker started (runs every hour)');
    
    // También ejecutar inmediatamente al iniciar
    this.checkDueDates();
  }
}

export const reminderService = new ReminderService();
