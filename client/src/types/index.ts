export interface User {
  id: string;
  email: string;
  nombre: string;
  createdAt: string;
  updatedAt: string;
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
  createdBy: string; // User ID of the creator
  createdAt: string;
  updatedAt: string;
  labels?: TaskLabel[];
  subTasks?: Task[];
  parentTask?: Task;
  comments?: Comment[];
  reminders?: Reminder[];
  automationNotes?: string[];
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

export interface TaskTemplate {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: 1 | 2 | 3 | 4;
  userId: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubscription {
  id: string;
  taskId: string;
  userId: string;
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
  providerUsed: string;
  fallback?: boolean;
  message?: string;
  raw?: string;
}

export interface AIPlanTask {
  title: string;
  description?: string;
  priority?: number;
  dueInDays?: number;
  dependencies?: string[];
}

export interface AIPlanPhase {
  title: string;
  description?: string;
  duration?: string;
  tasks: AIPlanTask[];
}

export interface AIPlan {
  goal: string;
  summary: string;
  assumptions?: string[];
  timeline?: string[];
  phases: AIPlanPhase[];
}

export interface AIPlannerQuestionsResponse {
  status: 'questions';
  questions: string[];
  providerUsed: string;
}

export interface AIPlannerPlanResponse {
  status: 'plan';
  plan: AIPlan;
  providerUsed: string;
  notes?: string[];
}

export type AIPlannerResponse = AIPlannerQuestionsResponse | AIPlannerPlanResponse;

export type ViewType = 'inbox' | 'today' | 'week' | 'project' | 'label';

export type ProjectViewMode = 'list' | 'board';

export interface TaskFilters {
  projectId?: string;
  sectionId?: string;
  labelId?: string;
  filter?: 'today' | 'week' | 'completed' | 'pending';
  search?: string;
}

