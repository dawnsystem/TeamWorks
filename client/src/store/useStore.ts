import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ViewType, ProjectViewMode } from '@/types';

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
  projectViewMode: ProjectViewMode;
  setCurrentView: (view: ViewType, id?: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setProjectViewMode: (mode: ProjectViewMode) => void;
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

export type AIMode = 'ASK' | 'PLAN' | 'AGENT';
export type AIViewType = 'modal' | 'sidebar';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  mode: AIMode;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIState {
  isOpen: boolean;
  autoExecute: boolean;
  mode: AIMode;
  viewType: AIViewType;
  isPinned: boolean;
  currentConversationId: string | null;
  conversations: Conversation[];
  customInstructions: string;
  toggleAI: () => void;
  setAutoExecute: (value: boolean) => void;
  setMode: (mode: AIMode) => void;
  setViewType: (viewType: AIViewType) => void;
  togglePin: () => void;
  setCustomInstructions: (instructions: string) => void;
  createConversation: (mode: AIMode) => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: ConversationMessage) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
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
      currentView: 'inbox' as ViewType,
      currentProjectId: null,
      currentLabelId: null,
      sidebarOpen: true,
      darkMode: false,
      projectViewMode: 'list' as ProjectViewMode,
      setCurrentView: (view, id) =>
        set({
          currentView: view,
          currentProjectId: view === 'project' ? id || null : null,
          currentLabelId: view === 'label' ? id || null : null,
        }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: newDarkMode };
      }),
      setProjectViewMode: (mode) => set({ projectViewMode: mode }),
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
    (set, get) => ({
      isOpen: false,
      autoExecute: false,
      mode: 'ASK',
      viewType: 'modal',
      isPinned: false,
      currentConversationId: null,
      conversations: [],
      customInstructions: '',
      toggleAI: () => set((state) => ({ isOpen: !state.isOpen })),
      setAutoExecute: (value) => set({ autoExecute: value }),
      setMode: (mode) => set({ mode }),
      setViewType: (viewType) => set({ viewType }),
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      setCustomInstructions: (instructions) => set({ customInstructions: instructions }),
      createConversation: (mode) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const conversation: Conversation = {
          id,
          title: `Nueva conversación ${mode}`,
          mode,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
        }));
        return id;
      },
      setCurrentConversation: (id) => set({ currentConversationId: id }),
      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: Date.now(),
                  // Update title from first user message if title is default
                  title: conv.messages.length === 0 && message.role === 'user'
                    ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));
      },
      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, ...updates, updatedAt: Date.now() }
              : conv
          ),
        }));
      },
      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },
      clearAllConversations: () => set({ conversations: [], currentConversationId: null }),
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

interface SettingsState {
  apiUrl: string;
  geminiApiKey: string;
  groqApiKey: string;
  aiProvider: 'groq' | 'gemini';
  theme: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
  };
  setApiUrl: (url: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  setAiProvider: (provider: 'groq' | 'gemini') => void;
  setTheme: (theme: Partial<SettingsState['theme']>) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  apiUrl: 'http://localhost:3000/api',
  geminiApiKey: '',
  groqApiKey: '',
  aiProvider: 'groq' as const,
  theme: {
    primaryColor: '#dc2626', // red-600
    accentColor: '#ec4899', // pink-500
    logoUrl: '',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setApiUrl: (url) => set({ apiUrl: url }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setTheme: (theme) => set((state) => ({ theme: { ...state.theme, ...theme } })),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
    }
  )
);

// Store for task relationship popup
interface TaskRelationshipState {
  isOpen: boolean;
  parentTaskId: string | null;
  completedSubTaskTitle: string | null;
  openPopup: (parentTaskId: string, completedSubTaskTitle: string) => void;
  closePopup: () => void;
}

export const useTaskRelationshipStore = create<TaskRelationshipState>()((set) => ({
  isOpen: false,
  parentTaskId: null,
  completedSubTaskTitle: null,
  openPopup: (parentTaskId, completedSubTaskTitle) => 
    set({ isOpen: true, parentTaskId, completedSubTaskTitle }),
  closePopup: () => 
    set({ isOpen: false, parentTaskId: null, completedSubTaskTitle: null }),
}));

// Command Palette Store
interface CommandPaletteState {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  isOpen: false,
  openPalette: () => set({ isOpen: true }),
  closePalette: () => set({ isOpen: false }),
  togglePalette: () => set((state) => ({ isOpen: !state.isOpen })),
}));

