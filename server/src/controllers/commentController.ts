import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';
import { taskSubscriptionService } from '../services/taskSubscriptionService';

const prisma = new PrismaClient();

// GET /api/tasks/:taskId/comments
export const getCommentsByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    // Verificar que la tarea pertenece al usuario
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        projects: { userId }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const comments = await prisma.comments.findMany({
      where: {
        taskId,
        tasks: {
          projects: { userId }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error en getCommentsByTask:', error);
    res.status(500).json({ message: 'Error al obtener comentarios' });
  }
};

// POST /api/tasks/:taskId/comments
export const createComment = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { contenido } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Validación de formato ya realizada por middleware

    // Verificar que la tarea pertenece al usuario ANTES de crear comentario
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        projects: { userId }
      },
      include: {
        projects: {
          select: {
            id: true,
            nombre: true,
            userId: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const comment = await prisma.comments.create({
      data: {
        contenido: contenido.trim(),
        taskId,
        userId,
      },
      include: {
        users: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        tasks: {
          select: {
            projectId: true,
            titulo: true,
            projects: {
              select: {
                userId: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'comment_created',
      projectId: comment.tasks.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId: userId,
      timestamp: new Date(),
      data: comment,
    });

    // Get the user who made the comment
    const commentAuthor = await prisma.users.findUnique({
      where: { id: userId },
      select: { nombre: true },
    });

    // Notificar a suscriptores de la tarea (excluyendo al autor del comentario)
    await notificationService.createForTaskSubscribers(
      comment.taskId,
      userId,
      {
        type: 'comment',
        title: '💬 Nuevo comentario',
        message: `${commentAuthor?.nombre || 'Alguien'} comentó en "${comment.tasks.titulo}"`,
        commentId: comment.id,
        projectId: comment.tasks.projectId,
        metadata: {
          commentText: contenido.trim(),
          authorName: commentAuthor?.nombre,
        },
      }
    );

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error en createComment:', error);
    res.status(500).json({ message: 'Error al crear comentario' });
  }
};

// PATCH /api/comments/:id
export const updateComment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Validación de formato ya realizada por middleware

    // Verificar que el comentario pertenece al usuario Y que la tarea pertenece al usuario
    const existingComment = await prisma.comments.findFirst({
      where: {
        id,
        userId,
        tasks: {
          projects: { userId }
        }
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificación de ownership ya incluida en la query findFirst

    const comment = await prisma.comments.update({
      where: { id },
      data: { contenido: contenido.trim() },
      include: {
        users: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        tasks: {
          select: {
            projectId: true,
          },
        },
      },
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'comment_updated',
      projectId: comment.tasks.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId: userId,
      timestamp: new Date(),
      data: comment,
    });

    res.json(comment);
  } catch (error) {
    console.error('Error en updateComment:', error);
    res.status(500).json({ message: 'Error al actualizar comentario' });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Verificar que el comentario pertenece al usuario Y que la tarea pertenece al usuario
    const existingComment = await prisma.comments.findFirst({
      where: {
        id,
        userId,
        tasks: {
          projects: { userId }
        }
      },
      include: {
        tasks: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificación de ownership ya incluida en la query findFirst

    await prisma.comments.delete({
      where: { id },
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'comment_deleted',
      projectId: existingComment.tasks.projectId,
      taskId: existingComment.taskId,
      commentId: id,
      userId: userId,
      timestamp: new Date(),
      data: { id },
    });

    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error en deleteComment:', error);
    res.status(500).json({ message: 'Error al eliminar comentario' });
  }
};

