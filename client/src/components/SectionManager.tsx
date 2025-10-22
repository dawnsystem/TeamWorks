import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Section } from '@/types';

interface SectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  section?: Section | null; // Si existe, estamos editando
}

export default function SectionManager({
  isOpen,
  onClose,
  projectId,
  section,
}: SectionManagerProps) {
  const [nombre, setNombre] = useState('');
  const queryClient = useQueryClient();
  const isEditing = !!section;

  useEffect(() => {
    if (section) {
      setNombre(section.nombre);
    } else {
      setNombre('');
    }
  }, [section]);

  const createMutation = useMutation({
    mutationFn: (data: { nombre: string; orden?: number }) =>
      projectsAPI.createSection(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Sección creada correctamente');
      handleClose();
    },
    onError: () => {
      toast.error('Error al crear la sección');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nombre?: string; orden?: number }) =>
      projectsAPI.updateSection(section!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Sección actualizada correctamente');
      handleClose();
    },
    onError: () => {
      toast.error('Error al actualizar la sección');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ nombre: nombre.trim() });
    } else {
      createMutation.mutate({ nombre: nombre.trim() });
    }
  };

  const handleClose = () => {
    setNombre('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Sección' : 'Nueva Sección'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="section-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nombre de la sección
            </label>
            <input
              id="section-name"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Por hacer, En progreso, Completado..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : isEditing
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
