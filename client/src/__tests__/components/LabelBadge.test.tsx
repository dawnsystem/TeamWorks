import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../utils/testUtils';
import LabelBadge from '../../components/LabelBadge';
import { mockLabel } from '../mocks/mockData';

describe('LabelBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering Tests
  describe('Rendering', () => {
    it('renders label with name and color', () => {
      render(<LabelBadge label={mockLabel} />);

      expect(screen.getByText(mockLabel.name)).toBeInTheDocument();
      
      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveStyle({ backgroundColor: mockLabel.color });
    });

    it('displays label icon when present', () => {
      const labelWithIcon = {
        ...mockLabel,
        icon: '🏷️',
      };

      render(<LabelBadge label={labelWithIcon} />);

      expect(screen.getByText('🏷️')).toBeInTheDocument();
    });

    it('shows correct background color', () => {
      const redLabel = {
        ...mockLabel,
        color: '#FF0000',
      };

      render(<LabelBadge label={redLabel} />);

      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('applies correct text color for contrast', () => {
      // Light background should have dark text
      const lightLabel = {
        ...mockLabel,
        color: '#FFFFFF',
      };

      render(<LabelBadge label={lightLabel} />);

      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveStyle({ color: '#000000' });
    });
  });

  // User Interaction Tests
  describe('User Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const mockOnClick = vi.fn();

      render(<LabelBadge label={mockLabel} onClick={mockOnClick} />);

      const badge = screen.getByTestId('label-badge');
      fireEvent.click(badge);

      expect(mockOnClick).toHaveBeenCalledWith(mockLabel);
    });

    it('calls onRemove when remove button clicked', () => {
      const mockOnRemove = vi.fn();

      render(<LabelBadge label={mockLabel} onRemove={mockOnRemove} removable />);

      const removeButton = screen.getByRole('button', { name: /Eliminar/i });
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith(mockLabel.id);
    });

    it('does not show remove button for non-removable variant', () => {
      render(<LabelBadge label={mockLabel} />);

      expect(
        screen.queryByRole('button', { name: /Eliminar/i })
      ).not.toBeInTheDocument();
    });
  });

  // Size Variants Tests
  describe('Size Variants', () => {
    it('renders in small size correctly', () => {
      render(<LabelBadge label={mockLabel} size="small" />);

      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveClass('label-badge-small');
    });

    it('renders in large size correctly', () => {
      render(<LabelBadge label={mockLabel} size="large" />);

      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveClass('label-badge-large');
    });
  });

  // Color Contrast Tests
  describe('Color Contrast', () => {
    it('uses readable text color based on background brightness', () => {
      // Dark background should have light text
      const darkLabel = {
        ...mockLabel,
        color: '#000000',
      };

      render(<LabelBadge label={darkLabel} />);

      const badge = screen.getByTestId('label-badge');
      expect(badge).toHaveStyle({ color: '#FFFFFF' });
    });
  });
});
