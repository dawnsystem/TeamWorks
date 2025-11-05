import { PrismaClient, Prisma } from '@prisma/client';

const baseLabelInclude = {
  _count: {
    select: { task_labels: true },
  },
  task_labels: {
    select: {
      taskId: true,
      labels: {
        select: {
          id: true,
          nombre: true,
          color: true,
        },
      },
    },
  },
} satisfies Prisma.labelsInclude;

export async function fetchLabels(prisma: PrismaClient, userId: string) {
  return prisma.labels.findMany({
    where: { userId },
    include: baseLabelInclude,
    orderBy: { nombre: 'asc' },
  });
}

export async function fetchLabel(prisma: PrismaClient, labelId: string, userId: string) {
  return prisma.labels.findFirst({
    where: { id: labelId, userId },
    include: baseLabelInclude,
  });
}

export async function createLabel(
  prisma: PrismaClient,
  data: { nombre: string; color?: string | null; userId: string },
) {
  return prisma.labels.create({
    data: {
      nombre: data.nombre,
      color: data.color ?? '#ef4444',
      userId: data.userId,
    },
    include: baseLabelInclude,
  });
}

export async function updateLabel(
  prisma: PrismaClient,
  labelId: string,
  userId: string,
  data: { nombre?: string; color?: string | null },
) {
  const existing = await prisma.labels.findFirst({
    where: { id: labelId, userId },
  });

  if (!existing) return null;

  const updateData: Prisma.labelsUpdateInput = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.color !== undefined) updateData.color = data.color;

  return prisma.labels.update({
    where: { id: labelId },
    data: updateData,
    include: baseLabelInclude,
  });
}

export async function deleteLabel(prisma: PrismaClient, labelId: string, userId: string) {
  const existing = await prisma.labels.findFirst({
    where: { id: labelId, userId },
  });

  if (!existing) return null;

  await prisma.labels.delete({
    where: { id: labelId },
  });

  return existing;
}

export async function findUnauthorizedLabelIds(
  prisma: PrismaClient,
  labelIds: string[] | undefined,
  userId: string,
): Promise<string[]> {
  if (!labelIds?.length) {
    return [];
  }

  const uniqueIds = Array.from(new Set(labelIds));
  const ownedLabels = await prisma.labels.findMany({
    where: {
      id: { in: uniqueIds },
      userId,
    },
    select: { id: true },
  });

  const ownedSet = new Set(ownedLabels.map((label) => label.id));
  return uniqueIds.filter((id) => !ownedSet.has(id));
}


