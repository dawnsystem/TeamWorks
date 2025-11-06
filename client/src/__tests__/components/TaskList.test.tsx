import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/testUtils';
import TaskList from '@/components/TaskList';
import { mockTasks, mockTask } from '../mocks/mockData';

describe('TaskList', () => {
  describe('Rendering', () => {
    it('renders all tasks in the list', () => {
      render(<TaskList tasks={mockTasks} />);
      
      mockTasks.forEach(task => {
        expect(screen.getByText(task.titulo)).toBeInTheDocument();
      });
    });

    it('shows loading skeletons when loading', () => {
      render(<TaskList tasks={[]} loading={true} />);
      
      // Should show 3 skeleton loaders
      const skeletons = screen.getAllByTestId('task-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('displays empty state when no tasks', () => {
      render(<TaskList tasks={[]} />);
      
      expect(screen.getByText(/no hay tareas/i)).toBeInTheDocument();
    });

    it('shows custom empty message when provided', () => {
      const customMessage = 'No tasks found for this filter';
      render(<TaskList tasks={[]} emptyMessage={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Empty State Interactions', () => {
    it('shows create task button in empty state for writers', () => {
      render(<TaskList tasks={[]} projectRole="owner" />);
      
      const createButton = screen.getByRole('button', { name: /crear/i });
      expect(createButton).toBeInTheDocument();
    });

    it('hides create task button in empty state for viewers', () => {
      render(<TaskList tasks={[]} projectRole="viewer" />);
      
      const createButton = screen.queryByRole('button', { name: /crear/i });
      expect(createButton).not.toBeInTheDocument();
    });

    it('opens task editor when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={[]} projectRole="owner" />);
      
      const createButton = screen.getByRole('button', { name: /crear/i });
      await user.click(createButton);
      
      // Task editor modal should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    it('renders tasks with proper spacing', () => {
      render(<TaskList tasks={mockTasks} />);
      
      const taskList = screen.getByRole('list');
      expect(taskList).toHaveClass('space-y-3');
    });

    it('passes project role to each task item', () => {
      render(<TaskList tasks={[mockTask]} projectRole="editor" />);
      
      // Each task should respect the role permissions
      const taskItem = screen.getByText(mockTask.titulo).closest('[data-task-role]');
      expect(taskItem).toHaveAttribute('data-task-role', 'editor');
    });
  });

  describe('Loading States', () => {
    it('does not show tasks while loading', () => {
      render(<TaskList tasks={mockTasks} loading={true} />);
      
      mockTasks.forEach(task => {
        expect(screen.queryByText(task.titulo)).not.toBeInTheDocument();
      });
    });

    it('transitions from loading to showing tasks', () => {
      const { rerender } = render(<TaskList tasks={[]} loading={true} />);
      
      expect(screen.getAllByTestId('task-skeleton')).toHaveLength(3);
      
      rerender(<TaskList tasks={mockTasks} loading={false} />);
      
      expect(screen.queryByTestId('task-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText(mockTasks[0].titulo)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single task correctly', () => {
      render(<TaskList tasks={[mockTask]} />);
      
      expect(screen.getByText(mockTask.titulo)).toBeInTheDocument();
      expect(screen.queryByText(/no hay tareas/i)).not.toBeInTheDocument();
    });

    it('handles undefined project role', () => {
      render(<TaskList tasks={mockTasks} />);
      
      // Should render without errors with undefined role
      expect(screen.getByText(mockTasks[0].titulo)).toBeInTheDocument();
    });
  });
});
