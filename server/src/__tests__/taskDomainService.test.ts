import { buildTaskTree, fetchTasksForest, fetchSingleTask } from '../services/taskDomainService';

jest.mock('../factories/taskFactory', () => ({
  toClientTask: jest.fn((task: any) => ({
    id: task.id,
    titulo: task.titulo,
    other_tasks: task.other_tasks ?? [],
  })),
}));

const prismaMock = () => ({
  tasks: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
});

describe('taskDomainService', () => {
  const userId = 'user-1';

  describe('buildTaskTree', () => {
    it('devuelve null cuando no encuentra la tarea raíz', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await buildTaskTree(prisma as any, 'task-1', userId);

      expect(result).toBeNull();
    });

    it('devuelve la tarea con subtareas anidadas', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValueOnce({ id: 'task-1', titulo: 'Raíz' });
      prisma.tasks.findMany.mockResolvedValueOnce([
        { id: 'task-2', titulo: 'Subtarea', parentTaskId: 'task-1' },
      ]);
      prisma.tasks.findMany.mockResolvedValueOnce([]);

      const result = await buildTaskTree(prisma as any, 'task-1', userId);

      expect(result).toEqual({
        id: 'task-1',
        titulo: 'Raíz',
        other_tasks: [
          {
            id: 'task-2',
            titulo: 'Subtarea',
            parentTaskId: 'task-1',
            other_tasks: [],
          },
        ],
      });
    });
  });

  describe('fetchTasksForest', () => {
    it('convierte cada tarea raíz usando el factory', async () => {
      const prisma = prismaMock();
      prisma.tasks.findMany
        .mockResolvedValueOnce([
          { id: 'task-1', titulo: 'Tarea 1' },
          { id: 'task-2', titulo: 'Tarea 2' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await fetchTasksForest(prisma as any, {}, userId);

      expect(result).toEqual([
        { id: 'task-1', titulo: 'Tarea 1', other_tasks: [] },
        { id: 'task-2', titulo: 'Tarea 2', other_tasks: [] },
      ]);
    });
  });

  describe('fetchSingleTask', () => {
    it('devuelve null si no encuentra la tarea', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await fetchSingleTask(prisma as any, 'task-1', userId);
      expect(result).toBeNull();
    });

    it('devuelve la tarea convertida', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue({ id: 'task-1', titulo: 'Tarea' });
      prisma.tasks.findMany.mockResolvedValue([]);

      const result = await fetchSingleTask(prisma as any, 'task-1', userId);

      expect(result).toEqual({ id: 'task-1', titulo: 'Tarea', other_tasks: [] });
    });
  });
});


