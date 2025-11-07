import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  refresh, 
  logout, 
  logoutAll,
  getSessions,
  revokeSession
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '../validation/schemas';

const router = Router();

// Rutas públicas
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Rutas protegidas
router.get('/me', authMiddleware, getMe);
router.post('/logout-all', authMiddleware, logoutAll);
router.get('/sessions', authMiddleware, getSessions);
router.delete('/sessions/:sessionId', authMiddleware, revokeSession);

export default router;

