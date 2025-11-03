import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const getProjects = async (req: any, res: Response) => {
  try {
    const projects = await prisma.projects.findMany({
      where: { userId: (req as AuthRequest).userId },
      include: {
        sections: {
          orderBy: { orden: 'asc' }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error en getProjects:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

export const getProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.projects.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      },
      include: {
        sections: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error en getProject:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
};

export const createProject = async (req: any, res: Response) => {
  try {
    const { nombre, color, orden } = req.body;

    // Validación de formato ya realizada por middleware
    const project = await prisma.projects.create({
      data: {
        nombre,
        color: color || '#808080',
        orden: orden || 0,
        userId: (req as AuthRequest).userId!
      }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'project_created',
      projectId: project.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: project,
    });

    // No crear notificación para acciones propias del usuario

    res.status(201).json(project);
  } catch (error) {
    console.error('Error en createProject:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

export const updateProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, color, orden } = req.body;

    // Verificar que el proyecto pertenece al usuario
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const project = await prisma.projects.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(color && { color }),
        ...(orden !== undefined && { orden })
      }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'project_updated',
      projectId: project.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: project,
    });

    res.json(project);
  } catch (error) {
    console.error('Error en updateProject:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

export const deleteProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el proyecto pertenece al usuario
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await prisma.projects.delete({
      where: { id }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'project_deleted',
      projectId: id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteProject:', error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

export const createSection = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { nombre, orden } = req.body;

    // Verificar que el proyecto pertenece al usuario
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        userId: (req as AuthRequest).userId
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Validación de formato ya realizada por middleware
    const section = await prisma.sections.create({
      data: {
        nombre,
        orden: orden || 0,
        projectId
      }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'section_created',
      projectId: projectId,
      sectionId: section.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: section,
    });

    // No crear notificación para acciones propias del usuario

    res.status(201).json(section);
  } catch (error) {
    console.error('Error en createSection:', error);
    res.status(500).json({ error: 'Error al crear sección' });
  }
};

export const updateSection = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, orden } = req.body;

    // Verificar que la sección pertenece a un proyecto del usuario
    const section = await prisma.sections.findFirst({
      where: { id },
      include: { projects: true }
    });

    if (!section || section.projects.userId !== (req as AuthRequest).userId) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const updatedSection = await prisma.sections.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(orden !== undefined && { orden })
      }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'section_updated',
      projectId: section.projectId,
      sectionId: updatedSection.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: updatedSection,
    });

    res.json(updatedSection);
  } catch (error) {
    console.error('Error en updateSection:', error);
    res.status(500).json({ error: 'Error al actualizar sección' });
  }
};

export const deleteSection = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la sección pertenece a un proyecto del usuario
    const section = await prisma.sections.findFirst({
      where: { id },
      include: { projects: true }
    });

    if (!section || section.projects.userId !== (req as AuthRequest).userId) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    await prisma.sections.delete({
      where: { id }
    });

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'section_deleted',
      projectId: section.projectId,
      sectionId: id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteSection:', error);
    res.status(500).json({ error: 'Error al eliminar sección' });
  }
};

