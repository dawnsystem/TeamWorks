import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { assertProjectPermission } from '../services/projectShareService';
import {
  fetchRemindersByTask,
  createReminder as createReminderDomain,
  deleteReminder as deleteReminderDomain,
} from '../services/reminderDomainService';
import { reminderFactory } from '../factories/reminderFactory';
import prisma from '../lib/prisma';

const projectAccessCondition = (userId: string) => ({
  OR: [
    { projects: { userId } },
    { projects: { shares: { some: { sharedWithId: userId } } } },
  ],
});

// GET /api/tasks/:taskId/reminders
export const getRemindersByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        ...projectAccessCondition(userId),
      },
      include: {
        projects: {
          select: { id: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await assertProjectPermission(prisma, task.projects.id, userId, 'write');

    const reminders = await fetchRemindersByTask(prisma, taskId, userId);

    if (!reminders) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json(reminders.map(reminderFactory.toClientReminder));
  } catch (error) {
    console.error('Error en getRemindersByTask:', error);
    res.status(500).json({ message: 'Error al obtener recordatorios' });
  }
};

// POST /api/tasks/:taskId/reminders
export const createReminder = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { fechaHora } = req.body;
    const userId = (req as AuthRequest).userId;

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        ...projectAccessCondition(userId),
      },
      include: {
        projects: {
          select: { id: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await assertProjectPermission(prisma, task.projects.id, userId, 'write');

    const reminder = await createReminderDomain(prisma, {
      taskId,
      userId,
      fechaHora,
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.status(201).json(reminderFactory.toClientReminder(reminder));
  } catch (error) {
    console.error('Error en createReminder:', error);
    res.status(500).json({ message: 'Error al crear recordatorio' });
  }
};

// DELETE /api/reminders/:id
export const deleteReminder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    const reminder = await prisma.reminders.findFirst({
      where: {
        id,
        tasks: {
          ...projectAccessCondition(userId),
        },
      },
      include: {
        tasks: {
          select: { projectId: true },
        },
      },
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    await assertProjectPermission(prisma, reminder.tasks.projectId, userId, 'write');

    const deletedReminder = await deleteReminderDomain(prisma, {
      reminderId: id,
      userId,
    });

    if (!deletedReminder) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    res.json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    console.error('Error en deleteReminder:', error);
    res.status(500).json({ message: 'Error al eliminar recordatorio' });
  }
};

