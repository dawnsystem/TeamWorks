import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../utils/testUtils';
import ProjectCard from '../../components/ProjectCard';
import { mockProject } from '../mocks/mockData';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering Tests
  describe('Rendering', () => {
    it('renders project with name and description', () => {
      render(<ProjectCard project={mockProject} userRole="owner" />);

      expect(screen.getByText(mockProject.name)).toBeInTheDocument();
      expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    });

    it('displays task count and progress', () => {
      const projectWithTasks = {
        ...mockProject,
        _count: { tasks: 10 },
        tasks: [
          { id: '1', completed: true },
          { id: '2', completed: true },
          { id: '3', completed: false },
        ],
      };

      render(<ProjectCard project={projectWithTasks} userRole="owner" />);

      expect(screen.getByText(/10 tareas/i)).toBeInTheDocument();
    });

    it('shows project color/theme', () => {
      const coloredProject = {
        ...mockProject,
        color: '#FF5733',
      };

      render(<ProjectCard project={coloredProject} userRole="owner" />);

      const projectCard = screen.getByTestId('project-card');
      expect(projectCard).toHaveStyle({ borderColor: '#FF5733' });
    });

    it('renders project icon when present', () => {
      const projectWithIcon = {
        ...mockProject,
        icon: '📁',
      };

      render(<ProjectCard project={projectWithIcon} userRole="owner" />);

      expect(screen.getByText('📁')).toBeInTheDocument();
    });

    it('shows last updated timestamp', () => {
      render(<ProjectCard project={mockProject} userRole="owner" />);

      expect(screen.getByText(/Actualizado/i)).toBeInTheDocument();
    });
  });

  // User Interaction Tests
  describe('User Interactions', () => {
    it('navigates to project view when clicked', () => {
      render(<ProjectCard project={mockProject} userRole="owner" />);

      const card = screen.getByTestId('project-card');
      fireEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith(`/projects/${mockProject.id}`);
    });

    it('opens context menu on right click', () => {
      render(<ProjectCard project={mockProject} userRole="owner" />);

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      expect(screen.getByText(/Editar/i)).toBeInTheDocument();
      expect(screen.getByText(/Archivar/i)).toBeInTheDocument();
    });

    it('opens project editor when edit triggered', () => {
      const mockOnEdit = vi.fn();

      render(
        <ProjectCard project={mockProject} userRole="owner" onEdit={mockOnEdit} />
      );

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      const editOption = screen.getByText(/Editar/i);
      fireEvent.click(editOption);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
    });

    it('archives project when archive action triggered', async () => {
      const mockOnArchive = vi.fn();

      render(
        <ProjectCard
          project={mockProject}
          userRole="owner"
          onArchive={mockOnArchive}
        />
      );

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      const archiveOption = screen.getByText(/Archivar/i);
      fireEvent.click(archiveOption);

      expect(mockOnArchive).toHaveBeenCalledWith(mockProject.id);
    });
  });

  // Permission Tests
  describe('Permissions', () => {
    it('shows edit controls for owner', () => {
      render(<ProjectCard project={mockProject} userRole="owner" />);

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      expect(screen.getByText(/Editar/i)).toBeInTheDocument();
      expect(screen.getByText(/Archivar/i)).toBeInTheDocument();
    });

    it('hides edit controls for viewer', () => {
      render(<ProjectCard project={mockProject} userRole="viewer" />);

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      expect(screen.queryByText(/Editar/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Archivar/i)).not.toBeInTheDocument();
    });

    it('shows limited controls for editor role', () => {
      render(<ProjectCard project={mockProject} userRole="editor" />);

      const card = screen.getByTestId('project-card');
      fireEvent.contextMenu(card);

      expect(screen.getByText(/Editar/i)).toBeInTheDocument();
      expect(screen.queryByText(/Archivar/i)).not.toBeInTheDocument();
    });
  });

  // Progress Display Tests
  describe('Progress Display', () => {
    it('calculates completion percentage correctly', () => {
      const projectWithCompletion = {
        ...mockProject,
        tasks: [
          { id: '1', completed: true },
          { id: '2', completed: true },
          { id: '3', completed: false },
          { id: '4', completed: false },
        ],
      };

      render(<ProjectCard project={projectWithCompletion} userRole="owner" />);

      // 2 completed out of 4 = 50%
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });

    it('shows progress bar with accurate values', () => {
      const projectWithCompletion = {
        ...mockProject,
        tasks: [
          { id: '1', completed: true },
          { id: '2', completed: true },
          { id: '3', completed: true },
          { id: '4', completed: false },
        ],
      };

      render(<ProjectCard project={projectWithCompletion} userRole="owner" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });
  });
});
