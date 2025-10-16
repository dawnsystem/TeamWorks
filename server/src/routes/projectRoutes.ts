import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createSection,
  updateSection,
  deleteSection
} from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de proyectos
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

// Rutas de secciones
router.post('/:projectId/sections', createSection);
router.patch('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

export default router;

