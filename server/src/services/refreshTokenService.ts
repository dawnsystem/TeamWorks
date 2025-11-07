import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

/**
 * Servicio para gestionar refresh tokens
 * Implementa creación, validación, rotación y revocación de tokens
 */

interface RefreshTokenInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * Genera un refresh token seguro
 */
function generateSecureToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Calcula hash del token para almacenamiento seguro
 */
async function hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10);
}

/**
 * Verifica un token contra su hash
 */
async function verifyToken(token: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(token, hash);
}

/**
 * Crea un nuevo refresh token para un usuario
 * @param userId ID del usuario
 * @param deviceInfo Información del dispositivo (User-Agent)
 * @param ipAddress Dirección IP del cliente
 * @returns El refresh token en texto plano (solo se devuelve aquí)
 */
export async function createRefreshToken(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  
  // Expiración configurable, por defecto 7 días
  const expiresInDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await prisma.refresh_tokens.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
      deviceInfo,
      ipAddress,
    },
  });

  return token; // Devolver el token en texto plano solo aquí
}

/**
 * Valida un refresh token y lo rota (genera uno nuevo)
 * @param token El refresh token a validar
 * @param deviceInfo Información del dispositivo actual
 * @param ipAddress Dirección IP actual
 * @returns Objeto con userId y nuevo refresh token, o null si inválido
 */
export async function validateAndRotate(
  token: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ userId: string; newRefreshToken: string } | null> {
  // Buscar todos los refresh tokens no revocados y no expirados
  const allTokens = await prisma.refresh_tokens.findMany({
    where: {
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userId: true,
      token: true,
      expiresAt: true,
    },
  });

  // Buscar el token que coincida
  let matchedToken = null;
  for (const storedToken of allTokens) {
    const isValid = await verifyToken(token, storedToken.token);
    if (isValid) {
      matchedToken = storedToken;
      break;
    }
  }

  if (!matchedToken) {
    return null;
  }

  const userId = matchedToken.userId;

  // Actualizar última vez usado y revocar el token antiguo
  await prisma.refresh_tokens.update({
    where: { id: matchedToken.id },
    data: {
      lastUsedAt: new Date(),
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  // Generar nuevo refresh token
  const newRefreshToken = await createRefreshToken(userId, deviceInfo, ipAddress);

  return { userId, newRefreshToken };
}

/**
 * Revoca un refresh token específico
 * @param token El refresh token a revocar
 * @returns true si se revocó exitosamente, false si no se encontró
 */
export async function revokeToken(token: string): Promise<boolean> {
  // Buscar todos los tokens no revocados
  const allTokens = await prisma.refresh_tokens.findMany({
    where: {
      isRevoked: false,
    },
    select: {
      id: true,
      token: true,
    },
  });

  // Buscar el token que coincida
  let matchedToken = null;
  for (const storedToken of allTokens) {
    const isValid = await verifyToken(token, storedToken.token);
    if (isValid) {
      matchedToken = storedToken;
      break;
    }
  }

  if (!matchedToken) {
    return false;
  }

  await prisma.refresh_tokens.update({
    where: { id: matchedToken.id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  return true;
}

/**
 * Revoca todos los refresh tokens de un usuario
 * @param userId ID del usuario
 * @returns Número de tokens revocados
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refresh_tokens.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Limpia tokens expirados y revocados antiguos (para cron job)
 * @param olderThanDays Eliminar tokens revocados más antiguos que X días (por defecto 30)
 * @returns Número de tokens eliminados
 */
export async function cleanExpiredTokens(olderThanDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [
        // Tokens expirados
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        // Tokens revocados hace más de X días
        {
          isRevoked: true,
          revokedAt: {
            lt: cutoffDate,
          },
        },
      ],
    },
  });

  return result.count;
}

/**
 * Obtiene los tokens activos de un usuario (para mostrar sesiones)
 * @param userId ID del usuario
 * @returns Lista de información de tokens activos
 */
export async function getUserActiveTokens(userId: string): Promise<RefreshTokenInfo[]> {
  const tokens = await prisma.refresh_tokens.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: {
      lastUsedAt: 'desc',
    },
  });

  return tokens;
}

/**
 * Revoca una sesión específica por su ID
 * @param userId ID del usuario (para verificar pertenencia)
 * @param tokenId ID del token a revocar
 * @returns true si se revocó, false si no se encontró o no pertenece al usuario
 */
export async function revokeSessionById(userId: string, tokenId: string): Promise<boolean> {
  const token = await prisma.refresh_tokens.findFirst({
    where: {
      id: tokenId,
      userId,
      isRevoked: false,
    },
  });

  if (!token) {
    return false;
  }

  await prisma.refresh_tokens.update({
    where: { id: tokenId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  return true;
}
