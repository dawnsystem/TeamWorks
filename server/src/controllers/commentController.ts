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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
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

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ message: 'El contenido es requerido' });
    }

    const comment = await prisma.comment.create({
      data: {
        contenido: contenido.trim(),
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        task: {
          select: {
            projectId: true,
            titulo: true,
            project: {
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
      projectId: comment.task.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId: userId,
      timestamp: new Date(),
      data: comment,
    });

    // Get the user who made the comment
    const commentAuthor = await prisma.user.findUnique({
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
        message: `${commentAuthor?.nombre || 'Alguien'} comentó en "${comment.task.titulo}"`,
        commentId: comment.id,
        projectId: comment.task.projectId,
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

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ message: 'El contenido es requerido' });
    }

    // Verificar que el comentario pertenece al usuario
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { contenido: contenido.trim() },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'comment_updated',
      projectId: comment.task.projectId,
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

    // Verificar que el comentario pertenece al usuario
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'comment_deleted',
      projectId: existingComment.task.projectId,
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

