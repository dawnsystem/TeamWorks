import { Router } from 'express';
import {
  getLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel
} from '../controllers/labelController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getLabels);
router.get('/:id', getLabel);
router.post('/', createLabel);
router.patch('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;

