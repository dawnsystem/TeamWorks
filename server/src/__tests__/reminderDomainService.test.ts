import { fetchRemindersByTask, createReminder, deleteReminder } from '../services/reminderDomainService';

const prismaMock = () => ({
  tasks: {
    findFirst: jest.fn(),
  },
  reminders: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
});

describe('reminderDomainService', () => {
  const userId = 'user-1';
  const taskId = 'task-1';

  describe('fetchRemindersByTask', () => {
    it('devuelve null cuando la tarea no existe o no pertenece al usuario', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await fetchRemindersByTask(prisma as any, taskId, userId);

      expect(result).toBeNull();
      expect(prisma.reminders.findMany).not.toHaveBeenCalled();
    });

    it('devuelve recordatorios cuando la tarea es válida', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue({ id: taskId });
      prisma.reminders.findMany.mockResolvedValue([{ id: 'rem-1' }]);

      const result = await fetchRemindersByTask(prisma as any, taskId, userId);

      expect(result).toEqual([{ id: 'rem-1' }]);
      expect(prisma.reminders.findMany).toHaveBeenCalled();
    });
  });

  describe('createReminder', () => {
    it('devuelve null si la tarea no existe', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await createReminder(prisma as any, {
        taskId,
        userId,
        fechaHora: new Date().toISOString(),
      });

      expect(result).toBeNull();
      expect(prisma.reminders.create).not.toHaveBeenCalled();
    });

    it('crea un recordatorio cuando la tarea es válida', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue({ id: taskId });
      prisma.reminders.create.mockResolvedValue({ id: 'rem-1' });

      const result = await createReminder(prisma as any, {
        taskId,
        userId,
        fechaHora: new Date().toISOString(),
      });

      expect(prisma.reminders.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'rem-1' });
    });
  });

  describe('deleteReminder', () => {
    it('devuelve null cuando no encuentra el recordatorio', async () => {
      const prisma = prismaMock();
      prisma.reminders.findFirst.mockResolvedValue(null);

      const result = await deleteReminder(prisma as any, {
        reminderId: 'rem-1',
        userId,
      });

      expect(result).toBeNull();
    });

    it('elimina el recordatorio cuando existe', async () => {
      const prisma = prismaMock();
      const reminderMock = {
        id: 'rem-1',
        fechaHora: new Date(),
        tasks: {
          id: taskId,
          projectId: 'project-1',
          projects: { id: 'project-1', userId },
        },
      };
      prisma.reminders.findFirst.mockResolvedValue(reminderMock);
      prisma.reminders.delete.mockResolvedValue({});

      const result = await deleteReminder(prisma as any, {
        reminderId: 'rem-1',
        userId,
      });

      expect(prisma.reminders.delete).toHaveBeenCalledWith({ where: { id: 'rem-1' } });
      expect(result).toEqual(reminderMock);
    });
  });
});


