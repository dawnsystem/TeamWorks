/**
 * Tests for Enhanced AI Actions
 * 
 * This test suite validates the new AI capabilities:
 * - create_with_subtasks: Recursive subtask creation
 * - delete_bulk: Enhanced bulk deletion with filters
 * - move_bulk: Bulk move operations
 * - reorder: Task reorganization
 */

import { executeAIActions, AIAction } from '../services/aiService';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  projects: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  tasks: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  sections: {
    findFirst: jest.fn(),
  },
  labels: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  task_labels: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaClient;

const mockUserId = 'user123';

describe('Enhanced AI Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create_with_subtasks - Recursive Subtask Creation', () => {
    it('should create a task with nested subtasks', async () => {
      const mockProject = { 
        id: 'proj1', 
        nombre: 'Inbox',
        userId: mockUserId,
        shares: []
      };
      
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockProject);
      (mockPrisma.tasks.create as jest.Mock)
        .mockResolvedValueOnce({ id: 'task1', titulo: 'Main Task' })
        .mockResolvedValueOnce({ id: 'task2', titulo: 'Subtask 1' })
        .mockResolvedValueOnce({ id: 'task3', titulo: 'Nested Subtask' });

      const action: AIAction = {
        type: 'create_with_subtasks',
        entity: 'task',
        data: {
          titulo: 'Main Task',
          prioridad: 1,
          subtasks: [
            {
              titulo: 'Subtask 1',
              prioridad: 2,
              subtasks: [
                {
                  titulo: 'Nested Subtask',
                  prioridad: 3,
                },
              ],
            },
          ],
        },
        confidence: 0.9,
        explanation: 'Create task with nested subtasks',
      };

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.create).toHaveBeenCalledTimes(3);
    });

    it('should handle subtasks with labels', async () => {
      const mockProject = { 
        id: 'proj1', 
        nombre: 'Inbox',
        userId: mockUserId,
        shares: []
      };
      const mockLabel = { id: 'label1', nombre: 'urgent' };
      
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockProject);
      (mockPrisma.labels.findFirst as jest.Mock).mockResolvedValue(mockLabel);
      (mockPrisma.tasks.create as jest.Mock).mockResolvedValue({ id: 'task1' });

      const action: AIAction = {
        type: 'create_with_subtasks',
        entity: 'task',
        data: {
          titulo: 'Main Task',
          labelNames: ['urgent'],
          subtasks: [
            {
              titulo: 'Subtask',
              labelNames: ['important'],
            },
          ],
        },
        confidence: 0.9,
        explanation: 'Create task with labels',
      };

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('delete_bulk - Enhanced Bulk Deletion', () => {
    it('should delete tasks with date range filter', async () => {
      const action: AIAction = {
        type: 'delete_bulk',
        entity: 'task',
        data: {
          filter: {
            projectName: 'Personal',
            completada: true,
            dateRange: {
              type: 'lastWeek',
            },
          },
        },
        confidence: 0.88,
        explanation: 'Delete completed tasks from last week',
      };

      const mockProject = { id: 'proj1', nombre: 'Personal' };
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockProject);
      (mockPrisma.tasks.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.deleteMany).toHaveBeenCalled();
    });

    it('should delete tasks older than X days', async () => {
      const action: AIAction = {
        type: 'delete_bulk',
        entity: 'task',
        data: {
          filter: {
            completada: true,
            dateRange: {
              type: 'older',
              days: 30,
            },
          },
        },
        confidence: 0.85,
        explanation: 'Delete completed tasks older than 30 days',
      };

      (mockPrisma.tasks.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should delete tasks with label filter', async () => {
      const action: AIAction = {
        type: 'delete_bulk',
        entity: 'task',
        data: {
          filter: {
            labelName: 'temporary',
            completada: true,
          },
        },
        confidence: 0.87,
        explanation: 'Delete completed tasks with temporary label',
      };

      (mockPrisma.tasks.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('move_bulk - Bulk Move Operations', () => {
    it('should move tasks by priority to another project', async () => {
      const action: AIAction = {
        type: 'move_bulk',
        entity: 'task',
        data: {
          filter: {
            prioridad: 1,
          },
          target: {
            projectName: 'Urgent',
          },
        },
        confidence: 0.90,
        explanation: 'Move high priority tasks to Urgent project',
      };

      const mockTargetProject = { 
        id: 'proj2', 
        nombre: 'Urgent',
        userId: mockUserId,
        shares: []
      };
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockTargetProject);
      (mockPrisma.tasks.updateMany as jest.Mock).mockResolvedValue({ count: 8 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.updateMany).toHaveBeenCalled();
    });

    it('should move tasks with label filter', async () => {
      const action: AIAction = {
        type: 'move_bulk',
        entity: 'task',
        data: {
          filter: {
            labelName: 'review',
          },
          target: {
            projectName: 'QA',
            sectionName: 'Testing',
          },
        },
        confidence: 0.88,
        explanation: 'Move review tasks to QA Testing section',
      };

      const mockTargetProject = { 
        id: 'proj3', 
        nombre: 'QA',
        userId: mockUserId,
        shares: []
      };
      const mockSection = { id: 'sec1', nombre: 'Testing' };
      const mockLabel = { id: 'label1', nombre: 'review' };
      
      (mockPrisma.labels.findFirst as jest.Mock).mockResolvedValue(mockLabel);
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockTargetProject);
      (mockPrisma.sections.findFirst as jest.Mock).mockResolvedValue(mockSection);
      (mockPrisma.tasks.updateMany as jest.Mock).mockResolvedValue({ count: 4 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should move completed tasks', async () => {
      const action: AIAction = {
        type: 'move_bulk',
        entity: 'task',
        data: {
          filter: {
            completada: true,
          },
          target: {
            projectName: 'Archive',
          },
        },
        confidence: 0.92,
        explanation: 'Move completed tasks to Archive',
      };

      const mockArchiveProject = { 
        id: 'proj4', 
        nombre: 'Archive',
        userId: mockUserId,
        shares: []
      };
      (mockPrisma.projects.findFirst as jest.Mock).mockResolvedValue(mockArchiveProject);
      (mockPrisma.tasks.updateMany as jest.Mock).mockResolvedValue({ count: 15 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('reorder - Task Reorganization', () => {
    it('should move task to end of list', async () => {
      const action: AIAction = {
        type: 'reorder',
        entity: 'task',
        data: {
          taskTitle: 'Meeting with client',
          position: 'end',
        },
        confidence: 0.88,
        explanation: 'Move task to end of list',
      };

      const mockTask = { id: 'task1', titulo: 'Meeting with client', projectId: 'proj1', sectionId: null, parentTaskId: null };
      const mockMaxOrdenTask = { orden: 5 };
      
      (mockPrisma.tasks.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockMaxOrdenTask);
      (mockPrisma.tasks.update as jest.Mock).mockResolvedValue({ ...mockTask, orden: 6 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orden: 6 }),
        }),
      );
    });

    it('should move task to start of list', async () => {
      const action: AIAction = {
        type: 'reorder',
        entity: 'task',
        data: {
          taskTitle: 'Urgent task',
          position: 'start',
        },
        confidence: 0.90,
        explanation: 'Move task to start of list',
      };

      const mockTask = { id: 'task1', titulo: 'Urgent task' };
      
      (mockPrisma.tasks.findFirst as jest.Mock).mockResolvedValue(mockTask);
      (mockPrisma.tasks.update as jest.Mock).mockResolvedValue({ ...mockTask, orden: -1 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orden: -1 }),
        }),
      );
    });

    it('should move task before another task', async () => {
      const action: AIAction = {
        type: 'reorder',
        entity: 'task',
        data: {
          taskTitle: 'Buy milk',
          position: 'before',
          referenceTaskTitle: 'Take out trash',
        },
        confidence: 0.85,
        explanation: 'Move Buy milk before Take out trash',
      };

      const mockTask = { id: 'task1', titulo: 'Buy milk', projectId: 'proj1', sectionId: null };
      const mockReferenceTask = { id: 'task2', titulo: 'Take out trash', orden: 3, projectId: 'proj1', sectionId: null };
      const mockTaskBefore = { id: 'task0', orden: 2, projectId: 'proj1', sectionId: null };
      
      (mockPrisma.tasks.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockReferenceTask)
        .mockResolvedValueOnce(mockTaskBefore);
      (mockPrisma.tasks.update as jest.Mock).mockResolvedValue({ ...mockTask, orden: 2.5 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orden: 2.5 }),
        }),
      );
    });

    it('should reorder multiple tasks', async () => {
      const action: AIAction = {
        type: 'reorder',
        entity: 'task',
        data: {
          tasks: [
            { taskTitle: 'Buy bread', orden: 0 },
            { taskTitle: 'Take out trash', orden: 1 },
            { taskTitle: 'Do laundry', orden: 2 },
          ],
        },
        confidence: 0.82,
        explanation: 'Reorder multiple tasks',
      };

      (mockPrisma.tasks.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'task1', titulo: 'Buy bread' })
        .mockResolvedValueOnce({ id: 'task2', titulo: 'Take out trash' })
        .mockResolvedValueOnce({ id: 'task3', titulo: 'Do laundry' });
      
      (mockPrisma.tasks.update as jest.Mock)
        .mockResolvedValueOnce({ id: 'task1', orden: 0 })
        .mockResolvedValueOnce({ id: 'task2', orden: 1 })
        .mockResolvedValueOnce({ id: 'task3', orden: 2 });

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.tasks.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const action: AIAction = {
        type: 'create_with_subtasks',
        entity: 'task',
        data: {
          titulo: 'Test Task',
        },
        confidence: 0.9,
        explanation: 'Test error handling',
      };

      (mockPrisma.projects.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const results = await executeAIActions([action], mockUserId, mockPrisma);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('should continue execution after error in one action', async () => {
      const actions: AIAction[] = [
        {
          type: 'create_with_subtasks',
          entity: 'task',
          data: { titulo: 'Task 1' },
          confidence: 0.9,
          explanation: 'First task',
        },
        {
          type: 'delete_bulk',
          entity: 'task',
          data: { filter: { completada: true } },
          confidence: 0.9,
          explanation: 'Delete completed',
        },
      ];

      (mockPrisma.projects.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));
      (mockPrisma.tasks.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const results = await executeAIActions(actions, mockUserId, mockPrisma);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });
});
