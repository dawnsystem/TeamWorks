import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// GET /api/tasks/:taskId/comments
export const getCommentsByTask = async (req: AuthRequest, res: Response) => {
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
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { contenido } = req.body;
    const userId = req.userId;

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
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error en createComment:', error);
    res.status(500).json({ message: 'Error al crear comentario' });
  }
};

// PATCH /api/comments/:id
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const userId = req.userId;

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
      },
    });

    res.json(comment);
  } catch (error) {
    console.error('Error en updateComment:', error);
    res.status(500).json({ message: 'Error al actualizar comentario' });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
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

    await prisma.comment.delete({
      where: { id },
    });

    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error en deleteComment:', error);
    res.status(500).json({ message: 'Error al eliminar comentario' });
  }
};

