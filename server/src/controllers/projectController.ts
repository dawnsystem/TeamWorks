import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProjects = async (req: any, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
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

    const project = await prisma.project.findFirst({
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

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const project = await prisma.project.create({
      data: {
        nombre,
        color: color || '#808080',
        orden: orden || 0,
        userId: (req as AuthRequest).userId!
      }
    });

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
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(color && { color }),
        ...(orden !== undefined && { orden })
      }
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
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: (req as AuthRequest).userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await prisma.project.delete({
      where: { id }
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
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: (req as AuthRequest).userId
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const section = await prisma.section.create({
      data: {
        nombre,
        orden: orden || 0,
        projectId
      }
    });

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
    const section = await prisma.section.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!section || section.project.userId !== (req as AuthRequest).userId) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(orden !== undefined && { orden })
      }
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
    const section = await prisma.section.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!section || section.project.userId !== (req as AuthRequest).userId) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    await prisma.section.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteSection:', error);
    res.status(500).json({ error: 'Error al eliminar sección' });
  }
};

