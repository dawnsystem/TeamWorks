import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Tag, Plus, Edit2, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { labelsAPI } from '@/lib/api';

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREDEFINED_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export default function LabelManager({ isOpen, onClose }: LabelManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PREDEFINED_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { nombre: string; color: string }) => labelsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Etiqueta creada');
      setNewLabelName('');
      setNewLabelColor(PREDEFINED_COLORS[0]);
    },
    onError: () => {
      toast.error('Error al crear etiqueta');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nombre: string; color: string } }) =>
      labelsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Etiqueta actualizada');
      setEditingId(null);
    },
    onError: () => {
      toast.error('Error al actualizar etiqueta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => labelsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Etiqueta eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar etiqueta');
    },
  });

  const handleCreate = () => {
    if (!newLabelName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    createMutation.mutate({ nombre: newLabelName.trim(), color: newLabelColor });
  };

  const handleStartEdit = (label: any) => {
    setEditingId(label.id);
    setEditingName(label.nombre);
    setEditingColor(label.color);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    updateMutation.mutate({
      id: editingId!,
      data: { nombre: editingName.trim(), color: editingColor },
    });
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Eliminar la etiqueta "${nombre}"? Se quitará de todas las tareas.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredLabels = labels.filter(label =>
    label.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gestionar Etiquetas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar etiqueta..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Labels List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLabels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No se encontraron etiquetas' : 'No hay etiquetas. Crea una abajo.'}
            </div>
          ) : (
            filteredLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {editingId === label.id ? (
                  <>
                    {/* Editing mode */}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex gap-1">
                        {PREDEFINED_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setEditingColor(color)}
                            className={`w-6 h-6 rounded-full transition ${
                              editingColor === color ? 'ring-2 ring-offset-2 ring-red-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 outline-none"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                        title="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View mode */}
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <div className="flex-1">
                      <div
                        className="font-medium text-gray-900 dark:text-gray-100"
                        style={{ color: label.color }}
                      >
                        {label.nombre}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {label._count?.tasks || 0} tarea{(label._count?.tasks || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartEdit(label)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(label.id, label.nombre)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create New Label */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Etiqueta
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {PREDEFINED_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  className={`w-8 h-8 rounded-full transition hover:scale-110 ${
                    newLabelColor === color ? 'ring-2 ring-offset-2 ring-red-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
              placeholder="Nombre de la etiqueta"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
