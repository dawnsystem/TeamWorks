import { PrismaClient } from '@prisma/client';

const baseReminderInclude = {
  tasks: {
    select: {
      id: true,
      projectId: true,
      projects: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  },
};

export async function fetchRemindersByTask(prisma: PrismaClient, taskId: string, userId: string) {
  const task = await prisma.tasks.findFirst({
    where: {
      id: taskId,
      projects: { userId },
    },
  });

  if (!task) {
    return null;
  }

  return prisma.reminders.findMany({
    where: {
      taskId,
      tasks: {
        projects: { userId },
      },
    },
    include: baseReminderInclude,
    orderBy: { fechaHora: 'asc' },
  });
}

export async function createReminder(
  prisma: PrismaClient,
  {
    taskId,
    userId,
    fechaHora,
  }: {
    taskId: string;
    userId: string;
    fechaHora: string;
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

  const reminderDate = new Date(fechaHora);

  return prisma.reminders.create({
    data: {
      taskId,
      fechaHora: reminderDate,
    },
    include: baseReminderInclude,
  });
}

export async function deleteReminder(
  prisma: PrismaClient,
  {
    reminderId,
    userId,
  }: {
    reminderId: string;
    userId: string;
  },
) {
  const reminder = await prisma.reminders.findFirst({
    where: {
      id: reminderId,
      tasks: {
        projects: { userId },
      },
    },
    include: baseReminderInclude,
  });

  if (!reminder) {
    return null;
  }

  await prisma.reminders.delete({
    where: { id: reminderId },
  });

  return reminder;
}


