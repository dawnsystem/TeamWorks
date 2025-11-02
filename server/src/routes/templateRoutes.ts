import express from 'express';
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
} from '../controllers/templateController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createTemplateSchema, updateTemplateSchema, applyTemplateSchema } from '../validation/schemas';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Template CRUD routes
router.get('/', getAllTemplates);
router.get('/:id', getTemplate);
router.post('/', validateBody(createTemplateSchema), createTemplate);
router.put('/:id', validateBody(updateTemplateSchema), updateTemplate);
router.delete('/:id', deleteTemplate);

// Apply template (create task from template)
router.post('/:id/apply', validateBody(applyTemplateSchema), applyTemplate);

export default router;
