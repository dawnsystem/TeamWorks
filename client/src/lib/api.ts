import axios from 'axios';
import type {
  User,
  Project,
  Task,
  Label,
  AIAction,
  TaskFilters,
  Comment,
  Reminder,
  TaskTemplate,
  ProjectShare,
} from '@/types';
import { useAuthStore } from '@/store/useStore';

// Function to get API URL from settings or environment
export const getApiUrl = () => {
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

// Function to get available API URLs (for auto-detection)
export const getAvailableApiUrls = () => {
  const urls = [
    'http://localhost:3000/api',
    'http://192.168.0.165:3000/api',
    'http://davidhp.tail1c095e.ts.net:3000/api',
  ];
  
  // Add from environment if available
  if (import.meta.env.VITE_API_URL && !urls.includes(import.meta.env.VITE_API_URL)) {
    urls.unshift(import.meta.env.VITE_API_URL);
  }
  
  return urls;
};

// Function to test API connectivity
export const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    // Try to hit the health endpoint first
    const healthUrl = url.replace(/\/api\/?$/, '') + '/health';
    const response = await axios.get(healthUrl, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 
    });
    if (response.status === 200) {
      return true;
    }
  } catch (error: any) {
    // If health endpoint doesn't exist or fails, try the API endpoint
    try {
      await axios.get(url, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 
      });
      return true; // If we get any response (even 401), the server is up
    } catch (e: any) {
      // Log more detailed error information
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED') {
        console.log(`❌ No se pudo conectar a: ${url} (servidor no responde)`);
      } else if (e.code === 'ECONNABORTED') {
        console.log(`❌ Timeout al conectar a: ${url}`);
      } else {
        console.log(`❌ No se pudo conectar a: ${url} (${e.message || 'error desconocido'})`);
      }
      return false;
    }
  }
  return false;
};

// Function to auto-detect best API URL
export const autoDetectApiUrl = async (): Promise<string | null> => {
  const urls = getAvailableApiUrls();
  console.log('🔍 Buscando servidor API en:', urls);
  
  for (const url of urls) {
    console.log(`⏳ Probando: ${url}...`);
    const isAvailable = await testApiConnection(url);
    if (isAvailable) {
      console.log(`✅ API disponible en: ${url}`);
      return url;
    }
  }
  
  console.error('❌ No se pudo conectar a ninguna URL de API');
  return null;
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

// Interceptor para agregar token y API keys a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add AI API keys from settings if available
  const settingsStorage = localStorage.getItem('settings-storage');
  if (settingsStorage) {
    try {
      const settings = JSON.parse(settingsStorage);
      if (settings.state?.groqApiKey) {
        config.headers['X-Groq-Api-Key'] = settings.state.groqApiKey;
      }
      if (settings.state?.geminiApiKey) {
        config.headers['X-Gemini-Api-Key'] = settings.state.geminiApiKey;
      }
    } catch (e) {
      // Log generic error without exposing sensitive details
      console.warn('Failed to parse settings storage for API keys');
    }
  }
  
  return config;
});

// Variable para prevenir múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  
  failedQueue = [];
};

// Interceptor para manejar errores de autenticación y renovación de tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es un error 401 y no hemos intentado refrescar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Evitar refresh en peticiones de login/register/refresh
      const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/refresh');
      
      if (isAuthRequest) {
        return Promise.reject(error);
      }
      
      // Si ya estamos refrescando, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No hay refresh token, hacer logout
        isRefreshing = false;
        useAuthStore.getState().logout();
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
      
      try {
        // Intentar renovar el token
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Guardar los nuevos tokens en localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Actualizar el estado del auth store para mantener consistencia
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.setState({ 
            token: accessToken, 
            refreshToken: newRefreshToken 
          });
        }
        
        // Actualizar el header de la petición original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Procesar la cola de peticiones que esperaban
        processQueue(null);
        isRefreshing = false;
        
        // Reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, hacer logout
        processQueue(refreshError);
        isRefreshing = false;
        
        useAuthStore.getState().logout();
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.replace('/login');
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; nombre: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', data),
  
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
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

export const projectSharesAPI = {
  getAccess: (projectId: string) => api.get<{ role: string }>(`/projects/${projectId}/access`),
  list: (projectId: string) => api.get<ProjectShare[]>(`/projects/${projectId}/shares`),
  upsert: (projectId: string, data: { email: string; role: 'viewer' | 'editor' | 'manager' }) =>
    api.post<ProjectShare[]>(`/projects/${projectId}/shares`, data),
  remove: (projectId: string, shareId: string) => api.delete<ProjectShare[]>(`/projects/${projectId}/shares/${shareId}`),
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
  process: (command: string, autoExecute = false, provider?: string, context?: any) =>
    api.post('/ai/process', { command, autoExecute, provider, context }),
  
  execute: (actions: AIAction[]) =>
    api.post('/ai/execute', { actions }),
  
  planner: (payload: { goal: string; mode: 'auto' | 'interactive'; answers?: string[]; provider?: string; context?: any; }) =>
    api.post('/ai/planner', payload),
  
  unified: (payload: {
    message: string;
    mode: 'ASK' | 'PLAN' | 'AGENT';
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    conversationId?: string;
    autoExecute?: boolean;
    provider?: string;
    context?: any;
  }) =>
    api.post('/ai/unified', payload),
  
  agent: (payload: {
    message: string;
    conversationId?: string;
    conversationHistory?: Array<{ role: 'user' | 'agent'; content: string }>;
    provider?: string;
    context?: any;
  }) =>
    api.post('/ai/agent', payload),
};

export default api;

