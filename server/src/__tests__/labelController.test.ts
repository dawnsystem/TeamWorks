import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as labelController from '../controllers/labelController';
import * as labelDomainService from '../services/labelDomainService';
import { labelFactory } from '../factories/labelFactory';
import { sseService } from '../services/sseService';
import prisma from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    labels: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../services/labelDomainService');
jest.mock('../services/sseService', () => ({
  sseService: {
    sendTaskEvent: jest.fn(),
  },
}));
jest.mock('../factories/labelFactory');

describe('Label Controller', () => {
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

  describe('getLabels', () => {
    it('should get all labels for a user successfully', async () => {
      const mockLabels = [
        { id: 'label-1', nombre: 'Bug', color: '#FF0000', userId: 'user-123' },
        { id: 'label-2', nombre: 'Feature', color: '#00FF00', userId: 'user-123' },
      ];

      const mockClientLabels = [
        { id: 'label-1', nombre: 'Bug', color: '#FF0000' },
        { id: 'label-2', nombre: 'Feature', color: '#00FF00' },
      ];

      (labelDomainService.fetchLabels as jest.Mock).mockResolvedValue(mockLabels);
      (labelFactory.toClientLabel as jest.Mock)
        .mockReturnValueOnce(mockClientLabels[0])
        .mockReturnValueOnce(mockClientLabels[1]);

      await labelController.getLabels(mockReq as AuthRequest, mockRes as Response);

      expect(labelDomainService.fetchLabels).toHaveBeenCalledWith(prisma, 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith(mockClientLabels);
    });

    it('should handle database errors gracefully', async () => {
      (labelDomainService.fetchLabels as jest.Mock).mockRejectedValue(new Error('Database error'));

      await labelController.getLabels(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al obtener etiquetas' });
    });
  });

  describe('getLabel', () => {
    it('should get a single label successfully', async () => {
      mockReq.params = { id: 'label-1' };
      const mockLabel = { id: 'label-1', nombre: 'Bug', color: '#FF0000', userId: 'user-123' };
      const mockClientLabel = { id: 'label-1', nombre: 'Bug', color: '#FF0000' };

      (labelDomainService.fetchLabel as jest.Mock).mockResolvedValue(mockLabel);
      (labelFactory.toClientLabel as jest.Mock).mockReturnValue(mockClientLabel);

      await labelController.getLabel(mockReq as AuthRequest, mockRes as Response);

      expect(labelDomainService.fetchLabel).toHaveBeenCalledWith(prisma, 'label-1', 'user-123');
      expect(mockRes.json).toHaveBeenCalledWith(mockClientLabel);
    });

    it('should return 404 if label not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (labelDomainService.fetchLabel as jest.Mock).mockResolvedValue(null);

      await labelController.getLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Etiqueta no encontrada' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'label-1' };
      (labelDomainService.fetchLabel as jest.Mock).mockRejectedValue(new Error('Database error'));

      await labelController.getLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al obtener etiqueta' });
    });
  });

  describe('createLabel', () => {
    it('should create a label successfully', async () => {
      mockReq.body = { nombre: 'Critical', color: '#FF0000' };
      const mockLabel = { id: 'label-new', nombre: 'Critical', color: '#FF0000', userId: 'user-123' };
      const mockClientLabel = { id: 'label-new', nombre: 'Critical', color: '#FF0000' };

      (labelDomainService.createLabel as jest.Mock).mockResolvedValue(mockLabel);
      (labelFactory.toClientLabel as jest.Mock).mockReturnValue(mockClientLabel);

      await labelController.createLabel(mockReq as AuthRequest, mockRes as Response);

      expect(labelDomainService.createLabel).toHaveBeenCalledWith(prisma, {
        nombre: 'Critical',
        color: '#FF0000',
        userId: 'user-123',
      });
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith({
        type: 'label_created',
        projectId: 'global',
        labelId: 'label-new',
        userId: 'user-123',
        timestamp: expect.any(Date),
        data: mockClientLabel,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockClientLabel);
    });

    it('should handle database errors gracefully', async () => {
      mockReq.body = { nombre: 'Critical', color: '#FF0000' };
      (labelDomainService.createLabel as jest.Mock).mockRejectedValue(new Error('Database error'));

      await labelController.createLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al crear etiqueta' });
    });
  });

  describe('updateLabel', () => {
    it('should update a label successfully', async () => {
      mockReq.params = { id: 'label-1' };
      mockReq.body = { nombre: 'Updated Bug', color: '#FF00FF' };
      const mockLabel = { id: 'label-1', nombre: 'Updated Bug', color: '#FF00FF', userId: 'user-123' };
      const mockClientLabel = { id: 'label-1', nombre: 'Updated Bug', color: '#FF00FF' };

      (labelDomainService.updateLabel as jest.Mock).mockResolvedValue(mockLabel);
      (labelFactory.toClientLabel as jest.Mock).mockReturnValue(mockClientLabel);

      await labelController.updateLabel(mockReq as AuthRequest, mockRes as Response);

      expect(labelDomainService.updateLabel).toHaveBeenCalledWith(prisma, 'label-1', 'user-123', {
        nombre: 'Updated Bug',
        color: '#FF00FF',
      });
      expect(sseService.sendTaskEvent).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockClientLabel);
    });

    it('should return 404 if label not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { nombre: 'Updated' };
      (labelDomainService.updateLabel as jest.Mock).mockResolvedValue(null);

      await labelController.updateLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Etiqueta no encontrada' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'label-1' };
      mockReq.body = { nombre: 'Updated' };
      (labelDomainService.updateLabel as jest.Mock).mockRejectedValue(new Error('Database error'));

      await labelController.updateLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al actualizar etiqueta' });
    });
  });

  describe('deleteLabel', () => {
    it('should delete a label successfully', async () => {
      mockReq.params = { id: 'label-1' };
      const mockLabel = { id: 'label-1', nombre: 'Bug', userId: 'user-123' };

      (labelDomainService.deleteLabel as jest.Mock).mockResolvedValue(mockLabel);

      await labelController.deleteLabel(mockReq as AuthRequest, mockRes as Response);

      expect(labelDomainService.deleteLabel).toHaveBeenCalledWith(prisma, 'label-1', 'user-123');
      expect(sseService.sendTaskEvent).toHaveBeenCalledWith({
        type: 'label_deleted',
        projectId: 'global',
        labelId: 'label-1',
        userId: 'user-123',
        timestamp: expect.any(Date),
        data: { id: 'label-1' },
      });
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should return 404 if label not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      (labelDomainService.deleteLabel as jest.Mock).mockResolvedValue(null);

      await labelController.deleteLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Etiqueta no encontrada' });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.params = { id: 'label-1' };
      (labelDomainService.deleteLabel as jest.Mock).mockRejectedValue(new Error('Database error'));

      await labelController.deleteLabel(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al eliminar etiqueta' });
    });
  });
});
