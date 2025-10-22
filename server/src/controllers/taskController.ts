import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sseService } from '../services/sseService';

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

export const getTasks = async (req: any, res: Response) => {
  try {
    const { projectId, sectionId, filter, search, labelId } = req.query;

    // Construir filtros
    const where: any = {
      project: { userId: (req as AuthRequest).userId }
    };

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (sectionId) {
      where.sectionId = sectionId as string;
    }

    if (labelId) {
      where.labels = {
        some: {
          labelId: labelId as string
        }
      };
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
        const taskWithSubtasks = await getTaskWithAllSubtasks(task.id, (req as AuthRequest).userId!);
        return taskWithSubtasks;
      })
    );

    // Filter out any null values that might occur if a task couldn't be retrieved
    const validTasks = tasksWithAllSubtasks.filter(task => task !== null);

    res.json(validTasks);
  } catch (error) {
    console.error('Error en getTasks:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

export const getTask = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: (req as AuthRequest).userId }
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

export const createTask = async (req: any, res: Response) => {
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
        userId: (req as AuthRequest).userId
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

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'task_created',
      projectId,
      taskId: task.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: task,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error en createTask:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

export const updateTask = async (req: any, res: Response) => {
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
        project: { userId: (req as AuthRequest).userId }
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

    // Preparar datos de actualización
    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (prioridad !== undefined) updateData.prioridad = prioridad;
    if (fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    }
    if (completada !== undefined) updateData.completada = completada;
    if (sectionId !== undefined) updateData.sectionId = sectionId;
    if (orden !== undefined) updateData.orden = orden;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'task_updated',
      projectId: task.projectId,
      taskId: task.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: task,
    });

    res.json(task);
  } catch (error) {
    console.error('Error en updateTask:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

export const deleteTask = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la tarea pertenece al usuario
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: (req as AuthRequest).userId }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    await prisma.task.delete({
      where: { id }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'task_deleted',
      projectId: existingTask.projectId,
      taskId: id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteTask:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

export const toggleTask = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la tarea pertenece al usuario
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: { userId: (req as AuthRequest).userId }
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

export const getTasksByLabel = async (req: any, res: Response) => {
  try {
    const { labelId } = req.params;

    const rootTasks = await prisma.task.findMany({
      where: {
        project: { userId: (req as AuthRequest).userId },
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
        const taskWithSubtasks = await getTaskWithAllSubtasks(task.id, (req as AuthRequest).userId!);
        return taskWithSubtasks;
      })
    );

    // Filter out any null values that might occur if a task couldn't be retrieved
    const validTasks = tasksWithAllSubtasks.filter(task => task !== null);

    res.json(validTasks);
  } catch (error) {
    console.error('Error en getTasksByLabel:', error);
    res.status(500).json({ error: 'Error al obtener tareas por etiqueta' });
  }
};

export const reorderTasks = async (req: any, res: Response) => {
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
        project: { userId: (req as AuthRequest).userId }
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

    // Enviar evento SSE (usar projectId de la primera tarea)
    if (tasks.length > 0) {
      sseService.sendTaskEvent({
        type: 'task_reordered',
        projectId: tasks[0].projectId,
        userId: (req as AuthRequest).userId!,
        timestamp: new Date(),
        data: { taskIds },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en reorderTasks:', error);
    res.status(500).json({ error: 'Error al reordenar tareas' });
  }
};

