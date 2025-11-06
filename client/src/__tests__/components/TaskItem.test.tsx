import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/testUtils';
import TaskItem from '@/components/TaskItem';
import { mockTask, mockHighPriorityTask, mockCompletedTask } from '../mocks/mockData';
import * as api from '@/lib/api';

vi.mock('@/lib/api');

describe('TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders task with all information', () => {
      render(<TaskItem task={mockTask} />);
      
      expect(screen.getByText(mockTask.titulo)).toBeInTheDocument();
      if (mockTask.descripcion) {
        expect(screen.getByText(mockTask.descripcion)).toBeInTheDocument();
      }
    });

    it('displays task priority correctly', () => {
      render(<TaskItem task={mockHighPriorityTask} />);
      
      const priorityElement = screen.getByText(/P1/i);
      expect(priorityElement).toBeInTheDocument();
    });

    it('shows completed state for completed tasks', () => {
      render(<TaskItem task={mockCompletedTask} />);
      
      // Check for completed checkbox/icon
      const completedIcon = screen.getByRole('checkbox', { checked: true });
      expect(completedIcon).toBeInTheDocument();
    });

    it('renders task labels when present', () => {
      const taskWithLabels = {
        ...mockTask,
        labels: [{ id: 'label-1', name: 'Important', color: '#FF0000', userId: 'user-1' }]
      };
      
      render(<TaskItem task={taskWithLabels} />);
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('displays due date when available', () => {
      const taskWithDate = {
        ...mockTask,
        fechaLimite: new Date('2024-12-31').toISOString()
      };
      
      render(<TaskItem task={taskWithDate} />);
      expect(screen.getByText(/dic/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('opens task detail view when clicked', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} />);
      
      const taskTitle = screen.getByText(mockTask.titulo);
      await user.click(taskTitle);
      
      // Detail view should be triggered
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('toggles task completion when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const toggleMock = vi.fn().mockResolvedValue({ data: { ...mockTask, completada: true } });
      vi.spyOn(api.tasksAPI, 'toggle').mockImplementation(toggleMock);
      
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(toggleMock).toHaveBeenCalledWith(mockTask.id);
      });
    });

    it('opens context menu on right click', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} />);
      
      const taskElement = screen.getByText(mockTask.titulo);
      await user.pointer({ keys: '[MouseRight>]', target: taskElement });
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('opens task editor when edit is triggered', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} role="owner" />);
      
      // Open context menu first
      const taskElement = screen.getByText(mockTask.titulo);
      await user.pointer({ keys: '[MouseRight>]', target: taskElement });
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      const editButton = screen.getByText(/editar/i);
      await user.click(editButton);
      
      // Editor should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions', () => {
    it('shows edit controls for owner role', () => {
      render(<TaskItem task={mockTask} role="owner" />);
      
      // Should be able to see drag handle
      const dragHandle = screen.queryByTestId('drag-handle');
      expect(dragHandle).toBeInTheDocument();
    });

    it('hides edit controls for viewer role', () => {
      render(<TaskItem task={mockTask} role="viewer" />);
      
      // Should not see drag handle for viewers
      const dragHandle = screen.queryByTestId('drag-handle');
      expect(dragHandle).not.toBeInTheDocument();
    });

    it('allows task completion for editor role', async () => {
      const user = userEvent.setup();
      const toggleMock = vi.fn().mockResolvedValue({ data: { ...mockTask, completada: true } });
      vi.spyOn(api.tasksAPI, 'toggle').mockImplementation(toggleMock);
      
      render(<TaskItem task={mockTask} role="editor" />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(toggleMock).toHaveBeenCalled();
      });
    });
  });

  describe('Subtasks', () => {
    it('displays subtask count when subtasks exist', () => {
      const taskWithSubtasks = {
        ...mockTask,
        subTasks: [
          { ...mockTask, id: 'subtask-1', titulo: 'Subtask 1', parentTaskId: mockTask.id },
          { ...mockTask, id: 'subtask-2', titulo: 'Subtask 2', parentTaskId: mockTask.id }
        ]
      };
      
      render(<TaskItem task={taskWithSubtasks} />);
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    it('expands subtasks when toggle is clicked', async () => {
      const user = userEvent.setup();
      const taskWithSubtasks = {
        ...mockTask,
        subTasks: [
          { ...mockTask, id: 'subtask-1', titulo: 'Subtask 1', parentTaskId: mockTask.id }
        ]
      };
      
      render(<TaskItem task={taskWithSubtasks} />);
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when task toggle fails', async () => {
      const user = userEvent.setup();
      const toggleMock = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.spyOn(api.tasksAPI, 'toggle').mockImplementation(toggleMock);
      
      render(<TaskItem task={mockTask} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
