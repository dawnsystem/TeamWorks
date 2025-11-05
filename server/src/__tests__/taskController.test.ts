import { getTasks, getTask, createTask, updateTask, deleteTask } from '../controllers/taskController';
import prisma from '../lib/prisma';
import { sseService } from '../services/sseService';
import { taskSubscriptionService } from '../services/taskSubscriptionService';
import { assertProjectPermission } from '../services/projectShareService';
import { findUnauthorizedLabelIds } from '../services/labelDomainService';
import { applyTaskAutomations } from '../services/automationService';
import { fetchSingleTask, fetchTasksForest } from '../services/taskDomainService';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    tasks: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/sseService', () => ({
  sseService: {
    sendTaskEvent: jest.fn(),
  },
}));

jest.mock('../services/taskSubscriptionService', () => ({
  taskSubscriptionService: {
    autoSubscribeCreator: jest.fn(),
  },
}));

jest.mock('../services/projectShareService', () => ({
  assertProjectPermission: jest.fn(),
}));

jest.mock('../services/labelDomainService', () => ({
  findUnauthorizedLabelIds: jest.fn(),
}));

jest.mock('../services/automationService', () => ({
  applyTaskAutomations: jest.fn(),
}));

jest.mock('../services/taskDomainService', () => ({
  fetchSingleTask: jest.fn(),
  fetchTasksForest: jest.fn(),
}));

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('taskController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to avoid test output clutter
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTasks', () => {
    it('should get tasks with filters successfully', async () => {
      const req: any = {
        query: { projectId: 'project-1', filter: 'pending' },
        userId: 'user-1',
      };
      const res = mockResponse();

      const mockTasks = [
        { id: 'task-1', titulo: 'Task 1', completada: false },
        { id: 'task-2', titulo: 'Task 2', completada: false },
      ];

      (fetchTasksForest as jest.Mock).mockResolvedValue(mockTasks);

      await getTasks(req, res);

      expect(fetchTasksForest).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should handle search queries', async () => {
      const req: any = {
        query: { search: 'test', projectId: 'project-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      const mockTasks = [{ id: 'task-1', titulo: 'Test Task' }];
      (fetchTasksForest as jest.Mock).mockResolvedValue(mockTasks);

      await getTasks(req, res);

      expect(fetchTasksForest).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should filter by labels', async () => {
      const req: any = {
        query: { labelId: 'label-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      const mockTasks = [{ id: 'task-1', titulo: 'Labeled Task' }];
      (fetchTasksForest as jest.Mock).mockResolvedValue(mockTasks);

      await getTasks(req, res);

      expect(fetchTasksForest).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        query: {},
        userId: 'user-1',
      };
      const res = mockResponse();

      (fetchTasksForest as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al obtener tareas',
        })
      );
    });
  });

  describe('getTask', () => {
    it('should get a single task successfully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      const mockTask = {
        id: 'task-1',
        titulo: 'Test Task',
        descripcion: 'Description',
        completada: false,
      };

      (fetchSingleTask as jest.Mock).mockResolvedValue(mockTask);

      await getTask(req, res);

      expect(fetchSingleTask).toHaveBeenCalledWith(prisma, 'task-1', 'user-1');
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 404 if task not found', async () => {
      const req: any = {
        params: { id: 'nonexistent' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (fetchSingleTask as jest.Mock).mockResolvedValue(null);

      await getTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (fetchSingleTask as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener tarea' });
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const req: any = {
        body: {
          titulo: 'New Task',
          descripcion: 'Task description',
          prioridad: 2,
          projectId: 'project-1',
          labelIds: ['label-1'],
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      const mockTask = {
        id: 'task-1',
        titulo: 'New Task',
        descripcion: 'Task description',
        prioridad: 2,
        projectId: 'project-1',
        createdBy: 'user-1',
        task_labels: [],
      };

      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (findUnauthorizedLabelIds as jest.Mock).mockResolvedValue([]);
      (applyTaskAutomations as jest.Mock).mockResolvedValue({
        patches: {},
        notes: [],
      });
      (prisma.tasks.create as jest.Mock).mockResolvedValue(mockTask);
      (fetchSingleTask as jest.Mock).mockResolvedValue(mockTask);
      (taskSubscriptionService.autoSubscribeCreator as jest.Mock).mockResolvedValue(undefined);

      await createTask(req, res);

      expect(assertProjectPermission).toHaveBeenCalledWith(prisma, 'project-1', 'user-1', 'write');
      expect(findUnauthorizedLabelIds).toHaveBeenCalledWith(prisma, ['label-1'], 'user-1');
      expect(prisma.tasks.create).toHaveBeenCalled();
      expect(taskSubscriptionService.autoSubscribeCreator).toHaveBeenCalledWith('task-1', 'user-1');
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_created',
          projectId: 'project-1',
          taskId: 'task-1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 403 if user lacks project permissions', async () => {
      const req: any = {
        body: {
          titulo: 'New Task',
          projectId: 'project-1',
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      const permissionError: any = new Error('Insufficient permissions');
      permissionError.status = 403;
      (assertProjectPermission as jest.Mock).mockRejectedValue(permissionError);

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions',
        })
      );
    });

    it('should return 403 if unauthorized label IDs', async () => {
      const req: any = {
        body: {
          titulo: 'New Task',
          projectId: 'project-1',
          labelIds: ['label-1', 'label-2'],
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (findUnauthorizedLabelIds as jest.Mock).mockResolvedValue(['label-2']);

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No tienes acceso a una o más etiquetas',
          invalidLabelIds: ['label-2'],
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        body: {
          titulo: 'New Task',
          projectId: 'project-1',
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (findUnauthorizedLabelIds as jest.Mock).mockResolvedValue([]);
      (applyTaskAutomations as jest.Mock).mockResolvedValue({ patches: {}, notes: [] });
      (prisma.tasks.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear tarea' });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        body: {
          titulo: 'Updated Task',
          completada: true,
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      const existingTask = {
        id: 'task-1',
        titulo: 'Old Task',
        projectId: 'project-1',
        completada: false,
      };

      const updatedTask = {
        id: 'task-1',
        titulo: 'Updated Task',
        projectId: 'project-1',
        completada: true,
      };

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(existingTask);
      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (applyTaskAutomations as jest.Mock).mockResolvedValue({ patches: {}, notes: [] });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          task_labels: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
          tasks: {
            update: jest.fn().mockResolvedValue(updatedTask),
          },
        });
      });
      (fetchSingleTask as jest.Mock).mockResolvedValue(updatedTask);

      await updateTask(req, res);

      expect(prisma.tasks.findFirst).toHaveBeenCalled();
      expect(assertProjectPermission).toHaveBeenCalledWith(prisma, 'project-1', 'user-1', 'write');
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_updated',
          taskId: 'task-1',
        })
      );
      expect(res.json).toHaveBeenCalledWith(updatedTask);
    });

    it('should return 404 if task not found', async () => {
      const req: any = {
        params: { id: 'nonexistent' },
        body: { titulo: 'Updated Task' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(null);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('should return 403 if unauthorized label IDs', async () => {
      const req: any = {
        params: { id: 'task-1' },
        body: {
          titulo: 'Updated Task',
          labelIds: ['label-1', 'label-2'],
        },
        userId: 'user-1',
      };
      const res = mockResponse();

      const existingTask = {
        id: 'task-1',
        titulo: 'Old Task',
        projectId: 'project-1',
      };

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(existingTask);
      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (findUnauthorizedLabelIds as jest.Mock).mockResolvedValue(['label-2']);

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No tienes acceso a una o más etiquetas',
          invalidLabelIds: ['label-2'],
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        body: { titulo: 'Updated Task' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.tasks.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar tarea' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        userId: 'user-1',
      };
      const res = mockResponse();
      res.send = jest.fn().mockReturnValue(res);

      const existingTask = {
        id: 'task-1',
        titulo: 'Task to delete',
        projectId: 'project-1',
      };

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(existingTask);
      (assertProjectPermission as jest.Mock).mockResolvedValue(undefined);
      (prisma.tasks.delete as jest.Mock).mockResolvedValue(existingTask);

      await deleteTask(req, res);

      expect(prisma.tasks.findFirst).toHaveBeenCalled();
      expect(assertProjectPermission).toHaveBeenCalledWith(prisma, 'project-1', 'user-1', 'write');
      expect(prisma.tasks.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_deleted',
          taskId: 'task-1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if task not found', async () => {
      const req: any = {
        params: { id: 'nonexistent' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(null);

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tarea no encontrada' });
    });

    it('should return 403 if user lacks permissions', async () => {
      const req: any = {
        params: { id: 'task-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      const existingTask = {
        id: 'task-1',
        titulo: 'Task to delete',
        projectId: 'project-1',
      };

      const permissionError: any = new Error('Insufficient permissions');
      permissionError.status = 403;

      (prisma.tasks.findFirst as jest.Mock).mockResolvedValue(existingTask);
      (assertProjectPermission as jest.Mock).mockRejectedValue(permissionError);

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions',
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        params: { id: 'task-1' },
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.tasks.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar tarea' });
    });
  });
});
