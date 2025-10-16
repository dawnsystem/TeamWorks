import express from 'express';
import {
  getRemindersByTask,
  createReminder,
  deleteReminder,
} from '../controllers/reminderController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tasks/:taskId/reminders
router.get('/tasks/:taskId/reminders', getRemindersByTask);

// POST /api/tasks/:taskId/reminders
router.post('/tasks/:taskId/reminders', createReminder);

// DELETE /api/reminders/:id
router.delete('/reminders/:id', deleteReminder);

export default router;

