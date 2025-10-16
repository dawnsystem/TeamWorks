import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTask
} from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/toggle', toggleTask);

export default router;

