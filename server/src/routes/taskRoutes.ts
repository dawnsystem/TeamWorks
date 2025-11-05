import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  getTasksByLabel,
  reorderTasks,
} from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema } from '../validation/schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getTasks);
router.get('/by-label/:labelId', getTasksByLabel);
router.get('/:id', getTask);
router.post('/', validateBody(createTaskSchema), createTask);
router.post('/reorder', validateBody(reorderTasksSchema), reorderTasks);
router.patch('/:id', validateBody(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/toggle', toggleTask);

export default router;

