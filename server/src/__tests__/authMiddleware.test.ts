import { authMiddleware } from '../middleware/auth';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

const mockRequest = (token?: string, queryToken?: string) => {
  const req: any = {
    headers: {},
    query: {},
  };
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  if (queryToken) {
    req.query.token = queryToken;
  }
  return req;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should authenticate user with valid token in header', () => {
    const req = mockRequest('valid-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-1' });

    authMiddleware(req, res, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.userId).toBe('user-1');
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should authenticate user with valid token in query params (SSE)', () => {
    const req = mockRequest(undefined, 'query-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-2' });

    authMiddleware(req, res, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('query-token', 'test-secret');
    expect(req.userId).toBe('user-2');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should prefer header token over query token', () => {
    const req = mockRequest('header-token', 'query-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-3' });

    authMiddleware(req, res, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('header-token', 'test-secret');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if no token provided', () => {
    const req = mockRequest();
    const res = mockResponse();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token no proporcionado',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    const req = mockRequest('invalid-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token inválido o expirado',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', () => {
    const req = mockRequest('expired-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token inválido o expirado',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 if JWT_SECRET is missing', () => {
    const req = mockRequest('token');
    const res = mockResponse();

    delete process.env.JWT_SECRET;

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('JWT_SECRET'),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle malformed Bearer token', () => {
    const req: any = {
      headers: {
        authorization: 'InvalidFormat token',
      },
      query: {},
    };
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token inválido o expirado',
    });
  });

  it('should extract userId from token payload', () => {
    const req = mockRequest('valid-token');
    const res = mockResponse();

    (jwt.verify as jest.Mock).mockReturnValue({ 
      userId: 'user-123',
      iat: 1234567890,
      exp: 1234567890,
    });

    authMiddleware(req, res, mockNext);

    expect(req.userId).toBe('user-123');
    expect(mockNext).toHaveBeenCalled();
  });
});
