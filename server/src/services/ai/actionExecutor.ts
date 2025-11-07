/**
 * AI Action Executor
 * Executes AI-generated actions on tasks, projects, labels, etc.
 */

import { parseDateString } from './dateParser';
import type { AIAction } from './actionParser';
import { assertProjectPermission } from '../projectShareService';

/**
 * Helper query to check project access
 */
const projectAccessQuery = (userId: string) => ({
  OR: [
    { userId },
    { shares: { some: { sharedWithId: userId } } },
  ],
});

/**
 * Helper query to check task access
 */
const taskAccessWhere = (userId: string) => ({
  projects: projectAccessQuery(userId),
});

/**
 * Execute AI-generated actions
 * @param actions Array of actions to execute
 * @param userId User ID
 * @param prisma Prisma client
 * @returns Array of results
 */
export const executeAIActions = async (
  actions: AIAction[],
  userId: string,
  prisma: any,
) => {
  const results = [];

  for (const action of actions) {
    try {
      let result;

      switch (action.type) {
        case 'create_bulk':
          result = await executeBulkCreateTask(action, userId, prisma);
          break;

        case 'create':
          result = await executeCreateTask(action, userId, prisma);
          break;

        case 'update':
          result = await executeUpdateTask(action, userId, prisma);
          break;

        case 'update_bulk':
          result = await executeBulkUpdateTask(action, userId, prisma);
          break;

        case 'complete':
          result = await executeCompleteTask(action, userId, prisma);
          break;

        case 'delete':
          result = await executeDeleteTask(action, userId, prisma);
          break;

        case 'query':
          result = await executeQueryTask(action, userId, prisma);
          break;

        case 'create_project':
          result = await executeCreateProject(action, userId, prisma);
          break;

        case 'create_section':
          result = await executeCreateSection(action, userId, prisma);
          break;

        case 'create_label':
          result = await executeCreateLabel(action, userId, prisma);
          break;

        case 'add_comment':
          result = await executeAddComment(action, userId, prisma);
          break;

        case 'create_reminder':
          result = await executeCreateReminder(action, userId, prisma);
          break;
      }

      results.push({
        action,
        result,
        success: true,
      });
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      results.push({
        action,
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      });
    }
  }

  return results;
};

/**
 * Execute bulk task creation
 */
async function executeBulkCreateTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task' || !action.data?.tasks || !Array.isArray(action.data.tasks)) {
    return null;
  }

  const inboxProject = await prisma.projects.findFirst({
    where: {
      nombre: 'Inbox',
      ...projectAccessQuery(userId),
    },
  });

  const createdTasks = [];
  for (const taskData of action.data.tasks) {
    const fechaVencimiento = taskData.fechaVencimiento
      ? parseDateString(taskData.fechaVencimiento)
      : null;

    let targetProject = inboxProject;
    if (taskData.projectName) {
      const foundProject = await prisma.projects.findFirst({
        where: {
          nombre: { equals: taskData.projectName, mode: 'insensitive' },
          ...projectAccessQuery(userId),
        },
      });
      if (foundProject) targetProject = foundProject;
    }

    const resolvedProject = targetProject ?? inboxProject;
    if (!resolvedProject) {
      throw new Error('No se encontró un proyecto válido para crear la tarea');
    }

    await assertProjectPermission(prisma, resolvedProject.id, userId, 'write');

    let targetSectionId: string | null = null;
    if (taskData.sectionName) {
      const sectionInProject = await prisma.sections.findFirst({
        where: {
          projectId: resolvedProject.id,
          nombre: { equals: taskData.sectionName, mode: 'insensitive' },
        },
      });
      if (sectionInProject) {
        targetSectionId = sectionInProject.id;
      }
    }

    const task = await prisma.tasks.create({
      data: {
        titulo: taskData.titulo,
        descripcion: taskData.descripcion || null,
        prioridad: taskData.prioridad || 4,
        fechaVencimiento,
        projectId: resolvedProject.id,
        sectionId: targetSectionId,
        orden: 0,
        createdBy: userId,
      },
    });

    createdTasks.push(task);
  }

  return createdTasks;
}

/**
 * Execute single task creation
 */
async function executeCreateTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task') return null;

  const inboxProject = await prisma.projects.findFirst({
    where: {
      nombre: 'Inbox',
      ...projectAccessQuery(userId),
    },
  });

  const fechaVencimiento = action.data?.fechaVencimiento
    ? parseDateString(action.data.fechaVencimiento)
    : null;

  let targetProject = inboxProject;
  if (action.data?.projectName) {
    const foundProject = await prisma.projects.findFirst({
      where: {
        nombre: { equals: action.data.projectName, mode: 'insensitive' },
        ...projectAccessQuery(userId),
      },
    });
    if (foundProject) targetProject = foundProject;
  }

  const resolvedProject = targetProject ?? inboxProject;
  if (!resolvedProject) {
    throw new Error('No se encontró un proyecto válido para crear la tarea');
  }

  await assertProjectPermission(prisma, resolvedProject.id, userId, 'write');

  let targetSectionId = action.data.sectionId || null;
  if (action.data?.sectionName) {
    const foundSection = await prisma.sections.findFirst({
      where: {
        projectId: resolvedProject.id,
        nombre: { equals: action.data.sectionName, mode: 'insensitive' },
      },
    });
    if (foundSection) targetSectionId = foundSection.id;
  }

  let labelConnections: any[] = [];
  if (action.data?.labelNames && Array.isArray(action.data.labelNames)) {
    const labels = await Promise.all(
      action.data.labelNames.map(async (labelName: string) => {
        let label = await prisma.labels.findFirst({
          where: {
            userId,
            nombre: { equals: labelName, mode: 'insensitive' },
          },
        });
        if (!label) {
          label = await prisma.labels.create({
            data: {
              nombre: labelName,
              color: '#3b82f6',
              userId,
            },
          });
        }
        return label;
      }),
    );

    labelConnections = labels.map((label: any) => ({ labelId: label.id }));
  }

  const task = await prisma.tasks.create({
    data: {
      titulo: action.data?.titulo || 'Tarea sin título',
      descripcion: action.data?.descripcion || null,
      prioridad: action.data?.prioridad || 4,
      fechaVencimiento,
      projectId: resolvedProject.id,
      sectionId: targetSectionId,
      parentTaskId: action.data?.parentTaskId || null,
      orden: 0,
      createdBy: userId,
      ...(labelConnections.length > 0 && {
        task_labels: {
          create: labelConnections,
        },
      }),
    },
  });

  return task;
}

/**
 * Execute task update
 */
async function executeUpdateTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task' || !action.data?.search) return null;

  const task = await prisma.tasks.findFirst({
    where: {
      AND: [
        taskAccessWhere(userId),
        { titulo: { contains: action.data.search, mode: 'insensitive' } },
      ],
    },
  });

  if (!task) return null;

  const updateData: any = {};

  if (action.data.titulo) updateData.titulo = action.data.titulo;
  if (action.data.descripcion !== undefined) updateData.descripcion = action.data.descripcion;
  if (action.data.prioridad) updateData.prioridad = action.data.prioridad;

  if (action.data.fechaVencimiento) {
    updateData.fechaVencimiento = parseDateString(action.data.fechaVencimiento);
  }

  if (action.data.projectName) {
    const foundProject = await prisma.projects.findFirst({
      where: {
        userId,
        nombre: { equals: action.data.projectName, mode: 'insensitive' },
      },
    });
    if (foundProject) updateData.projectId = foundProject.id;
  }

  if (action.data.sectionName && updateData.projectId) {
    const foundSection = await prisma.sections.findFirst({
      where: {
        projectId: updateData.projectId,
        nombre: { equals: action.data.sectionName, mode: 'insensitive' },
      },
    });
    if (foundSection) updateData.sectionId = foundSection.id;
  }

  return await prisma.tasks.update({
    where: { id: task.id },
    data: updateData,
  });
}

/**
 * Execute bulk task update
 */
async function executeBulkUpdateTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task' || !action.data?.filter || !action.data?.updates) {
    return null;
  }

  const where: any = {
    ...taskAccessWhere(userId),
  };

  // Build filter
  if (action.data.filter.projectName) {
    const project = await prisma.projects.findFirst({
      where: {
        nombre: { equals: action.data.filter.projectName, mode: 'insensitive' },
        ...projectAccessQuery(userId),
      },
    });
    if (project) where.projectId = project.id;
  }

  if (action.data.filter.sectionName) {
    const section = await prisma.sections.findFirst({
      where: {
        nombre: { equals: action.data.filter.sectionName, mode: 'insensitive' },
        projects: projectAccessQuery(userId),
      },
    });
    if (section) where.sectionId = section.id;
  }

  if (action.data.filter.labelName) {
    where.task_labels = {
      some: {
        labels: {
          nombre: { equals: action.data.filter.labelName, mode: 'insensitive' },
          userId,
        },
      },
    };
  }

  if (action.data.filter.fechaVencimiento) {
    const fecha = parseDateString(action.data.filter.fechaVencimiento);
    if (fecha) {
      const startOfDay = new Date(fecha);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(fecha);
      endOfDay.setHours(23, 59, 59, 999);
      where.fechaVencimiento = { gte: startOfDay, lte: endOfDay };
    }
  }

  if (action.data.filter.prioridad) {
    where.prioridad = action.data.filter.prioridad;
  }

  if (action.data.filter.completada !== undefined) {
    where.completada = action.data.filter.completada;
  }

  // Build update data
  const updateData: any = {};

  if (action.data.updates.prioridad) {
    updateData.prioridad = action.data.updates.prioridad;
  }

  if (action.data.updates.completada !== undefined) {
    updateData.completada = action.data.updates.completada;
  }

  if (action.data.updates.fechaVencimiento) {
    updateData.fechaVencimiento = parseDateString(action.data.updates.fechaVencimiento);
  }

  if (action.data.updates.projectName) {
    const foundProject = await prisma.projects.findFirst({
      where: {
        nombre: { equals: action.data.updates.projectName, mode: 'insensitive' },
        ...projectAccessQuery(userId),
      },
    });
    if (foundProject) updateData.projectId = foundProject.id;
  }

  if (action.data.updates.sectionName) {
    const projectId = updateData.projectId || where.projectId;
    if (projectId) {
      const foundSection = await prisma.sections.findFirst({
        where: {
          projectId,
          nombre: { equals: action.data.updates.sectionName, mode: 'insensitive' },
        },
      });
      if (foundSection) updateData.sectionId = foundSection.id;
    }
  }

  // Handle label additions
  if (action.data.updates.addLabelNames && Array.isArray(action.data.updates.addLabelNames)) {
    const tasks = await prisma.tasks.findMany({
      where,
      select: { id: true },
    });

    for (const task of tasks) {
      for (const labelName of action.data.updates.addLabelNames) {
        let label = await prisma.labels.findFirst({
          where: {
            userId,
            nombre: { equals: labelName, mode: 'insensitive' },
          },
        });

        if (!label) {
          const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
          label = await prisma.labels.create({
            data: {
              nombre: labelName,
              color: colors[Math.floor(Math.random() * colors.length)],
              userId,
            },
          });
        }

        const existing = await prisma.task_labels.findFirst({
          where: {
            taskId: task.id,
            labelId: label.id,
          },
        });

        if (!existing) {
          await prisma.task_labels.create({
            data: {
              taskId: task.id,
              labelId: label.id,
            },
          });
        }
      }
    }

    return { count: tasks.length, message: `Etiquetas añadidas a ${tasks.length} tareas` };
  }

  return await prisma.tasks.updateMany({
    where,
    data: updateData,
  });
}

/**
 * Execute task completion
 */
async function executeCompleteTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task' || !action.data?.search) return null;

  const task = await prisma.tasks.findFirst({
    where: {
      AND: [
        taskAccessWhere(userId),
        { titulo: { contains: action.data.search, mode: 'insensitive' } },
      ],
    },
  });

  if (!task) return null;

  return await prisma.tasks.update({
    where: { id: task.id },
    data: { completada: true },
  });
}

/**
 * Execute task deletion
 */
async function executeDeleteTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task') return null;

  return await prisma.tasks.deleteMany({
    where: {
      ...taskAccessWhere(userId),
      ...action.data.filter,
    },
  });
}

/**
 * Execute task query
 */
async function executeQueryTask(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'task') return null;

  const where: any = {
    ...taskAccessWhere(userId),
  };

  if (action.data?.filter === 'week') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    where.fechaVencimiento = {
      gte: today,
      lt: nextWeek,
    };
  }

  if (action.data?.completada !== undefined) {
    where.completada = action.data.completada;
  }

  return await prisma.tasks.findMany({
    where,
    include: {
      task_labels: {
        include: {
          labels: true,
        },
      },
    },
    orderBy: { orden: 'asc' },
  });
}

/**
 * Execute project creation
 */
async function executeCreateProject(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'project') return null;

  const lastProject = await prisma.projects.findFirst({
    where: { userId },
    orderBy: { orden: 'desc' },
  });

  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
  const color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

  return await prisma.projects.create({
    data: {
      nombre: action.data.nombre,
      color,
      userId,
      orden: (lastProject?.orden || 0) + 1,
    },
  });
}

/**
 * Execute section creation
 */
async function executeCreateSection(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'section') return null;

  let targetProject = null;
  if (action.data?.projectName) {
    targetProject = await prisma.projects.findFirst({
      where: {
        userId,
        nombre: { equals: action.data.projectName, mode: 'insensitive' },
      },
    });
  }

  if (!targetProject) return null;

  const lastSection = await prisma.sections.findFirst({
    where: { projectId: targetProject.id },
    orderBy: { orden: 'desc' },
  });

  return await prisma.sections.create({
    data: {
      nombre: action.data.nombre,
      projectId: targetProject.id,
      orden: (lastSection?.orden || 0) + 1,
    },
  });
}

/**
 * Execute label creation
 */
async function executeCreateLabel(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'label') return null;

  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'];
  const color = action.data.color || colors[Math.floor(Math.random() * colors.length)];

  return await prisma.labels.create({
    data: {
      nombre: action.data.nombre,
      color,
      userId,
    },
  });
}

/**
 * Execute comment addition
 */
async function executeAddComment(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'comment') return null;

  const task = await prisma.tasks.findFirst({
    where: {
      AND: [
        taskAccessWhere(userId),
        { titulo: { contains: action.data.taskTitle, mode: 'insensitive' } },
      ],
    },
  });

  if (!task) return null;

  return await prisma.comments.create({
    data: {
      contenido: action.data.contenido,
      taskId: task.id,
      userId,
    },
  });
}

/**
 * Execute reminder creation
 */
async function executeCreateReminder(action: AIAction, userId: string, prisma: any) {
  if (action.entity !== 'reminder') return null;

  const task = await prisma.tasks.findFirst({
    where: {
      AND: [
        taskAccessWhere(userId),
        { titulo: { contains: action.data.taskTitle, mode: 'insensitive' } },
      ],
    },
  });

  if (!task) return null;

  let fechaRecordatorio = parseDateString(action.data.fecha);

  if (!fechaRecordatorio) {
    fechaRecordatorio = new Date(action.data.fecha);
  }

  return await prisma.reminders.create({
    data: {
      fecha: fechaRecordatorio,
      taskId: task.id,
    },
  });
}
