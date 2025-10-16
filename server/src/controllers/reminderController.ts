import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tasks/:taskId/reminders
export const getRemindersByTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const reminders = await prisma.reminder.findMany({
      where: { taskId },
      orderBy: { fechaHora: 'asc' },
    });

    res.json(reminders);
  } catch (error) {
    console.error('Error en getRemindersByTask:', error);
    res.status(500).json({ message: 'Error al obtener recordatorios' });
  }
};

// POST /api/tasks/:taskId/reminders
export const createReminder = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { fechaHora } = req.body;

    if (!fechaHora) {
      return res.status(400).json({ message: 'La fecha y hora son requeridas' });
    }

    const reminderDate = new Date(fechaHora);
    if (isNaN(reminderDate.getTime())) {
      return res.status(400).json({ message: 'Fecha inválida' });
    }

    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const reminder = await prisma.reminder.create({
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
export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Recordatorio no encontrado' });
    }

    await prisma.reminder.delete({
      where: { id },
    });

    res.json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    console.error('Error en deleteReminder:', error);
    res.status(500).json({ message: 'Error al eliminar recordatorio' });
  }
};

