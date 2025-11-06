// Mock data for testing
import { Task, Project, Label, User, Comment, Section } from '../../types';

export const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  nombre: 'Test User',
  avatar: null,
  rol: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockProject: Project = {
  id: 'project-1',
  nombre: 'Test Project',
  descripcion: 'A test project',
  color: '#3b82f6',
  icono: '📋',
  userId: 'user-1',
  orden: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockLabel: Label = {
  id: 'label-1',
  nombre: 'Test Label',
  color: '#ef4444',
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockSection: Section = {
  id: 'section-1',
  nombre: 'Test Section',
  projectId: 'project-1',
  orden: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTask: Task = {
  id: 'task-1',
  titulo: 'Test Task',
  descripcion: 'A test task description',
  completada: false,
  prioridad: 'P2',
  fechaVencimiento: new Date('2024-12-31'),
  projectId: 'project-1',
  sectionId: null,
  parentTaskId: null,
  userId: 'user-1',
  createdBy: 'user-1',
  orden: 0,
  estimatedTime: null,
  actualTime: null,
  tags: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  project: mockProject,
  labels: [],
  subtasks: [],
};

export const mockCompletedTask: Task = {
  ...mockTask,
  id: 'task-2',
  titulo: 'Completed Task',
  completada: true,
};

export const mockHighPriorityTask: Task = {
  ...mockTask,
  id: 'task-3',
  titulo: 'High Priority Task',
  prioridad: 'P1',
  fechaVencimiento: new Date(Date.now() + 86400000), // Tomorrow
};

export const mockComment: Comment = {
  id: 'comment-1',
  contenido: 'This is a test comment',
  taskId: 'task-1',
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
};

export const mockTasks: Task[] = [
  mockTask,
  mockCompletedTask,
  mockHighPriorityTask,
];

export const mockProjects: Project[] = [
  mockProject,
  {
    ...mockProject,
    id: 'project-2',
    nombre: 'Second Project',
    color: '#10b981',
    icono: '🎯',
  },
];

export const mockLabels: Label[] = [
  mockLabel,
  {
    ...mockLabel,
    id: 'label-2',
    nombre: 'Urgent',
    color: '#f59e0b',
  },
];
