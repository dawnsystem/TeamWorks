export interface User {
  id: string;
  email: string;
  nombre: string;
  createdAt: string;
}

export interface Project {
  id: string;
  nombre: string;
  color: string;
  orden: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
  _count?: {
    tasks: number;
  };
}

export interface Section {
  id: string;
  nombre: string;
  orden: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: 1 | 2 | 3 | 4;
  fechaVencimiento: string | null;
  completada: boolean;
  orden: number;
  projectId: string;
  sectionId: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: TaskLabel[];
  subTasks?: Task[];
  parentTask?: Task;
  comments?: Comment[];
  reminders?: Reminder[];
  _count?: {
    subTasks: number;
    comments: number;
    reminders: number;
  };
}

export interface Label {
  id: string;
  nombre: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  task?: Task;
  label: Label;
}

export interface Comment {
  id: string;
  contenido: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nombre: string;
    email: string;
  };
}

export interface Reminder {
  id: string;
  fechaHora: string;
  taskId: string;
  enviado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIAction {
  type: 'create' | 'update' | 'delete' | 'query' | 'complete' | 'create_bulk';
  entity: 'task' | 'project' | 'label' | 'section' | 'comment' | 'reminder';
  data?: any;
  query?: string;
  confidence: number;
  explanation: string;
}

export interface AIResponse {
  command: string;
  actions: AIAction[];
  results?: any[];
  autoExecuted: boolean;
}

export type ViewType = 'inbox' | 'today' | 'week' | 'project' | 'label';

export type ProjectViewMode = 'list' | 'board';

export interface TaskFilters {
  projectId?: string;
  sectionId?: string;
  labelId?: string;
  filter?: 'today' | 'week' | 'completed' | 'pending';
  search?: string;
}

