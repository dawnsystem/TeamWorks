import { PrismaClient } from '@prisma/client';

const baseCommentInclude = {
  users: {
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  },
  tasks: {
    select: {
      id: true,
      titulo: true,
      projectId: true,
      projects: {
        select: {
          id: true,
          userId: true,
          nombre: true,
        },
      },
    },
  },
};

export async function fetchCommentsByTask(prisma: PrismaClient, taskId: string, userId: string) {
  const task = await prisma.tasks.findFirst({
    where: {
      id: taskId,
      projects: { userId },
    },
  });

  if (!task) {
    return null;
  }

  return prisma.comments.findMany({
    where: {
      taskId,
      tasks: {
        projects: { userId },
      },
    },
    include: baseCommentInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(
  prisma: PrismaClient,
  {
    taskId,
    userId,
    contenido,
  }: {
    taskId: string;
    userId: string;
    contenido: string;
  },
) {
  const task = await prisma.tasks.findFirst({
    where: {
      id: taskId,
      projects: { userId },
    },
  });

  if (!task) {
    return null;
  }

  return prisma.comments.create({
    data: {
      taskId,
      userId,
      contenido: contenido.trim(),
    },
    include: baseCommentInclude,
  });
}

export async function updateComment(
  prisma: PrismaClient,
  {
    commentId,
    userId,
    contenido,
  }: {
    commentId: string;
    userId: string;
    contenido: string;
  },
) {
  const existing = await prisma.comments.findFirst({
    where: {
      id: commentId,
      userId,
      tasks: {
        projects: { userId },
      },
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.comments.update({
    where: { id: commentId },
    data: { contenido: contenido.trim() },
    include: baseCommentInclude,
  });
}

export async function deleteComment(
  prisma: PrismaClient,
  {
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  },
) {
  const existing = await prisma.comments.findFirst({
    where: {
      id: commentId,
      userId,
      tasks: {
        projects: { userId },
      },
    },
    include: baseCommentInclude,
  });

  if (!existing) {
    return null;
  }

  await prisma.comments.delete({
    where: { id: commentId },
  });

  return existing;
}


