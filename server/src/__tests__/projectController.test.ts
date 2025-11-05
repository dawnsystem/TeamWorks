import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as projectController from '../controllers/projectController';
import * as projectDomainService from '../services/projectDomainService';
import * as projectShareService from '../services/projectShareService';
import { projectFactory } from '../factories/projectFactory';
import { sseService } from '../services/sseService';
import prisma from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    projects: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sections: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../services/projectDomainService');
jest.mock('../services/projectShareService');
jest.mock('../services/sseService', () => ({
  sseService: {
    sendTaskEvent: jest.fn(),
  },
}));
jest.mock('../factories/projectFactory');

describe('Project Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockReq = {
      userId: 'user-123',
      params: {},
      body: {},
    };
    
    mockRes = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should get all projects for a user successfully', async () => {
      const mockProjects = [
        { id: 'proj-1', nombre: 'Project 1', color: '#FF0000', userId: 'user-123' },
        { id: 'proj-2', nombre: 'Project 2', color: '#00FF00', userId: 'user-123' },
      ];

      const mockClientProjects = [
        { id: 'proj-1', nombre: 'Project 1', color: '#FF0000' },
        { id: 'proj-2', nombre: 'Project 2', color: '#00FF00' },
      ];

      (projectDomainService.fetchProjects as jest.Mock).mockResolvedValue(mockProjects);
      (projectFactory.toClientProject as jest.Mock)
        .mockReturnValueOnce(mockClientProjects[0])
        .mockReturnValueOnce(mockClientProjects[1]);

      await projectController.getProjects(mockReq as AuthRequest, mockRes as Response);

      expect(projectDomainService.fetchProjects).toHaveBeenCalledWith(prisma, 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith(mockClientProjects);
    });

    it('should handle database errors gracefully', async () => {
      (projectDomainService.fetchProjects as jest.Mock).mockRejectedValue(new Error('Database error'));

      await projectController.getProjects(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error al obtener proyectos' })
      );
    });
  });

  describe('getProject', () => {
    it('should get a single project successfully', async () => {
      mockReq.params = { id: 'proj-1' };
      const mockProject = { id: 'proj-1', nombre: 'Project 1', color: '#FF0000', userId: 'user-123' };
      const mockClientProject = { id: 'proj-1', nombre: 'Project 1', color: '#FF0000' };

      (projectDomainService.fetchProject as jest.Mock).mockResolvedValue(mockProject);
      (projectFactory.toClientProject as jest.Mock).mockReturnValue(mockClientProject);

      await projectController.getProject(mockReq as AuthRequest, mockRes as Response);

      expect(projectDomainService.fetchProject).toHaveBeenCalledWith(prisma, 'proj-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith(mockClientProject);
    });

    it('should return 404 if project not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (projectDomainService.fetchProject as jest.Mock).mockResolvedValue(null);

      await projectController.getProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Proyecto no encontrado' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'proj-1' };
      (projectDomainService.fetchProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      await projectController.getProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al obtener proyecto' });
    });
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      mockReq.body = { nombre: 'New Project', color: '#0000FF', orden: 1 };
      const mockProject = { id: 'proj-new', nombre: 'New Project', color: '#0000FF', userId: 'user-123' };
      const mockClientProject = { id: 'proj-new', nombre: 'New Project', color: '#0000FF' };

      (projectDomainService.createProject as jest.Mock).mockResolvedValue(mockProject);
      (projectFactory.toClientProject as jest.Mock).mockReturnValue(mockClientProject);

      await projectController.createProject(mockReq as AuthRequest, mockRes as Response);

      expect(projectDomainService.createProject).toHaveBeenCalledWith(prisma, {
        nombre: 'New Project',
        color: '#0000FF',
        orden: 1,
        userId: 'user-123',
      });
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith({
        type: 'project_created',
        projectId: 'proj-new',
        userId: 'user-123',
        timestamp: expect.any(Date),
        data: mockClientProject,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockClientProject);
    });

    it('should handle database errors gracefully', async () => {
      mockReq.body = { nombre: 'New Project', color: '#0000FF' };
      (projectDomainService.createProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      await projectController.createProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al crear proyecto' });
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      mockReq.params = { id: 'proj-1' };
      mockReq.body = { nombre: 'Updated Project', color: '#FF00FF' };
      const mockProject = { id: 'proj-1', nombre: 'Updated Project', color: '#FF00FF', userId: 'user-123' };
      const mockClientProject = { id: 'proj-1', nombre: 'Updated Project', color: '#FF00FF' };

      (projectDomainService.updateProject as jest.Mock).mockResolvedValue(mockProject);
      (projectFactory.toClientProject as jest.Mock).mockReturnValue(mockClientProject);

      await projectController.updateProject(mockReq as AuthRequest, mockRes as Response);

      expect(projectDomainService.updateProject).toHaveBeenCalledWith(prisma, 'proj-1', 'user-123', {
        nombre: 'Updated Project',
        color: '#FF00FF',
        orden: undefined,
      });
      expect(sseService.sendTaskEvent).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockClientProject);
    });

    it('should return 404 if project not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { nombre: 'Updated' };
      (projectDomainService.updateProject as jest.Mock).mockResolvedValue(null);

      await projectController.updateProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Proyecto no encontrado' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'proj-1' };
      mockReq.body = { nombre: 'Updated' };
      (projectDomainService.updateProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      await projectController.updateProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al actualizar proyecto' });
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      mockReq.params = { id: 'proj-1' };
      const mockProject = { id: 'proj-1', nombre: 'Project 1', userId: 'user-123' };

      (projectDomainService.deleteProject as jest.Mock).mockResolvedValue(mockProject);

      await projectController.deleteProject(mockReq as AuthRequest, mockRes as Response);

      expect(projectDomainService.deleteProject).toHaveBeenCalledWith(prisma, 'proj-1', 'user-123');
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith({
        type: 'project_deleted',
        projectId: 'proj-1',
        userId: 'user-123',
        timestamp: expect.any(Date),
        data: { id: 'proj-1' },
      });
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should return 404 if project not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (projectDomainService.deleteProject as jest.Mock).mockResolvedValue(null);

      await projectController.deleteProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Proyecto no encontrado' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'proj-1' };
      (projectDomainService.deleteProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      await projectController.deleteProject(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al eliminar proyecto' });
    });
  });
});
