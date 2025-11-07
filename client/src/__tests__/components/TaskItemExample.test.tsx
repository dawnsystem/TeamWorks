import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../utils/testUtils';
import { mockTask } from '../mocks/mockData';
import TaskItem from '../../components/TaskItem';

// Mock the API
vi.mock('../../lib/api', () => ({
  tasksAPI: {
    toggle: vi.fn().mockResolvedValue({ data: {} }),
    getOne: vi.fn().mockResolvedValue({ data: {} }),
  },
  projectsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
  labelsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock stores
vi.mock('../../store/useStore', () => ({
  useTaskEditorStore: vi.fn(() => ({
    openEditor: vi.fn(),
  })),
  useTaskDetailStore: vi.fn(() => ({
    openDetail: vi.fn(),
  })),
  useTaskRelationshipStore: vi.fn(() => ({
    openPopup: vi.fn(),
  })),
}));

// Mock hooks
vi.mock('../../hooks/useContextMenu', () => ({
  useContextMenu: vi.fn(() => ({
    x: 0,
    y: 0,
    isOpen: false,
    openMenu: vi.fn(),
    closeMenu: vi.fn(),
  })),
}));

describe('TaskItem Component - Phase F1 Example', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title correctly', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('displays task description when available', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('A test task description')).toBeInTheDocument();
  });

  it('shows priority badge correctly', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('P2')).toBeInTheDocument();
  });

  it('shows project name', () => {
    render(<TaskItem task={mockTask} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders successfully with minimal props', () => {
    const { container } = render(<TaskItem task={mockTask} />);
    expect(container).toBeInTheDocument();
  });
});
