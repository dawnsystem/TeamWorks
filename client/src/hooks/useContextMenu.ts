import { useState, useCallback, useEffect } from 'react';
import type { ContextMenuPosition, UseContextMenuReturn } from '@/types/contextMenu';

export const useContextMenu = (): UseContextMenuReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

  const show = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = event;
    
    // Ajustar posición si está cerca de los bordes
    const menuWidth = 250;
    const menuHeight = 400;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = clientX;
    let y = clientY;

    // Ajustar X si se sale por la derecha
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }

    // Ajustar Y si se sale por abajo
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }

    setPosition({ x, y });
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const handleClick = () => hide();
    const handleScroll = () => hide();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    if (isVisible) {
      document.addEventListener('click', handleClick);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hide]);

  return { show, hide, isVisible, position };
};

