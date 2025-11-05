import { fetchCommentsByTask, createComment, updateComment, deleteComment } from '../services/commentDomainService';

const prismaMock = () => ({
  tasks: {
    findFirst: jest.fn(),
  },
  comments: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
});

describe('commentDomainService', () => {
  const userId = 'user-1';
  const taskId = 'task-1';

  describe('fetchCommentsByTask', () => {
    it('devuelve null si la tarea no pertenece al usuario', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await fetchCommentsByTask(prisma as any, taskId, userId);

      expect(result).toBeNull();
      expect(prisma.comments.findMany).not.toHaveBeenCalled();
    });

    it('devuelve comentarios cuando la tarea es válida', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue({ id: taskId });
      prisma.comments.findMany.mockResolvedValue([{ id: 'comment-1' }]);

      const result = await fetchCommentsByTask(prisma as any, taskId, userId);

      expect(result).toEqual([{ id: 'comment-1' }]);
      expect(prisma.comments.findMany).toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('devuelve null cuando la tarea no existe para el usuario', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue(null);

      const result = await createComment(prisma as any, { taskId, userId, contenido: 'Hola' });

      expect(result).toBeNull();
      expect(prisma.comments.create).not.toHaveBeenCalled();
    });

    it('crea un comentario cuando la tarea es válida', async () => {
      const prisma = prismaMock();
      prisma.tasks.findFirst.mockResolvedValue({ id: taskId });
      prisma.comments.create.mockResolvedValue({ id: 'comment-1', contenido: 'Hola' });

      const result = await createComment(prisma as any, { taskId, userId, contenido: 'Hola' });

      expect(prisma.comments.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'comment-1', contenido: 'Hola' });
    });
  });

  describe('updateComment', () => {
    it('devuelve null si no encuentra el comentario', async () => {
      const prisma = prismaMock();
      prisma.comments.findFirst.mockResolvedValue(null);

      const result = await updateComment(prisma as any, {
        commentId: 'comment-1',
        userId,
        contenido: 'Actualizado',
      });

      expect(result).toBeNull();
    });

    it('actualiza el comentario si existe', async () => {
      const prisma = prismaMock();
      prisma.comments.findFirst.mockResolvedValue({ id: 'comment-1' });
      prisma.comments.update.mockResolvedValue({ id: 'comment-1', contenido: 'Actualizado' });

      const result = await updateComment(prisma as any, {
        commentId: 'comment-1',
        userId,
        contenido: 'Actualizado',
      });

      expect(prisma.comments.update).toHaveBeenCalled();
      expect(result).toEqual({ id: 'comment-1', contenido: 'Actualizado' });
    });
  });

  describe('deleteComment', () => {
    it('devuelve null cuando no encuentra el comentario', async () => {
      const prisma = prismaMock();
      prisma.comments.findFirst.mockResolvedValue(null);

      const result = await deleteComment(prisma as any, {
        commentId: 'comment-1',
        userId,
      });

      expect(result).toBeNull();
    });

    it('elimina el comentario cuando existe', async () => {
      const prisma = prismaMock();
      prisma.comments.findFirst.mockResolvedValue({ id: 'comment-1' });
      prisma.comments.delete.mockResolvedValue({ id: 'comment-1' });

      const result = await deleteComment(prisma as any, {
        commentId: 'comment-1',
        userId,
      });

      expect(prisma.comments.delete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
      expect(result).toEqual({ id: 'comment-1' });
    });
  });
});


