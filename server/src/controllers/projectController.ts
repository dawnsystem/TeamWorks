import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sseService } from '../services/sseService';
import { notificationService } from '../services/notificationService';
import { projectFactory } from '../factories/projectFactory';
import {
  fetchProjects,
  fetchProject,
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  createSection as createSectionService,
  updateSection as updateSectionService,
  deleteSection as deleteSectionService,
} from '../services/projectDomainService';

const prisma = new PrismaClient();

export const getProjects = async (req: any, res: Response) => {
  try {
    const projects = await fetchProjects(prisma, (req as AuthRequest).userId!);
    const clientProjects = projects.map(projectFactory.toClientProject);

    console.log(`[getProjects] Usuario ${(req as AuthRequest).userId} - Proyectos encontrados: ${clientProjects.length}`);
    res.json(clientProjects);
  } catch (error) {
    console.error('Error en getProjects:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({ error: 'Error al obtener proyectos', details: error instanceof Error ? error.message : String(error) });
  }
};

export const getProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const project = await fetchProject(prisma, id, (req as AuthRequest).userId!);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(projectFactory.toClientProject(project));
  } catch (error) {
    console.error('Error en getProject:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
};

export const createProject = async (req: any, res: Response) => {
  try {
    const { nombre, color, orden } = req.body;

    const project = await createProjectService(prisma, {
      nombre,
      color,
      orden,
      userId: (req as AuthRequest).userId!,
    });

    const clientProject = projectFactory.toClientProject(project);

    // Enviar evento SSE
    sseService.sendTaskEvent({
      type: 'project_created',
      projectId: project.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientProject,
    });

    // No crear notificación para acciones propias del usuario

    res.status(201).json(clientProject);
  } catch (error) {
    console.error('Error en createProject:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

export const updateProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, color, orden } = req.body;

    const project = await updateProjectService(prisma, id, (req as AuthRequest).userId!, {
      nombre,
      color,
      orden,
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const clientProject = projectFactory.toClientProject(project);

    sseService.sendTaskEvent({
      type: 'project_updated',
      projectId: project.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientProject,
    });

    res.json(clientProject);
  } catch (error) {
    console.error('Error en updateProject:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

export const deleteProject = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const existingProject = await deleteProjectService(prisma, id, (req as AuthRequest).userId!);

    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

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

    const section = await createSectionService(prisma, projectId, (req as AuthRequest).userId!, {
      nombre,
      orden,
    });

    if (!section) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const clientSection = projectFactory.toClientSection(section);

    sseService.sendTaskEvent({
      type: 'section_created',
      projectId,
      sectionId: section.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientSection,
    });

    res.status(201).json(clientSection);
  } catch (error) {
    console.error('Error en createSection:', error);
    res.status(500).json({ error: 'Error al crear sección' });
  }
};

export const updateSection = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, orden } = req.body;

    const updatedSection = await updateSectionService(prisma, id, (req as AuthRequest).userId!, {
      nombre,
      orden,
    });

    if (!updatedSection) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const clientSection = projectFactory.toClientSection(updatedSection);

    sseService.sendTaskEvent({
      type: 'section_updated',
      projectId: updatedSection.projectId,
      sectionId: updatedSection.id,
      userId: (req as AuthRequest).userId!,
      timestamp: new Date(),
      data: clientSection,
    });

    res.json(clientSection);
  } catch (error) {
    console.error('Error en updateSection:', error);
    res.status(500).json({ error: 'Error al actualizar sección' });
  }
};

export const deleteSection = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const section = await deleteSectionService(prisma, id, (req as AuthRequest).userId!);

    if (!section) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    await prisma.tasks.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

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

