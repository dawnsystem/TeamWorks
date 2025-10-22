import { Router } from 'express';
import { sseConnection, sseStats } from '../controllers/sseController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Endpoint para establecer conexión SSE
router.get('/events', sseConnection);

// Endpoint para obtener estadísticas (desarrollo/admin)
router.get('/stats', sseStats);

export default router;
