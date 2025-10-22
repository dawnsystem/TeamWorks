import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  subscribeToTask,
  unsubscribeFromTask,
  checkSubscription,
  getUserSubscriptions,
} from '../controllers/taskSubscriptionController';

const router = Router();

// All routes require authentication
router.use(auth);

// Subscribe to a task
router.post('/tasks/:taskId/subscribe', subscribeToTask);

// Unsubscribe from a task
router.delete('/tasks/:taskId/subscribe', unsubscribeFromTask);

// Check subscription status
router.get('/tasks/:taskId/subscription', checkSubscription);

// Get user's subscriptions
router.get('/subscriptions', getUserSubscriptions);

export default router;
