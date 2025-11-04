import { PrismaClient, Prisma } from '@prisma/client';

const baseProjectInclude = {
  sections: {
    orderBy: { orden: 'asc' as const },
  },
  _count: {
    select: { tasks: true },
  },
};

export async function fetchProjects(prisma: PrismaClient, userId: string) {
  return prisma.projects.findMany({
    where: { userId },
    include: baseProjectInclude,
    orderBy: { orden: 'asc' },
  });
}

export async function fetchProject(prisma: PrismaClient, projectId: string, userId: string) {
  return prisma.projects.findFirst({
    where: { id: projectId, userId },
    include: baseProjectInclude,
  });
}

export async function createProject(
  prisma: PrismaClient,
  data: { nombre: string; color?: string | null; orden?: number | null; userId: string },
) {
  return prisma.projects.create({
    data: {
      nombre: data.nombre,
      color: data.color ?? '#808080',
      orden: data.orden ?? 0,
      userId: data.userId,
    },
    include: baseProjectInclude,
  });
}

export async function updateProject(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
  data: { nombre?: string; color?: string | null; orden?: number | null },
) {
  const existing = await prisma.projects.findFirst({
    where: { id: projectId, userId },
  });

  if (!existing) return null;

  const updateData: Prisma.projectsUpdateInput = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.orden !== undefined) updateData.orden = data.orden;

  return prisma.projects.update({
    where: { id: projectId },
    data: updateData,
    include: baseProjectInclude,
  });
}

export async function deleteProject(prisma: PrismaClient, projectId: string, userId: string) {
  const existing = await prisma.projects.findFirst({
    where: { id: projectId, userId },
  });

  if (!existing) return null;

  await prisma.projects.delete({
    where: { id: projectId },
  });

  return existing;
}

export async function createSection(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
  data: { nombre: string; orden?: number | null },
) {
  const project = await prisma.projects.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) return null;

  const lastSection = await prisma.sections.findFirst({
    where: { projectId },
    orderBy: { orden: 'desc' },
  });

  const section = await prisma.sections.create({
    data: {
      nombre: data.nombre,
      projectId,
      orden: data.orden ?? (lastSection?.orden ?? 0) + 1,
    },
  });

  return section;
}

export async function updateSection(
  prisma: PrismaClient,
  sectionId: string,
  userId: string,
  data: { nombre?: string; orden?: number | null },
) {
  const section = await prisma.sections.findFirst({
    where: {
      id: sectionId,
      projects: { userId },
    },
  });

  if (!section) return null;

  const updateData: Prisma.sectionsUpdateInput = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.orden !== undefined) updateData.orden = data.orden;

  return prisma.sections.update({
    where: { id: sectionId },
    data: updateData,
  });
}

export async function deleteSection(prisma: PrismaClient, sectionId: string, userId: string) {
  const section = await prisma.sections.findFirst({
    where: {
      id: sectionId,
      projects: { userId },
    },
  });

  if (!section) return null;

  await prisma.sections.delete({
    where: { id: sectionId },
  });

  return section;
}


