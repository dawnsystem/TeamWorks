import express from 'express';
import {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tasks/:taskId/comments
router.get('/tasks/:taskId/comments', getCommentsByTask);

// POST /api/tasks/:taskId/comments
router.post('/tasks/:taskId/comments', createComment);

// PATCH /api/comments/:id
router.patch('/comments/:id', updateComment);

// DELETE /api/comments/:id
router.delete('/comments/:id', deleteComment);

export default router;

