import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { validateBody, validateQuery, validateParams, idParamSchema, taskIdParamSchema, projectIdParamSchema, labelIdParamSchema } from '../middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBody', () => {
    it('should pass validation with valid data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: 'John', age: 30 };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors for invalid data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockRequest.body = { name: 'John', age: 'invalid' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should return 400 for missing required fields', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      mockRequest.body = { name: 'John' }; // Missing email

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle multiple validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
        email: z.string().email(),
      });

      mockRequest.body = { name: 'Jo', age: 15, email: 'invalid-email' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Errores de validación',
        details: expect.any(Array),
      });
      
      const details = jsonMock.mock.calls[0][0].details;
      expect(details.length).toBeGreaterThan(1);
    });

    it('should transform and validate data', async () => {
      const schema = z.object({
        name: z.string().transform(val => val.toUpperCase()),
        age: z.string().transform(val => parseInt(val, 10)),
      });

      mockRequest.body = { name: 'john', age: '30' };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.body).toEqual({ name: 'JOHN', age: 30 });
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query params', async () => {
      const schema = z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      });

      mockRequest.query = { page: '1', limit: '10' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors for invalid query params', async () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number'),
      });

      mockRequest.query = { page: 'invalid' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Errores de validación en query params',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle optional query params', async () => {
      const schema = z.object({
        search: z.string().optional(),
        filter: z.string().optional(),
      });

      mockRequest.query = {}; // No query params

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should transform query params', async () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val, 10)),
        limit: z.string().transform(val => parseInt(val, 10)),
      });

      mockRequest.query = { page: '2', limit: '20' };

      const middleware = validateQuery(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRequest.query).toEqual({ page: 2, limit: 20 });
    });
  });

  describe('validateParams', () => {
    it('should pass validation with valid URL params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors for invalid URL params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockRequest.params = { id: 'invalid-uuid' };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Parámetros de URL inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should validate multiple URL params', async () => {
      const schema = z.object({
        projectId: z.string().uuid(),
        taskId: z.string().uuid(),
      });

      mockRequest.params = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '987e6543-e21b-98d7-a654-426614174111',
      };

      const middleware = validateParams(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Common param schemas', () => {
    it('should validate idParamSchema with valid UUID', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(idParamSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should reject idParamSchema with invalid UUID', async () => {
      mockRequest.params = { id: 'not-a-uuid' };

      const middleware = validateParams(idParamSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Parámetros de URL inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: 'ID inválido',
          }),
        ]),
      });
    });

    it('should validate taskIdParamSchema with valid UUID', async () => {
      mockRequest.params = { taskId: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(taskIdParamSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should validate projectIdParamSchema with valid UUID', async () => {
      mockRequest.params = { projectId: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(projectIdParamSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should validate labelIdParamSchema with valid UUID', async () => {
      mockRequest.params = { labelId: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(labelIdParamSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle nested validation errors', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      mockRequest.body = { user: { name: 'John', email: 'invalid' } };

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Errores de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'user.email',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle array validation errors', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(2)),
      });

      mockRequest.body = { tags: ['ok', 'a'] }; // Second tag too short

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should handle empty body gracefully', async () => {
      const schema = z.object({
        name: z.string().optional(),
      });

      mockRequest.body = {};

      const middleware = validateBody(schema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
