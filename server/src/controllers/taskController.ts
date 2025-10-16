import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to recursively fetch subtasks
async function getTaskWithAllSubtasks(taskId: string, userId: string): Promise<any> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { userId }
    },
    include: {
      labels: {
        include: {
          label: true
        }
      },
      _count: {
        select: { subTasks: true, comments: true, reminders: true }
      }
    }
  });

  if (!task) return null;

  // Fetch all direct subtasks
  const subTasks = await prisma.task.findMany({
    where: {
      parentTaskId: taskId,
      project: { userId }
    },
    include: {
      labels: {
        include: {
          label: true
        }
      },
      _count: {
        select: { subTasks: true, comments: true, reminders: true }
      }
    },
    orderBy: { orden: 'asc' }
  });

  // Recursively fetch subtasks of each subtask
  const subTasksWithChildren = await Promise.all(
    subTasks.map(async (subTask) => {
      const children = await getTaskWithAllSubtasks(subTask.id, userId);
      return {
        ...subTask,
        subTasks: children?.subTasks || []
      };
    })
  );

  return {
    ...task,
    subTasks: subTasksWithChildren
  };
}

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, sectionId, filter, search } = req.query;

    // Construir filtros
    const where: any = {
      project: { userId: req.userId }
    };

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (sectionId) {
      where.sectionId = sectionId as string;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search as string, mode: 'insensitive' } },
        { descripcion: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Filtros especiales
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      where.fechaVencimiento = {
        gte: today,
        lt: tomorrow
      };
      where.completada = false;
    }

    if (filter === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      where.fechaVencimiento = {
        gte: today,
        lt: nextWeek
      };
      where.completada = false;
    }

    if (filter === 'completed') {
      where.completada = true;
    }

    if (filter === 'pending') {
      where.completada = false;
    }

    // Only fetch root tasks (those without a parent)
    where.parentTaskId = null;

    const rootTasks = await prisma.task.findMany({
      where,
      include: {
        labels: {
          include: {
            label: true
          }
        },
        _count: {
          select: { subTasks: true, comments: true, reminders: true }
        }
      },
      orderBy: { orden: 'asc' }
    });

    // Recursively fetch all subtasks for each root task
    const tasksWithAllSubtasks = await Promise.all(
      rootTasks.map(async (task) => {
        const taskWithSubtasks = await getTaskWithAllSubtasks(task.id, req.userId!);
        return taskWithSubtasks;
      })
    );

    res.json(tasksWithAllSubtasks);
  } catch (error) {
    console.error('Error en getTasks:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: req.userId }
      },
      include: {
        labels: {
          include: {
            label: true
          }
        },
        subTasks: {
          orderBy: { orden: 'asc' }
        },
        parentTask: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        reminders: {
          orderBy: { fechaHora: 'asc' }
        },
        _count: {
          select: { subTasks: true, comments: true, reminders: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error en getTask:', error);
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const {
      titulo,
      descripcion,
      prioridad,
      fechaVencimiento,
      projectId,
      sectionId,
      parentTaskId,
      orden,
      labelIds
    } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'El proyecto es requerido' });
    }

    // Verificar que el proyecto pertenece al usuario
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const task = await prisma.task.create({
      data: {
        titulo,
        descripcion,
        prioridad: prioridad || 4,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        projectId,
        sectionId,
        parentTaskId,
        orden: orden || 0,
        ...(labelIds && labelIds.length > 0 && {
          labels: {
            create: labelIds.map((labelId: string) => ({
              labelId
            }))
          }
        })
      },
      include: {
        labels: {
          include: {
            label: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error en createTask:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      prioridad,
      fechaVencimiento,
      completada,
      sectionId,
      orden,
      labelIds
    } = req.body;

    // Verificar que la tarea pertenece al usuario
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: req.userId }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Si se proporcionan labelIds, actualizar las relaciones
    if (labelIds !== undefined) {
      await prisma.taskLabel.deleteMany({
        where: { taskId: id }
      });

      if (labelIds.length > 0) {
        await prisma.taskLabel.createMany({
          data: labelIds.map((labelId: string) => ({
            taskId: id,
            labelId
          }))
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(prioridad !== undefined && { prioridad }),
        ...(fechaVencimiento !== undefined && {
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null
        }),
        ...(completada !== undefined && { completada }),
        ...(sectionId !== undefined && { sectionId }),
        ...(orden !== undefined && { orden })
      },
      include: {
        labels: {
          include: {
            label: true
          }
        }
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error en updateTask:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la tarea pertenece al usuario
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: req.userId }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteTask:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

export const toggleTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la tarea pertenece al usuario
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: req.userId }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        completada: !existingTask.completada
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error en toggleTask:', error);
    res.status(500).json({ error: 'Error al cambiar estado de tarea' });
  }
};

export const getTasksByLabel = async (req: AuthRequest, res: Response) => {
  try {
    const { labelId } = req.params;

    const rootTasks = await prisma.task.findMany({
      where: {
        project: { userId: req.userId },
        parentTaskId: null,
        labels: {
          some: { labelId }
        }
      },
      include: {
        labels: {
          include: {
            label: true
          }
        },
        _count: {
          select: { subTasks: true, comments: true, reminders: true }
        }
      },
      orderBy: { orden: 'asc' }
    });

    // Recursively fetch all subtasks for each root task
    const tasksWithAllSubtasks = await Promise.all(
      rootTasks.map(async (task) => {
        const taskWithSubtasks = await getTaskWithAllSubtasks(task.id, req.userId!);
        return taskWithSubtasks;
      })
    );

    res.json(tasksWithAllSubtasks);
  } catch (error) {
    console.error('Error en getTasksByLabel:', error);
    res.status(500).json({ error: 'Error al obtener tareas por etiqueta' });
  }
};

export const reorderTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { taskUpdates } = req.body;

    if (!Array.isArray(taskUpdates)) {
      return res.status(400).json({ error: 'taskUpdates debe ser un array' });
    }

    // Verificar que todas las tareas pertenecen al usuario
    const taskIds = taskUpdates.map((t: any) => t.id);
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        project: { userId: req.userId }
      }
    });

    if (tasks.length !== taskIds.length) {
      return res.status(403).json({ error: 'Acceso denegado a una o más tareas' });
    }

    // Actualizar todas las tareas en una transacción
    await prisma.$transaction(
      taskUpdates.map((update: any) =>
        prisma.task.update({
          where: { id: update.id },
          data: {
            orden: update.orden,
            ...(update.projectId && { projectId: update.projectId }),
            ...(update.sectionId !== undefined && { sectionId: update.sectionId }),
            ...(update.parentTaskId !== undefined && { parentTaskId: update.parentTaskId })
          }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error en reorderTasks:', error);
    res.status(500).json({ error: 'Error al reordenar tareas' });
  }
};

