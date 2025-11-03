import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// GET /api/tasks/:taskId/reminders
export const getRemindersByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    // Verificar que la tarea pertenece al usuario
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const reminders = await prisma.reminders.findMany({
      where: {
        taskId,
        task: {
          project: { userId }
        }
      },
      orderBy: { fechaHora: 'asc' },
    });

    res.json(reminders);
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

    // Validación de formato ya realizada por middleware

    // Verificar que la tarea pertenece al usuario
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // fechaHora viene como string ISO del middleware, convertir a Date
    const reminderDate = new Date(fechaHora);

    const reminder = await prisma.reminders.create({
      data: {
        fechaHora: reminderDate,
        taskId,
      },
    });

    res.status(201).json(reminder);
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

    // Verificar que el recordatorio pertenece a una tarea del usuario
    const reminder = await prisma.reminders.findFirst({
      where: {
        id,
        task: {
          project: { userId }
        }
      }
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    await prisma.reminders.delete({
      where: { id },
    });

    res.json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    console.error('Error en deleteReminder:', error);
    res.status(500).json({ message: 'Error al eliminar recordatorio' });
  }
};

