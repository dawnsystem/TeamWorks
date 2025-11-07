/**
 * Tests para los nuevos tipos definidos en types/
 */

import {
  AIAction,
  ParsedAction,
  UserContext,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateProjectPayload,
  AuthenticatedRequest,
} from '../types';

describe('Type definitions', () => {
  describe('AIAction', () => {
    it('should allow valid AIAction objects', () => {
      const action: AIAction = {
        type: 'create',
        entity: 'task',
        data: { titulo: 'Test Task' },
        confidence: 0.95,
        explanation: 'Create a new task',
      };

      expect(action).toBeDefined();
      expect(action.type).toBe('create');
      expect(action.entity).toBe('task');
      expect(action.confidence).toBe(0.95);
    });

    it('should allow AIAction without optional fields', () => {
      const action: AIAction = {
        type: 'query',
        entity: 'task',
        confidence: 0.8,
        explanation: 'Query tasks',
      };

      expect(action).toBeDefined();
      expect(action.data).toBeUndefined();
      expect(action.query).toBeUndefined();
    });
  });

  describe('ParsedAction', () => {
    it('should allow valid ParsedAction objects', () => {
      const parsedAction: ParsedAction = {
        actions: [
          {
            type: 'create',
            entity: 'task',
            confidence: 0.9,
            explanation: 'Create task',
          },
        ],
        parsingConfidence: 0.95,
        method: 'json_parse',
      };

      expect(parsedAction).toBeDefined();
      expect(parsedAction.actions).toHaveLength(1);
      expect(parsedAction.parsingConfidence).toBe(0.95);
      expect(parsedAction.method).toBe('json_parse');
    });
  });

  describe('UserContext', () => {
    it('should allow valid UserContext objects', () => {
      const context: UserContext = {
        projects: [
          { id: '1', nombre: 'Project 1', color: '#ff0000' },
          { id: '2', nombre: 'Project 2' },
        ],
        recentTasks: [
          { id: '1', titulo: 'Task 1', prioridad: 1 },
          { id: '2', titulo: 'Task 2', prioridad: null },
        ],
      };

      expect(context).toBeDefined();
      expect(context.projects).toHaveLength(2);
      expect(context.recentTasks).toHaveLength(2);
    });
  });

  describe('CreateTaskPayload', () => {
    it('should allow valid CreateTaskPayload objects', () => {
      const payload: CreateTaskPayload = {
        titulo: 'New Task',
        descripcion: 'Task description',
        prioridad: 1,
        projectId: 'project-123',
      };

      expect(payload).toBeDefined();
      expect(payload.titulo).toBe('New Task');
      expect(payload.projectId).toBe('project-123');
    });

    it('should allow CreateTaskPayload with optional fields', () => {
      const payload: CreateTaskPayload = {
        titulo: 'Minimal Task',
        projectId: 'project-123',
      };

      expect(payload).toBeDefined();
      expect(payload.descripcion).toBeUndefined();
      expect(payload.prioridad).toBeUndefined();
    });
  });

  describe('UpdateTaskPayload', () => {
    it('should allow partial updates', () => {
      const payload: UpdateTaskPayload = {
        titulo: 'Updated Title',
      };

      expect(payload).toBeDefined();
      expect(payload.titulo).toBe('Updated Title');
      expect(payload.descripcion).toBeUndefined();
    });

    it('should allow all fields to be optional', () => {
      const payload: UpdateTaskPayload = {};

      expect(payload).toBeDefined();
      expect(Object.keys(payload)).toHaveLength(0);
    });
  });

  describe('CreateProjectPayload', () => {
    it('should allow valid CreateProjectPayload objects', () => {
      const payload: CreateProjectPayload = {
        nombre: 'New Project',
        descripcion: 'Project description',
        color: '#00ff00',
      };

      expect(payload).toBeDefined();
      expect(payload.nombre).toBe('New Project');
      expect(payload.color).toBe('#00ff00');
    });
  });

  describe('AuthenticatedRequest', () => {
    it('should extend Express Request with userId', () => {
      // Este test es más conceptual - verifica que el tipo compile correctamente
      const mockReq: Partial<AuthenticatedRequest> = {
        userId: 'user-123',
        body: {},
        headers: {},
      };

      expect(mockReq.userId).toBe('user-123');
    });
  });
});
