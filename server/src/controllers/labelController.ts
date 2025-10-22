import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLabels = async (req: any, res: Response) => {
  try {
    const labels = await prisma.label.findMany({
      where: { userId: (req as AuthRequest).userId },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(labels);
  } catch (error) {
    console.error('Error en getLabels:', error);
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

export const getLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const label = await prisma.label.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      },
      include: {
        tasks: {
          include: {
            task: true
          }
        }
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    res.json(label);
  } catch (error) {
    console.error('Error en getLabel:', error);
    res.status(500).json({ error: 'Error al obtener etiqueta' });
  }
};

export const createLabel = async (req: any, res: Response) => {
  try {
    const { nombre, color } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const label = await prisma.label.create({
      data: {
        nombre,
        color: color || '#808080',
        userId: (req as AuthRequest).userId!
      }
    });

    res.status(201).json(label);
  } catch (error) {
    console.error('Error en createLabel:', error);
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

export const updateLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, color } = req.body;

    // Verificar que la etiqueta pertenece al usuario
    const existingLabel = await prisma.label.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingLabel) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    const label = await prisma.label.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(color && { color })
      }
    });

    res.json(label);
  } catch (error) {
    console.error('Error en updateLabel:', error);
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
};

export const deleteLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la etiqueta pertenece al usuario
    const existingLabel = await prisma.label.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingLabel) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    await prisma.label.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteLabel:', error);
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
};

