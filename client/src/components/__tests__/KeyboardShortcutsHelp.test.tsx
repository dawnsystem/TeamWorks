import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp';
import * as useMediaQueryModule from '@/hooks/useMediaQuery';

describe('KeyboardShortcutsHelp Component', () => {
  it('should render button on desktop devices', () => {
    // Mock useIsMobile to return false (desktop)
    vi.spyOn(useMediaQueryModule, 'useIsMobile').mockReturnValue(false);
    
    render(<KeyboardShortcutsHelp />);
    
    // Check if the keyboard shortcuts button is present
    const button = screen.getByTitle('Atajos de teclado');
    expect(button).toBeInTheDocument();
  });

  it('should not render button on mobile devices', () => {
    // Mock useIsMobile to return true (mobile)
    vi.spyOn(useMediaQueryModule, 'useIsMobile').mockReturnValue(true);
    
    render(<KeyboardShortcutsHelp />);
    
    // Check that the keyboard shortcuts button is not present
    const button = screen.queryByTitle('Atajos de teclado');
    expect(button).not.toBeInTheDocument();
  });

  it('should return null on mobile devices', () => {
    // Mock useIsMobile to return true (mobile)
    vi.spyOn(useMediaQueryModule, 'useIsMobile').mockReturnValue(true);
    
    const { container } = render(<KeyboardShortcutsHelp />);
    
    // The component should render nothing
    expect(container.firstChild).toBeNull();
  });
});
