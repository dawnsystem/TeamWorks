import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ViewType } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

interface UIState {
  currentView: ViewType;
  currentProjectId: string | null;
  currentLabelId: string | null;
  sidebarOpen: boolean;
  darkMode: boolean;
  setCurrentView: (view: ViewType, id?: string) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

interface TaskEditorState {
  isOpen: boolean;
  taskId: string | null;
  projectId: string | null;
  sectionId: string | null;
  parentTaskId: string | null;
  openEditor: (options?: {
    taskId?: string;
    projectId?: string;
    sectionId?: string;
    parentTaskId?: string;
  }) => void;
  closeEditor: () => void;
}

interface AIState {
  isOpen: boolean;
  autoExecute: boolean;
  toggleAI: () => void;
  setAutoExecute: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentView: 'inbox',
      currentProjectId: null,
      currentLabelId: null,
      sidebarOpen: true,
      darkMode: false,
      setCurrentView: (view, id) =>
        set({
          currentView: view,
          currentProjectId: view === 'project' ? id || null : null,
          currentLabelId: view === 'label' ? id || null : null,
        }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: newDarkMode };
      }),
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);

export const useTaskEditorStore = create<TaskEditorState>()((set) => ({
  isOpen: false,
  taskId: null,
  projectId: null,
  sectionId: null,
  parentTaskId: null,
  openEditor: (options) =>
    set({
      isOpen: true,
      taskId: options?.taskId || null,
      projectId: options?.projectId || null,
      sectionId: options?.sectionId || null,
      parentTaskId: options?.parentTaskId || null,
    }),
  closeEditor: () =>
    set({
      isOpen: false,
      taskId: null,
      projectId: null,
      sectionId: null,
      parentTaskId: null,
    }),
}));

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      isOpen: false,
      autoExecute: false,
      toggleAI: () => set((state) => ({ isOpen: !state.isOpen })),
      setAutoExecute: (value) => set({ autoExecute: value }),
    }),
    {
      name: 'ai-storage',
    }
  )
);

interface TaskDetailState {
  isOpen: boolean;
  taskId: string | null;
  openDetail: (taskId: string) => void;
  closeDetail: () => void;
}

export const useTaskDetailStore = create<TaskDetailState>()((set) => ({
  isOpen: false,
  taskId: null,
  openDetail: (taskId) => set({ isOpen: true, taskId }),
  closeDetail: () => set({ isOpen: false, taskId: null }),
}));

