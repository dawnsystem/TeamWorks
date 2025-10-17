import { useEffect } from 'react';
import { useTaskEditorStore, useAIStore } from '@/store/useStore';

export const useKeyboardShortcuts = () => {
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const toggleAI = useAIStore((state) => state.toggleAI);
  const isAIOpen = useAIStore((state) => state.isOpen);
  const isEditorOpen = useTaskEditorStore((state) => state.isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

      // Cmd/Ctrl + K - Open new task editor
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isTyping) {
        e.preventDefault();
        if (!isEditorOpen) {
          openEditor();
        }
      }

      // Cmd/Ctrl + / - Toggle AI assistant
      if ((e.metaKey || e.ctrlKey) && e.key === '/' && !isTyping) {
        e.preventDefault();
        toggleAI();
      }

      // Escape - Close AI assistant if open
      if (e.key === 'Escape' && isAIOpen) {
        toggleAI();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openEditor, toggleAI, isAIOpen, isEditorOpen]);
};
