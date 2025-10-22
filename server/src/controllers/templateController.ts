import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const createTemplateSchema = z.object({
  titulo: z.string().min(1).max(255),
  descripcion: z.string().optional(),
  prioridad: z.number().int().min(1).max(4).default(4),
  labelIds: z.array(z.string()).default([]),
});

const updateTemplateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().optional().nullable(),
  prioridad: z.number().int().min(1).max(4).optional(),
  labelIds: z.array(z.string()).optional(),
});

// Get all templates for the authenticated user
export const getAllTemplates = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    const templates = await prisma.taskTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Error al obtener plantillas' });
  }
};

// Get a single template
export const getTemplate = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    const template = await prisma.taskTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Error al obtener plantilla' });
  }
};

// Create a new template
export const createTemplate = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const validatedData = createTemplateSchema.parse(req.body);

    const template = await prisma.taskTemplate.create({
      data: {
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        prioridad: validatedData.prioridad,
        labelIds: validatedData.labelIds,
        userId: userId!,
      } as any,
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Error al crear plantilla' });
  }
};

// Update a template
export const updateTemplate = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;
    const validatedData = updateTemplateSchema.parse(req.body);

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const template = await prisma.taskTemplate.update({
      where: { id },
      data: validatedData,
    });

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Error al actualizar plantilla' });
  }
};

// Delete a template
export const deleteTemplate = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    await prisma.taskTemplate.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
};

// Apply a template (create a task from a template)
export const applyTemplate = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;
    const { projectId, sectionId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Se requiere projectId' });
    }

    // Get the template
    const template = await prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Check if project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Get the highest orden value for tasks in the target location
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId,
        sectionId: sectionId || null,
        parentTaskId: null,
      },
      orderBy: { orden: 'desc' },
    });

    const newOrden = lastTask ? lastTask.orden + 1 : 0;

    // Create the task from the template
    const task = await prisma.task.create({
      data: {
        titulo: template.titulo,
        descripcion: template.descripcion,
        prioridad: template.prioridad,
        projectId,
        sectionId: sectionId || null,
        orden: newOrden,
        labels: {
          create: template.labelIds.map((labelId) => ({
            labelId,
          })),
        },
      },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
        subTasks: true,
        comments: true,
        reminders: true,
        _count: {
          select: {
            subTasks: true,
            comments: true,
            reminders: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: 'Error al aplicar plantilla' });
  }
};
