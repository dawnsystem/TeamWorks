import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createProjectSchema, updateProjectSchema, createSectionSchema, updateSectionSchema } from '../validation/schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de proyectos
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', validateBody(createProjectSchema), createProject);
router.patch('/:id', validateBody(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

// Rutas de secciones
router.post('/:projectId/sections', validateBody(createSectionSchema), createSection);
router.patch('/sections/:id', validateBody(updateSectionSchema), updateSection);
router.delete('/sections/:id', deleteSection);

export default router;

