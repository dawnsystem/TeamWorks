import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';
import { taskSubscriptionService } from '../services/taskSubscriptionService';
import { assertProjectPermission } from '../services/projectShareService';
import {
  fetchCommentsByTask,
  createComment as createCommentDomain,
  updateComment as updateCommentDomain,
  deleteComment as deleteCommentDomain,
} from '../services/commentDomainService';
import { commentFactory } from '../factories/commentFactory';

const prisma = new PrismaClient();

const projectAccessCondition = (userId: string) => ({
  OR: [
    { projects: { userId } },
    { projects: { shares: { some: { sharedWithId: userId } } } },
  ],
});

// GET /api/tasks/:taskId/comments
export const getCommentsByTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req as AuthRequest).userId;

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        ...projectAccessCondition(userId),
      },
      include: {
        projects: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await assertProjectPermission(prisma, task.projects.id, userId, 'write');

    const comments = await fetchCommentsByTask(prisma, taskId, userId);

    if (!comments) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json(comments.map(commentFactory.toClientComment));
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

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        ...projectAccessCondition(userId),
      },
      include: {
        projects: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await assertProjectPermission(prisma, task.projects.id, userId, 'write');

    const comment = await createCommentDomain(prisma, {
      taskId,
      userId,
      contenido,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const formattedComment = commentFactory.toClientComment(comment);

    sseService.sendTaskEvent({
      type: 'comment_created',
      projectId: comment.tasks.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId,
      timestamp: new Date(),
      data: formattedComment,
    });

    const authorName = comment.users?.nombre || 'Alguien';

    await notificationService.createForTaskSubscribers(comment.taskId, userId, {
      type: 'comment',
      title: '💬 Nuevo comentario',
      message: `${authorName} comentó en "${comment.tasks.titulo}"`,
      commentId: comment.id,
      projectId: comment.tasks.projectId,
      metadata: {
        commentText: contenido.trim(),
        authorName,
      },
    });

    res.status(201).json(formattedComment);
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

    const existingComment = await prisma.comments.findFirst({
      where: {
        id,
        userId,
        tasks: {
          ...projectAccessCondition(userId),
        },
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

    await assertProjectPermission(prisma, existingComment.tasks.projectId, userId, 'write');

    const comment = await updateCommentDomain(prisma, {
      commentId: id,
      userId,
      contenido,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    const formattedComment = commentFactory.toClientComment(comment);

    sseService.sendTaskEvent({
      type: 'comment_updated',
      projectId: comment.tasks.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId,
      timestamp: new Date(),
      data: formattedComment,
    });

    res.json(formattedComment);
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

    const existingComment = await prisma.comments.findFirst({
      where: {
        id,
        tasks: {
          ...projectAccessCondition(userId),
        },
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

    await assertProjectPermission(prisma, existingComment.tasks.projectId, userId, 'write');

    const comment = await deleteCommentDomain(prisma, {
      commentId: id,
      userId,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    sseService.sendTaskEvent({
      type: 'comment_deleted',
      projectId: comment.tasks.projectId,
      taskId: comment.taskId,
      commentId: comment.id,
      userId,
      timestamp: new Date(),
      data: { id: comment.id },
    });

    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error en deleteComment:', error);
    res.status(500).json({ message: 'Error al eliminar comentario' });
  }
};

