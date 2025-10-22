import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { processNaturalLanguage, executeAIActions } from '../services/aiService';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const processCommand = async (req: any, res: Response) => {
  try {
    const { command, autoExecute = false, context } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'El comando es requerido' });
    }

    // Obtener contexto del usuario si no se proporciona
    let userContext = context;
    if (!userContext) {
      const projects = await prisma.project.findMany({
        where: { userId: (req as AuthRequest).userId },
        select: { id: true, nombre: true }
      });

      const recentTasks = await prisma.task.findMany({
        where: {
          project: { userId: (req as AuthRequest).userId },
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
      results = await executeAIActions(actions, (req as AuthRequest).userId!, prisma);
      
      // Crear notificación de resumen si se ejecutaron acciones
      if (results && results.length > 0) {
        const successCount = results.filter((r: any) => r.success).length;
        await notificationService.create({
          userId: (req as AuthRequest).userId!,
          type: 'ai_action',
          title: '🤖 Acciones de IA completadas',
          message: `Se ejecutaron ${successCount} de ${results.length} acciones exitosamente`,
          metadata: {
            command,
            actionsCount: results.length,
            successCount,
            results,
          },
        });
      }
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

export const executeActions = async (req: any, res: Response) => {
  try {
    const { actions } = req.body;

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Las acciones son requeridas' });
    }

    const results = await executeAIActions(actions, (req as AuthRequest).userId!, prisma);
    
    // Crear notificación de resumen
    if (results && results.length > 0) {
      const successCount = results.filter((r: any) => r.success).length;
      await notificationService.create({
        userId: (req as AuthRequest).userId!,
        type: 'ai_action',
        title: '🤖 Acciones de IA completadas',
        message: `Se ejecutaron ${successCount} de ${results.length} acciones exitosamente`,
        metadata: {
          actionsCount: results.length,
          successCount,
          results,
        },
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Error en executeActions:', error);
    res.status(500).json({ error: 'Error al ejecutar acciones' });
  }
};

