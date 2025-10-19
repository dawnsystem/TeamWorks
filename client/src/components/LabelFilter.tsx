import { useQuery } from '@tanstack/react-query';
import { Tag, X } from 'lucide-react';
import { labelsAPI } from '@/lib/api';

interface LabelFilterProps {
  selectedLabelId: string | null;
  onSelectLabel: (labelId: string | null) => void;
}

export default function LabelFilter({ selectedLabelId, onSelectLabel }: LabelFilterProps) {
  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });

  const selectedLabel = labels.find(l => l.id === selectedLabelId);

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Tag className="h-4 w-4" />
        <span>Filtrar por etiqueta:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedLabelId ? (
          <button
            onClick={() => onSelectLabel(null)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition hover:opacity-80"
            style={{
              backgroundColor: selectedLabel?.color,
              color: 'white',
            }}
          >
            <span>{selectedLabel?.nombre}</span>
            <X className="h-3 w-3" />
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => onSelectLabel(label.id)}
                className="px-3 py-1 rounded-full text-sm font-medium transition hover:opacity-80"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
