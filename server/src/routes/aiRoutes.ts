import { Router } from 'express';
import { processCommand, executeActions, generatePlan } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { aiProcessSchema, aiExecuteSchema, aiPlannerSchema } from '../validation/schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.post('/process', validateBody(aiProcessSchema), processCommand);
router.post('/execute', validateBody(aiExecuteSchema), executeActions);
router.post('/planner', validateBody(aiPlannerSchema), generatePlan);

export default router;

