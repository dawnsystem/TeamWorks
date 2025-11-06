import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../utils/testUtils';
import TaskDetailView from '../../components/TaskDetailView';
import { mockTask, mockUser } from '../mocks/mockData';

// Mock API functions
const mockOnClose = vi.fn();
const mockOnTaskUpdate = vi.fn();
const mockOnTaskDelete = vi.fn();

describe('TaskDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering Tests
  describe('Rendering', () => {
    it('renders task with complete information', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByText(mockTask.title)).toBeInTheDocument();
      expect(screen.getByText(mockTask.description)).toBeInTheDocument();
      expect(screen.getByText('Alta')).toBeInTheDocument(); // Priority
    });

    it('displays task metadata', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      // Check for timestamps and creator
      expect(screen.getByText(/Creado/i)).toBeInTheDocument();
      expect(screen.getByText(/Actualizado/i)).toBeInTheDocument();
    });

    it('shows subtasks section when subtasks exist', () => {
      const taskWithSubtasks = {
        ...mockTask,
        subTasks: [
          { id: 'sub1', title: 'Subtask 1', completed: false },
          { id: 'sub2', title: 'Subtask 2', completed: true },
        ],
      };

      render(
        <TaskDetailView
          task={taskWithSubtasks}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByText(/Subtareas/i)).toBeInTheDocument();
      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      expect(screen.getByText('Subtask 2')).toBeInTheDocument();
    });

    it('renders comments section', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByText(/Comentarios/i)).toBeInTheDocument();
    });

    it('displays action buttons', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Completar/i })).toBeInTheDocument();
    });

    it('shows assignee information when present', () => {
      const taskWithAssignee = {
        ...mockTask,
        assignee: mockUser,
      };

      render(
        <TaskDetailView
          task={taskWithAssignee}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByText(/Asignado a/i)).toBeInTheDocument();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });
  });

  // User Interaction Tests
  describe('User Interactions', () => {
    it('closes modal when close button clicked', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      const closeButton = screen.getByRole('button', { name: /Cerrar/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('opens task editor when edit button clicked', () => {
      const mockOnEdit = vi.fn();

      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          currentUserRole="owner"
        />
      );

      const editButton = screen.getByRole('button', { name: /Editar/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it('deletes task when delete confirmed', async () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onDelete={mockOnTaskDelete}
          currentUserRole="owner"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Eliminar/i });
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /Confirmar/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnTaskDelete).toHaveBeenCalledWith(mockTask.id);
      });
    });

    it('toggles task completion status', async () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onTaskUpdate={mockOnTaskUpdate}
          currentUserRole="owner"
        />
      );

      const completeButton = screen.getByRole('button', { name: /Completar/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockOnTaskUpdate).toHaveBeenCalled();
      });
    });

    it('adds comment when form submitted', async () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      const commentInput = screen.getByPlaceholderText(/Escribe un comentario/i);
      const submitButton = screen.getByRole('button', { name: /Enviar/i });

      fireEvent.change(commentInput, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(commentInput).toHaveValue('');
      });
    });
  });

  // Permission Tests
  describe('Permissions', () => {
    it('shows all controls for owner/editor role', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Completar/i })).toBeInTheDocument();
    });

    it('hides delete button for viewer role', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="viewer"
        />
      );

      expect(screen.queryByRole('button', { name: /Eliminar/i })).not.toBeInTheDocument();
    });

    it('shows limited controls for viewer role', () => {
      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="viewer"
        />
      );

      expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    });
  });

  // State Management Tests
  describe('State Management', () => {
    it('updates UI when task data changes', async () => {
      const { rerender } = render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      const updatedTask = { ...mockTask, title: 'Updated Title' };

      rerender(
        <TaskDetailView
          task={updatedTask}
          isOpen={true}
          onClose={mockOnClose}
          currentUserRole="owner"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Updated Title')).toBeInTheDocument();
      });
    });

    it('refetches data after mutations', async () => {
      const mockRefetch = vi.fn();

      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onTaskUpdate={mockOnTaskUpdate}
          refetch={mockRefetch}
          currentUserRole="owner"
        />
      );

      const completeButton = screen.getByRole('button', { name: /Completar/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('shows error toast when delete fails', async () => {
      const mockFailingDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));

      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onDelete={mockFailingDelete}
          currentUserRole="owner"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Eliminar/i });
      fireEvent.click(deleteButton);

      const confirmButton = await screen.findByRole('button', { name: /Confirmar/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al eliminar/i)).toBeInTheDocument();
      });
    });

    it('shows error toast when completion toggle fails', async () => {
      const mockFailingUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));

      render(
        <TaskDetailView
          task={mockTask}
          isOpen={true}
          onClose={mockOnClose}
          onTaskUpdate={mockFailingUpdate}
          currentUserRole="owner"
        />
      );

      const completeButton = screen.getByRole('button', { name: /Completar/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });
  });
});
