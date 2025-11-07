import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { MissingEnvVarError, requireEnvVar } from '../lib/env';
import prisma from '../lib/prisma';
import * as refreshTokenService from '../services/refreshTokenService';

/**
 * Genera un access token JWT de corta duración
 */
function generateAccessToken(userId: string): string {
  const secret: Secret = requireEnvVar('JWT_SECRET');
  // Access token de corta duración (15 minutos por defecto)
  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
  return jwt.sign({ userId }, secret, { expiresIn: expiresIn as any });
}

/**
 * Extrae información del dispositivo y IP de la request
 */
function getClientInfo(req: Request) {
  const deviceInfo = req.headers['user-agent'] || 'Unknown device';
  const ipAddress = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'Unknown IP';
  return { deviceInfo, ipAddress };
}

export const register = async (req: any, res: Response) => {
  try {
    const { email, password, nombre } = req.body;

    // Validación de formato ya realizada por middleware
    // Verificar si el usuario ya existe
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Crear proyecto inbox por defecto
    await prisma.projects.create({
      data: {
        nombre: 'Inbox',
        color: '#808080',
        orden: 0,
        userId: user.id,
      },
    });

    // Generar access token y refresh token
    const { deviceInfo, ipAddress } = getClientInfo(req);
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await refreshTokenService.createRefreshToken(
      user.id,
      deviceInfo,
      ipAddress
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof MissingEnvVarError) {
      console.error('Configuración inválida:', error.message);
      return res.status(500).json({ error: 'Configuración del servidor inválida: falta JWT_SECRET' });
    }
    console.error('Error en register:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Devolver más detalles en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error al registrar usuario: ${error?.message || 'Error desconocido'}`
      : 'Error al registrar usuario';
    
    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error?.message }),
    });
  }
};

export const login = async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validación de formato ya realizada por middleware
    // Buscar usuario
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nombre: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar access token y refresh token
    const { deviceInfo, ipAddress } = getClientInfo(req);
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await refreshTokenService.createRefreshToken(
      user.id,
      deviceInfo,
      ipAddress
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof MissingEnvVarError) {
      console.error('Configuración inválida:', error.message);
      return res.status(500).json({ error: 'Configuración del servidor inválida: falta JWT_SECRET' });
    }
    console.error('Error en login:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Devolver más detalles en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error al iniciar sesión: ${error?.message || 'Error desconocido'}`
      : 'Error al iniciar sesión';
    
    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error?.message }),
    });
  }
};

export const getMe = async (req: any & { userId?: string }, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: (req as AuthRequest).userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

/**
 * Renueva el access token usando un refresh token válido
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token no proporcionado' });
    }

    const { deviceInfo, ipAddress } = getClientInfo(req);
    const result = await refreshTokenService.validateAndRotate(
      refreshToken,
      deviceInfo,
      ipAddress
    );

    if (!result) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    const { userId, newRefreshToken } = result;
    const accessToken = generateAccessToken(userId);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(500).json({ error: 'Error al renovar token' });
  }
};

/**
 * Cierra sesión revocando el refresh token
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token no proporcionado' });
    }

    const revoked = await refreshTokenService.revokeToken(refreshToken);

    if (!revoked) {
      return res.status(404).json({ error: 'Refresh token no encontrado' });
    }

    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

/**
 * Cierra todas las sesiones del usuario
 */
export const logoutAll = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const count = await refreshTokenService.revokeAllUserTokens(userId);

    res.json({ 
      message: 'Todas las sesiones cerradas exitosamente',
      sessionsRevoked: count
    });
  } catch (error) {
    console.error('Error en logoutAll:', error);
    res.status(500).json({ error: 'Error al cerrar todas las sesiones' });
  }
};

/**
 * Obtiene las sesiones activas del usuario
 */
export const getSessions = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const sessions = await refreshTokenService.getUserActiveTokens(userId);

    res.json({ sessions });
  } catch (error) {
    console.error('Error en getSessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
};

/**
 * Revoca una sesión específica por su ID
 */
export const revokeSession = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'ID de sesión no proporcionado' });
    }

    const revoked = await refreshTokenService.revokeSessionById(userId, sessionId);

    if (!revoked) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    res.json({ message: 'Sesión revocada exitosamente' });
  } catch (error) {
    console.error('Error en revokeSession:', error);
    res.status(500).json({ error: 'Error al revocar sesión' });
  }
};

