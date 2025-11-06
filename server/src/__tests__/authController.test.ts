import { register, login, getMe } from '../controllers/authController';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    projects: {
      create: jest.fn(),
    },
  },
}));

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req: any = {
        body: {
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.projects.create as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await register(req, res);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.users.create).toHaveBeenCalled();
      expect(prisma.projects.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-token',
          user: expect.objectContaining({
            id: 'user-1',
            nombre: 'Test User',
            email: 'test@example.com',
          }),
        }),
      );
    });

    it('should return 400 if email already exists', async () => {
      const req: any = {
        body: {
          nombre: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'El email ya está registrado',
        }),
      );
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        body: {
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const req: any = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await login(req, res);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          nombre: true,
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-token',
          user: expect.objectContaining({
            id: 'user-1',
            email: 'test@example.com',
          }),
        }),
      );
    });

    it('should return 401 with invalid email', async () => {
      const req: any = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas',
        }),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid password', async () => {
      const req: any = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas',
        }),
      );
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMe', () => {
    it('should return user info for authenticated user', async () => {
      const req: any = {
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await getMe(req, res);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          nombre: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          nombre: 'Test User',
          email: 'test@example.com',
        }),
      );
    });

    it('should return 404 if user not found', async () => {
      const req: any = {
        userId: 'nonexistent-user',
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario no encontrado',
        }),
      );
    });

    it('should handle undefined userId gracefully', async () => {
      const req: any = {
        // missing userId - undefined
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await getMe(req, res);

      // When userId is undefined, findUnique returns null, so 404
      expect(res.status).toHaveBeenCalledWith(404);
      expect(prisma.users.findUnique).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const req: any = {
        userId: 'user-1',
      };
      const res = mockResponse();

      (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
