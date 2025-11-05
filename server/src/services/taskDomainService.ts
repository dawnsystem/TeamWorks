import type { Prisma, PrismaClient } from '@prisma/client';

import { toClientTask } from '../factories/taskFactory';

const baseTaskInclude = {
  task_labels: { include: { labels: true } },
  projects: {
    select: {
      id: true,
      nombre: true,
      color: true,
    },
  },
  sections: {
    select: {
      id: true,
      nombre: true,
    },
  },
  _count: {
    select: { other_tasks: true, comments: true, reminders: true },
  },
} satisfies Prisma.tasksInclude;

const taskAccessFilter = (userId: string): Prisma.tasksWhereInput => ({
  OR: [
    { projects: { userId } },
    { projects: { shares: { some: { sharedWithId: userId } } } },
  ],
});

const withAccess = (where: Prisma.tasksWhereInput | undefined, userId: string): Prisma.tasksWhereInput => {
  if (!where || Object.keys(where).length === 0) {
    return taskAccessFilter(userId);
  }

  return {
    AND: [taskAccessFilter(userId), where],
  };
};

export async function buildTaskTree(
  prisma: PrismaClient,
  taskId: string,
  userId: string,
  taskOverride?: any,
): Promise<any | null> {
  const task =
    taskOverride ??
    (await prisma.tasks.findFirst({
      where: {
        AND: [
          { id: taskId },
          taskAccessFilter(userId),
        ],
      },
      include: baseTaskInclude,
    }));

  if (!task) return null;

  const subTasks = await prisma.tasks.findMany({
    where: {
      AND: [
        { parentTaskId: taskId },
        taskAccessFilter(userId),
      ],
    },
    include: baseTaskInclude,
    orderBy: { orden: 'asc' },
  });

  const subTasksWithChildren = await Promise.all(
    subTasks.map(async (subTask) => {
      const children = await buildTaskTree(prisma, subTask.id, userId, subTask);
      return children ?? subTask;
    }),
  );

  return {
    ...task,
    other_tasks: subTasksWithChildren,
  };
}

export async function fetchTasksForest(
  prisma: PrismaClient,
  where: Prisma.tasksWhereInput,
  userId: string,
): Promise<any[]> {
  const rootTasks = await prisma.tasks.findMany({
    where: withAccess(where, userId),
    include: baseTaskInclude,
    orderBy: { orden: 'asc' },
  });

  const trees = await Promise.all(
    rootTasks.map(async (task) => buildTaskTree(prisma, task.id, userId, task)),
  );

  return trees.filter(Boolean).map((task) => toClientTask(task));
}

export async function fetchSingleTask(
  prisma: PrismaClient,
  taskId: string,
  userId: string,
): Promise<any | null> {
  const tree = await buildTaskTree(prisma, taskId, userId);
  return tree ? toClientTask(tree) : null;
}


