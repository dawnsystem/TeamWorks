import type { Label } from '@/types';

interface LabelBadgeProps {
  label: Label & { icon?: string };
  onClick?: (label: Label) => void;
  onRemove?: (labelId: string) => void;
  removable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LabelBadge({ label, onClick, onRemove, removable, size = 'medium' }: LabelBadgeProps) {
  // Calculate text color based on background color for contrast
  const getTextColor = (hexColor: string) => {
    // Ensure hex color starts with #
    const cleanHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
    
    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(cleanHex)) {
      // Return black as fallback for invalid colors
      return '#000000';
    }
    
    // Convert hex to RGB
    const r = parseInt(cleanHex.slice(1, 3), 16);
    const g = parseInt(cleanHex.slice(3, 5), 16);
    const b = parseInt(cleanHex.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const textColor = getTextColor(label.color);
  const isClickable = Boolean(onClick);
  const hasRemove = Boolean(removable && onRemove);

  // Size classes
  const sizeClasses = {
    small: 'label-badge-small px-1.5 py-0.5 text-xs',
    medium: 'px-2 py-1 text-xs',
    large: 'label-badge-large px-3 py-1.5 text-sm'
  };

  return (
    <span
      data-testid="label-badge"
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${
        isClickable ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{ 
        backgroundColor: label.color,
        color: textColor
      }}
      onClick={() => onClick?.(label)}
    >
      {label.icon && <span>{label.icon}</span>}
      <span>{label.nombre}</span>
      {hasRemove && (
        <button
          data-testid="remove-label"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(label.id);
          }}
          className="ml-1 hover:opacity-70"
          aria-label="Eliminar"
        >
          ×
        </button>
      )}
    </span>
  );
}
