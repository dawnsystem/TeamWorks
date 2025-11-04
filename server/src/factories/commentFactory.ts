type UserSummary = {
  id: string;
  nombre: string;
  email: string;
};

type RawComment = {
  id: string;
  contenido: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  users?: UserSummary | null;
};

export function toClientComment(comment: RawComment | null | undefined) {
  if (!comment) return comment;

  return {
    id: comment.id,
    contenido: comment.contenido,
    taskId: comment.taskId,
    userId: comment.userId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    user: comment.users
      ? {
          id: comment.users.id,
          nombre: comment.users.nombre,
          email: comment.users.email,
        }
      : undefined,
  };
}

export const commentFactory = {
  toClientComment,
};


