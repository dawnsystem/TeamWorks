import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskSubscriptionService } from '../services/taskSubscriptionService';

// POST /api/tasks/:taskId/subscribe
export const subscribeToTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { taskId } = req.params;

    const subscription = await taskSubscriptionService.subscribe(taskId, userId);

    res.status(201).json({
      message: 'Subscribed to task successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error en subscribeToTask:', error);
    res.status(500).json({ error: 'Error al suscribirse a la tarea' });
  }
};

// DELETE /api/tasks/:taskId/subscribe
export const unsubscribeFromTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { taskId } = req.params;

    await taskSubscriptionService.unsubscribe(taskId, userId);

    res.json({ message: 'Unsubscribed from task successfully' });
  } catch (error) {
    console.error('Error en unsubscribeFromTask:', error);
    res.status(500).json({ error: 'Error al desuscribirse de la tarea' });
  }
};

// GET /api/tasks/:taskId/subscription
export const checkSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { taskId } = req.params;

    const isSubscribed = await taskSubscriptionService.isSubscribed(taskId, userId);

    res.json({ subscribed: isSubscribed });
  } catch (error) {
    console.error('Error en checkSubscription:', error);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
};

// GET /api/subscriptions
export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const subscriptions = await taskSubscriptionService.getUserSubscriptions(userId);

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error en getUserSubscriptions:', error);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
};
