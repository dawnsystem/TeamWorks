import type { PrismaClient } from '@prisma/client';

type ShareRole = 'viewer' | 'editor' | 'manager';
export type ProjectPermission = ShareRole | 'owner';

const rolePriority: Record<ProjectPermission, number> = {
  viewer: 1,
  editor: 2,
  manager: 3,
  owner: 4,
};

const requiredPriority: Record<'read' | 'write' | 'manage', number> = {
  read: rolePriority.viewer,
  write: rolePriority.editor,
  manage: rolePriority.manager,
};

const resolveProjectRole = (project: { userId: string; shares: { role: ShareRole; sharedWithId: string }[] }, userId: string): ProjectPermission | null => {
  if (project.userId === userId) return 'owner';
  const share = project.shares.find((s) => s.sharedWithId === userId);
  return share ? share.role : null;
};

export const assertProjectPermission = async (
  prisma: PrismaClient,
  projectId: string,
  userId: string,
  permission: 'read' | 'write' | 'manage',
): Promise<ProjectPermission> => {
  const project = await prisma.projects.findFirst({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      shares: {
        select: {
          sharedWithId: true,
          role: true,
        },
      },
    },
  });

  if (!project) {
    throw Object.assign(new Error('Proyecto no encontrado'), { status: 404 });
  }

  const role = resolveProjectRole(project, userId);
  if (!role) {
    throw Object.assign(new Error('No tienes acceso a este proyecto'), { status: 403 });
  }

  if (rolePriority[role] < requiredPriority[permission]) {
    throw Object.assign(new Error('Permisos insuficientes para esta acción'), { status: 403 });
  }

  return role;
};

export const getProjectRole = async (
  prisma: PrismaClient,
  projectId: string,
  userId: string,
): Promise<ProjectPermission | null> => {
  const project = await prisma.projects.findFirst({
    where: { id: projectId },
    select: {
      userId: true,
      shares: {
        select: {
          sharedWithId: true,
          role: true,
        },
      },
    },
  });

  if (!project) return null;
  return resolveProjectRole(project, userId);
};

export const listProjectShares = (prisma: PrismaClient, projectId: string) =>
  prisma.project_shares.findMany({
    where: { projectId },
    select: {
      id: true,
      sharedWithId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      sharedWith: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

export const shareProject = (
  prisma: PrismaClient,
  projectId: string,
  ownerId: string,
  sharedWithId: string,
  role: ShareRole,
) =>
  prisma.project_shares.upsert({
    where: {
      projectId_sharedWithId: { projectId, sharedWithId },
    },
    update: { role },
    create: { projectId, ownerId, sharedWithId, role },
  });

export const revokeProjectShare = (
  prisma: PrismaClient,
  projectId: string,
  sharedWithId: string,
) =>
  prisma.project_shares.deleteMany({ where: { projectId, sharedWithId } });


