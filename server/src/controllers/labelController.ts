import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sseService } from '../services/sseService';
import { labelFactory } from '../factories/labelFactory';
import {
  fetchLabels,
  fetchLabel,
  createLabel as createLabelService,
  updateLabel as updateLabelService,
  deleteLabel as deleteLabelService,
} from '../services/labelDomainService';

const prisma = new PrismaClient();

export const getLabels = async (req: any, res: Response) => {
  try {
    const labels = await fetchLabels(prisma, (req as AuthRequest).userId!);
    const clientLabels = labels.map(labelFactory.toClientLabel);

    res.json(clientLabels);
  } catch (error) {
    console.error('Error en getLabels:', error);
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

export const getLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const label = await fetchLabel(prisma, id, (req as AuthRequest).userId!);

    if (!label) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    res.json(labelFactory.toClientLabel(label));
  } catch (error) {
    console.error('Error en getLabel:', error);
    res.status(500).json({ error: 'Error al obtener etiqueta' });
  }
};

export const createLabel = async (req: any, res: Response) => {
  try {
    const { nombre, color } = req.body;

    const label = await createLabelService(prisma, {
      nombre,
      color,
      userId: (req as AuthRequest).userId!,
    });

    const clientLabel = labelFactory.toClientLabel(label);

    // Enviar evento SSE (sin projectId específico, se envía a todos los proyectos del usuario)
    sseService.sendTaskEvent({
      type: 'label_created',
      projectId: 'global',
      labelId: label.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientLabel,
    });

    res.status(201).json(clientLabel);
  } catch (error) {
    console.error('Error en createLabel:', error);
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

export const updateLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, color } = req.body;

    const label = await updateLabelService(prisma, id, (req as AuthRequest).userId!, {
      nombre,
      color,
    });

    if (!label) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    const clientLabel = labelFactory.toClientLabel(label);

    sseService.sendTaskEvent({
      type: 'label_updated',
      projectId: 'global',
      labelId: label.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientLabel,
    });

    res.json(clientLabel);
  } catch (error) {
    console.error('Error en updateLabel:', error);
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
};

export const deleteLabel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const existingLabel = await deleteLabelService(prisma, id, (req as AuthRequest).userId!);

    if (!existingLabel) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    sseService.sendTaskEvent({
      type: 'label_deleted',
      projectId: 'global',
      labelId: id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteLabel:', error);
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
};

