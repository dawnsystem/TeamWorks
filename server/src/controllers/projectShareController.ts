import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import {
  assertProjectPermission,
  listProjectShares,
  revokeProjectShare,
  shareProject,
  getProjectRole,
} from '../services/projectShareService';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const getShares = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    await assertProjectPermission(prisma, projectId, (req as AuthRequest).userId!, 'manage');

    const shares = await listProjectShares(prisma, projectId);

    res.json(shares);
  } catch (error: any) {
    console.error('Error en getShares:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al obtener colaboradores' });
  }
};

export const upsertShare = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const userId = (req as AuthRequest).userId!;

    await assertProjectPermission(prisma, projectId, userId, 'manage');

    const target = await prisma.users.findUnique({ where: { email } });
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (target.id === userId) {
      return res.status(400).json({ error: 'Ya eres propietario del proyecto' });
    }

    await shareProject(prisma, projectId, userId, target.id, role);

    const shares = await listProjectShares(prisma, projectId);

    const project = await prisma.projects.findUnique({ where: { id: projectId }, select: { nombre: true } });

    const now = new Date();
    sseService.sendTaskEvent({
      type: 'project_shared',
      projectId,
      userId,
      timestamp: now,
      data: shares,
    });

    sseService.sendTaskEvent({
      type: 'project_shared',
      projectId,
      userId: target.id,
      timestamp: now,
      data: { projectId, shares },
    });

    await notificationService.create({
      userId: target.id,
      type: 'project_shared',
      title: '📂 Nuevo proyecto compartido',
      message: `Has sido invitado a "${project?.nombre ?? 'Proyecto'}"`,
      projectId,
    });

    res.json(shares);
  } catch (error: any) {
    console.error('Error en upsertShare:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al compartir proyecto' });
  }
};

export const removeShare = async (req: any, res: Response) => {
  try {
    const { projectId, shareId } = req.params;
    const userId = (req as AuthRequest).userId!;

    await assertProjectPermission(prisma, projectId, userId, 'manage');

    const share = await prisma.project_shares.findUnique({ where: { id: shareId } });
    if (!share || share.projectId !== projectId) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    await revokeProjectShare(prisma, projectId, share.sharedWithId);

    const shares = await listProjectShares(prisma, projectId);

    const now = new Date();
    sseService.sendTaskEvent({
      type: 'project_unshared',
      projectId,
      userId,
      timestamp: now,
      data: shares,
    });

    sseService.sendTaskEvent({
      type: 'project_unshared',
      projectId,
      userId: share.sharedWithId,
      timestamp: now,
      data: { projectId },
    });

    await notificationService.create({
      userId: share.sharedWithId,
      type: 'project_unshared',
      title: '🔒 Acceso revocado',
      message: 'Ya no tienes acceso a este proyecto.',
      projectId,
    });

    res.json(shares);
  } catch (error: any) {
    console.error('Error en removeShare:', error);
    res.status(error?.status || 500).json({ error: error?.message || 'Error al revocar acceso' });
  }
};

export const getProjectAccessInfo = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as AuthRequest).userId!;
    const role = await getProjectRole(prisma, projectId, userId);

    if (!role) {
      return res.status(404).json({ error: 'No tienes acceso a este proyecto' });
    }

    res.json({ role });
  } catch (error: any) {
    console.error('Error en getProjectAccessInfo:', error);
    res.status(500).json({ error: 'Error al obtener rol de proyecto' });
  }
};


