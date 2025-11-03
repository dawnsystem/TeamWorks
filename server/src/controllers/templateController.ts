import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createTemplateSchema, updateTemplateSchema } from '../validation/schemas';

const prisma = new PrismaClient();

// Get all templates for the authenticated user
export const getAllTemplates = async (req: any, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    const templates = await prisma.task_templates.findMany({
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

    const template = await prisma.task_templates.findFirst({
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
    // Validación de formato ya realizada por middleware
    const validatedData = req.body;

    const template = await prisma.task_templates.create({
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
      console.error('Error creating template:', error);
    res.status(500).json({ error: 'Error al crear plantilla' });
  }
};

// Update a template
export const updateTemplate = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId;
    // Validación de formato ya realizada por middleware
    const validatedData = req.body;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.task_templates.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const template = await prisma.task_templates.update({
      where: { id },
      data: validatedData,
    });

      res.json(template);
    } catch (error) {
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
    const existingTemplate = await prisma.task_templates.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    await prisma.task_templates.delete({
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
    // Validación de formato ya realizada por middleware
    const { projectId, sectionId } = req.body;

    // Get the template
    const template = await prisma.task_templates.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Check if project exists and belongs to user
    const project = await prisma.projects.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Get the highest orden value for tasks in the target location
    const lastTask = await prisma.tasks.findFirst({
      where: {
        projectId,
        sectionId: sectionId || null,
        parentTaskId: null,
      },
      orderBy: { orden: 'desc' },
    });

    const newOrden = lastTask ? lastTask.orden + 1 : 0;

    // Create the task from the template
    const task = await prisma.tasks.create({
      data: {
        titulo: template.titulo,
        descripcion: template.descripcion,
        prioridad: template.prioridad,
        projectId,
        sectionId: sectionId || null,
        orden: newOrden,
        createdBy: userId,
        task_labels: {
          create: template.labelIds.map((labelId) => ({ labelId })),
        },
      } as any,
      include: {
        task_labels: { include: { labels: true } },
        comments: true,
        reminders: true,
        _count: {
          select: {
            other_tasks: true,
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
