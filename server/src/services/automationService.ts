import type { PrismaClient } from '@prisma/client';

interface TaskAutomationDraft {
  titulo: string;
  projectId: string;
  prioridad?: number | null;
  fechaVencimiento?: Date | null;
  sectionId?: string | null;
}

interface TaskAutomationOptions {
  mode: 'create' | 'update';
  hasDueDate?: boolean;
  hasSection?: boolean;
}

interface TaskAutomationResult {
  patches: Partial<TaskAutomationDraft>;
  notes: string[];
}

export const applyTaskAutomations = async (
  prisma: PrismaClient,
  userId: string,
  draft: TaskAutomationDraft,
  options: TaskAutomationOptions,
): Promise<TaskAutomationResult> => {
  const patches: Partial<TaskAutomationDraft> = {};
  const notes: string[] = [];

  const priority = draft.prioridad ?? 4;

  // Regla 1: Prioridad alta sin fecha => asignar vencimiento hoy
  if (!options.hasDueDate && !draft.fechaVencimiento && priority === 1) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    patches.fechaVencimiento = today;
    notes.push('Se asignó fecha de vencimiento para hoy porque la prioridad es alta (P1).');
  }

  // Regla 2: Un único contenedor disponible => autoasignar sección
  if (!options.hasSection && !draft.sectionId && draft.projectId) {
    const sections = await prisma.sections.findMany({
      where: {
        projectId: draft.projectId,
        projects: { userId },
      },
      select: { id: true },
      take: 2,
      orderBy: { orden: 'asc' },
    });

    if (sections.length === 1) {
      patches.sectionId = sections[0].id;
      notes.push('Se asignó automáticamente la única sección disponible del proyecto.');
    }
  }

  return { patches, notes };
};


