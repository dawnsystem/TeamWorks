import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { processNaturalLanguage, executeAIActions } from '../services/aiService';

const prisma = new PrismaClient();

export const processCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { command, autoExecute = false, context } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'El comando es requerido' });
    }

    // Obtener contexto del usuario si no se proporciona
    let userContext = context;
    if (!userContext) {
      const projects = await prisma.project.findMany({
        where: { userId: req.userId },
        select: { id: true, nombre: true }
      });

      const recentTasks = await prisma.task.findMany({
        where: {
          project: { userId: req.userId },
          completada: false
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, titulo: true, prioridad: true }
      });

      userContext = {
        projects,
        recentTasks
      };
    }

    // Procesar comando con IA
    const actions = await processNaturalLanguage(command, userContext);

    // Si autoExecute es true, ejecutar las acciones
    let results = null;
    if (autoExecute) {
      results = await executeAIActions(actions, req.userId!, prisma);
    }

    res.json({
      command,
      actions,
      ...(results && { results }),
      autoExecuted: autoExecute
    });
  } catch (error) {
    console.error('Error en processCommand:', error);
    res.status(500).json({ error: 'Error al procesar comando' });
  }
};

export const executeActions = async (req: AuthRequest, res: Response) => {
  try {
    const { actions } = req.body;

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Las acciones son requeridas' });
    }

    const results = await executeAIActions(actions, req.userId!, prisma);

    res.json({ results });
  } catch (error) {
    console.error('Error en executeActions:', error);
    res.status(500).json({ error: 'Error al ejecutar acciones' });
  }
};

