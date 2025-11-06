// API mocks for testing
import { vi } from 'vitest';
import { mockTask, mockTasks, mockProject, mockProjects, mockLabel, mockLabels, mockUser } from './mockData';

// Mock API responses
export const mockApiResponses = {
  // Tasks
  getTasks: vi.fn().mockResolvedValue({ data: mockTasks }),
  getTask: vi.fn().mockResolvedValue({ data: mockTask }),
  createTask: vi.fn().mockResolvedValue({ data: mockTask }),
  updateTask: vi.fn().mockResolvedValue({ data: mockTask }),
  deleteTask: vi.fn().mockResolvedValue({ data: { message: 'Task deleted' } }),
  
  // Projects
  getProjects: vi.fn().mockResolvedValue({ data: mockProjects }),
  getProject: vi.fn().mockResolvedValue({ data: mockProject }),
  createProject: vi.fn().mockResolvedValue({ data: mockProject }),
  updateProject: vi.fn().mockResolvedValue({ data: mockProject }),
  deleteProject: vi.fn().mockResolvedValue({ data: { message: 'Project deleted' } }),
  
  // Labels
  getLabels: vi.fn().mockResolvedValue({ data: mockLabels }),
  getLabel: vi.fn().mockResolvedValue({ data: mockLabel }),
  createLabel: vi.fn().mockResolvedValue({ data: mockLabel }),
  updateLabel: vi.fn().mockResolvedValue({ data: mockLabel }),
  deleteLabel: vi.fn().mockResolvedValue({ data: { message: 'Label deleted' } }),
  
  // Auth
  login: vi.fn().mockResolvedValue({ data: { user: mockUser, token: 'mock-token' } }),
  register: vi.fn().mockResolvedValue({ data: { user: mockUser, token: 'mock-token' } }),
  getMe: vi.fn().mockResolvedValue({ data: mockUser }),
};

// Reset all mocks
export const resetApiMocks = () => {
  Object.values(mockApiResponses).forEach(mock => mock.mockClear());
};

// Mock axios
export const createMockAxios = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  create: vi.fn().mockReturnThis(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
});
