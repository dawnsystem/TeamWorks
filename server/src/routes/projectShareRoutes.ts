import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  getShares,
  upsertShare,
  removeShare,
  getProjectAccessInfo,
} from '../controllers/projectShareController';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const shareSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['viewer', 'editor', 'manager']),
});

router.use(authMiddleware);

router.get('/:projectId/access', getProjectAccessInfo);
router.get('/:projectId/shares', getShares);
router.post('/:projectId/shares', validateBody(shareSchema), upsertShare);
router.delete('/:projectId/shares/:shareId', removeShare);

export default router;

