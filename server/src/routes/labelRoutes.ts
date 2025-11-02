import { Router } from 'express';
import {
  getLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel
} from '../controllers/labelController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createLabelSchema, updateLabelSchema } from '../validation/schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getLabels);
router.get('/:id', getLabel);
router.post('/', validateBody(createLabelSchema), createLabel);
router.patch('/:id', validateBody(updateLabelSchema), updateLabel);
router.delete('/:id', deleteLabel);

export default router;

