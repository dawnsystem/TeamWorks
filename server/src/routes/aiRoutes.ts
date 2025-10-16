import { Router } from 'express';
import { processCommand, executeActions } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.post('/process', processCommand);
router.post('/execute', executeActions);

export default router;

