import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { processNaturalLanguage, executeAIActions } from '../services/aiService';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const processCommand = async (req: any, res: Response) => {
  try {
    const { command, autoExecute = false, context, provider } = req.body;

    // Validación de formato ya realizada por middleware

    // Obtener contexto del usuario si no se proporciona
    let userContext = context;
    if (!userContext) {
      const projects = await prisma.projects.findMany({
        where: { userId: (req as AuthRequest).userId },
        select: { id: true, nombre: true }
      });

      const recentTasks = await prisma.tasks.findMany({
        where: {
          projects: { userId: (req as AuthRequest).userId },
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
    const actions = await processNaturalLanguage(command, userContext, provider);

    // Si autoExecute es true, ejecutar las acciones
    let results = null;
    if (autoExecute) {
      results = await executeAIActions(actions, (req as AuthRequest).userId!, prisma);
      
      // No crear notificación para acciones propias del usuario
      // El usuario ya ve el resultado directo de sus acciones en la UI
    }

    res.json({
      command,
      actions,
      ...(results && { results }),
      autoExecuted: autoExecute
    });
  } catch (error: any) {
    console.error('Error en processCommand:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar comando';
    const status = /no está configurada|no soportado/i.test(message) ? 400 : 500;
    res.status(status).json({ error: message });
  }
};

export const executeActions = async (req: any, res: Response) => {
  try {
    const { actions } = req.body;

    // Validación de formato ya realizada por middleware

    const results = await executeAIActions(actions, (req as AuthRequest).userId!, prisma);
    
    // No crear notificación para acciones propias del usuario
    // El usuario ya ve el resultado directo de sus acciones en la UI

    res.json({ results });
  } catch (error) {
    console.error('Error en executeActions:', error);
    res.status(500).json({ error: 'Error al ejecutar acciones' });
  }
};

