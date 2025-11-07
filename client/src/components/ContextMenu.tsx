import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ContextMenuItem, ContextMenuPosition } from '@/types/contextMenu';

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: ContextMenuPosition;
  onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);

  const handleItemClick = (item: ContextMenuItem, event: React.MouseEvent) => {
    event.stopPropagation();

    if (item.disabled) return;

    if (item.submenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({
        x: rect.right,
        y: rect.top,
      });
      setActiveSubmenu(item.id);
      return;
    }

    if (item.requireConfirm && confirmingItem !== item.id) {
      setConfirmingItem(item.id);
      return;
    }

    if (item.onClick) {
      item.onClick();
    }
    onClose();
  };

  const handleMouseEnter = (item: ContextMenuItem, event: React.MouseEvent) => {
    if (item.submenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({
        x: rect.right,
        y: rect.top,
      });
      setActiveSubmenu(item.id);
    } else {
      setActiveSubmenu(null);
    }
  };

  return (
    <>
      <div
        role="menu"
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px] z-50 animate-in fade-in zoom-in-95 duration-100"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <div key={item.id}>
            <button
              className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 transition ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.danger
                  ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={(e) => handleItemClick(item, e)}
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              disabled={item.disabled}
            >
              <div className="flex items-center gap-2 flex-1">
                {item.icon && <item.icon className="w-4 h-4" />}
                <span className="text-sm">
                  {confirmingItem === item.id ? '¿Confirmar?' : item.label}
                </span>
              </div>
              
              {item.shortcut && !item.submenu && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {item.shortcut}
                </span>
              )}
              
              {item.submenu && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {item.separator && index < items.length - 1 && (
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            )}
          </div>
        ))}
      </div>

      {activeSubmenu && items.find(item => item.id === activeSubmenu)?.submenu && (
        <ContextMenu
          items={items.find(item => item.id === activeSubmenu)!.submenu!}
          position={submenuPosition}
          onClose={onClose}
        />
      )}
    </>
  );
}

