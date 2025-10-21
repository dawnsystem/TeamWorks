import axios from 'axios';
import type { User, Project, Task, Label, AIAction, TaskFilters, Comment, Reminder, TaskTemplate } from '@/types';

// Function to get API URL from settings or environment
const getApiUrl = () => {
  // Try to get from localStorage settings first
  const settingsStorage = localStorage.getItem('settings-storage');
  if (settingsStorage) {
    try {
      const settings = JSON.parse(settingsStorage);
      if (settings.state?.apiUrl) {
        return settings.state.apiUrl;
      }
    } catch (e) {
      console.error('Error parsing settings:', e);
    }
  }
  // Fallback to environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL when settings change
export const updateApiUrl = (url: string) => {
  api.defaults.baseURL = url;
};

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; nombre: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  
  getMe: () => api.get<User>('/auth/me'),
};

// Projects
export const projectsAPI = {
  getAll: () => api.get<Project[]>('/projects'),
  
  getOne: (id: string) => api.get<Project>(`/projects/${id}`),
  
  create: (data: { nombre: string; color?: string; orden?: number }) =>
    api.post<Project>('/projects', data),
  
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data),
  
  delete: (id: string) => api.delete(`/projects/${id}`),
  
  createSection: (projectId: string, data: { nombre: string; orden?: number }) =>
    api.post(`/projects/${projectId}/sections`, data),
  
  updateSection: (id: string, data: { nombre?: string; orden?: number }) =>
    api.patch(`/projects/sections/${id}`, data),
  
  deleteSection: (id: string) => api.delete(`/projects/sections/${id}`),
};

// Tasks
export const tasksAPI = {
  getAll: (filters?: TaskFilters) =>
    api.get<Task[]>('/tasks', { params: filters }),
  
  getOne: (id: string) => api.get<Task>(`/tasks/${id}`),
  
  getByLabel: (labelId: string) => api.get<Task[]>(`/tasks/by-label/${labelId}`),
  
  create: (data: {
    titulo: string;
    descripcion?: string;
    prioridad?: number;
    fechaVencimiento?: string;
    projectId: string;
    sectionId?: string;
    parentTaskId?: string;
    orden?: number;
    labelIds?: string[];
  }) => api.post<Task>('/tasks', data),
  
  update: (id: string, data: Partial<Task> & { labelIds?: string[] }) =>
    api.patch<Task>(`/tasks/${id}`, data),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  toggle: (id: string) => api.post<Task>(`/tasks/${id}/toggle`),
  
  reorder: (taskUpdates: Array<{
    id: string;
    orden: number;
    projectId?: string;
    sectionId?: string | null;
    parentTaskId?: string | null;
  }>) => api.post('/tasks/reorder', { taskUpdates }),
};

// Labels
export const labelsAPI = {
  getAll: () => api.get<Label[]>('/labels'),
  
  getOne: (id: string) => api.get<Label>(`/labels/${id}`),
  
  create: (data: { nombre: string; color?: string }) =>
    api.post<Label>('/labels', data),
  
  update: (id: string, data: Partial<Label>) =>
    api.patch<Label>(`/labels/${id}`, data),
  
  delete: (id: string) => api.delete(`/labels/${id}`),
};

// Comments
export const commentsAPI = {
  getByTask: (taskId: string) => api.get<Comment[]>(`/tasks/${taskId}/comments`),
  
  create: (taskId: string, data: { contenido: string }) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, data),
  
  update: (id: string, data: { contenido: string }) =>
    api.patch<Comment>(`/comments/${id}`, data),
  
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Reminders
export const remindersAPI = {
  getByTask: (taskId: string) => api.get<Reminder[]>(`/tasks/${taskId}/reminders`),
  
  create: (taskId: string, data: { fechaHora: string | Date }) =>
    api.post<Reminder>(`/tasks/${taskId}/reminders`, data),
  
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// Templates
export const templatesAPI = {
  getAll: () => api.get<TaskTemplate[]>('/templates'),
  
  getOne: (id: string) => api.get<TaskTemplate>(`/templates/${id}`),
  
  create: (data: {
    titulo: string;
    descripcion?: string;
    prioridad?: number;
    labelIds?: string[];
  }) => api.post<TaskTemplate>('/templates', data),
  
  update: (id: string, data: Partial<TaskTemplate>) =>
    api.patch<TaskTemplate>(`/templates/${id}`, data),
  
  delete: (id: string) => api.delete(`/templates/${id}`),
  
  apply: (id: string, projectId: string, sectionId?: string) =>
    api.post<Task>(`/templates/${id}/apply`, { projectId, sectionId }),
};

// AI
export const aiAPI = {
  process: (command: string, autoExecute = false, context?: any) =>
    api.post('/ai/process', { command, autoExecute, context }),
  
  execute: (actions: AIAction[]) =>
    api.post('/ai/execute', { actions }),
};

export default api;

