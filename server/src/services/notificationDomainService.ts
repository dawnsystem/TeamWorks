import { PrismaClient } from '@prisma/client';

const baseNotificationInclude = {
  tasks: {
    select: {
      id: true,
      titulo: true,
      projectId: true,
    },
  },
  comments: {
    select: {
      id: true,
      contenido: true,
    },
  },
  projects: {
    select: {
      id: true,
      nombre: true,
    },
  },
};

export async function fetchNotifications(
  prisma: PrismaClient,
  userId: string,
  filters: {
    read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const where: any = { userId };

  if (filters.read !== undefined) {
    where.read = filters.read;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.notifications.findMany({
    where,
    include: baseNotificationInclude,
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

export async function countUnreadNotifications(prisma: PrismaClient, userId: string) {
  return prisma.notifications.count({
    where: { userId, read: false },
  });
}

export async function markNotificationAsRead(prisma: PrismaClient, id: string, userId: string) {
  return prisma.notifications.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead(prisma: PrismaClient, userId: string) {
  return prisma.notifications.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(prisma: PrismaClient, id: string, userId: string) {
  return prisma.notifications.deleteMany({
    where: { id, userId },
  });
}


