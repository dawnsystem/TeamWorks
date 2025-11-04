type TaskSummary = {
  id: string;
  titulo: string;
  projectId: string;
};

type CommentSummary = {
  id: string;
  contenido: string;
};

type ProjectSummary = {
  id: string;
  nombre: string;
};

type RawNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId: string | null;
  commentId: string | null;
  projectId: string | null;
  sectionId: string | null;
  labelId: string | null;
  metadata: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  tasks?: TaskSummary | null;
  comments?: CommentSummary | null;
  projects?: ProjectSummary | null;
};

export function toClientNotification(notification: RawNotification | null | undefined) {
  if (!notification) return notification;

  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    taskId: notification.taskId ?? undefined,
    commentId: notification.commentId ?? undefined,
    projectId: notification.projectId ?? undefined,
    sectionId: notification.sectionId ?? undefined,
    labelId: notification.labelId ?? undefined,
    metadata: notification.metadata ?? undefined,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
    task: notification.tasks
      ? {
          id: notification.tasks.id,
          titulo: notification.tasks.titulo,
          projectId: notification.tasks.projectId,
        }
      : undefined,
    comment: notification.comments
      ? {
          id: notification.comments.id,
          contenido: notification.comments.contenido,
        }
      : undefined,
    project: notification.projects
      ? {
          id: notification.projects.id,
          nombre: notification.projects.nombre,
        }
      : undefined,
  };
}

export const notificationFactory = {
  toClientNotification,
};


