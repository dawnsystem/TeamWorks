import { LucideIcon } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  submenu?: ContextMenuItem[];
  separator?: boolean;
  requireConfirm?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UseContextMenuReturn {
  show: (event: React.MouseEvent) => void;
  hide: () => void;
  isVisible: boolean;
  position: ContextMenuPosition;
}

