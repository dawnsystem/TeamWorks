export type NotificationType = 
  | 'reminder' 
  | 'comment' 
  | 'task_completed' 
  | 'due_date' 
  | 'mention' 
  | 'ai_action';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  commentId?: string;
  projectId?: string;
  sectionId?: string;
  labelId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  pinned: boolean;
  position?: { x: number; y: number };
  soundEnabled: boolean;
  browserNotifications: boolean;
}
