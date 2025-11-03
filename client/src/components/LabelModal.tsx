import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { labelsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Label } from '@/types';

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLabel?: Label | null;
}

export default function LabelModal({ isOpen, onClose, editLabel }: LabelModalProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [pos, setPos] = useState<{x:number;y:number}>(() => {
    const saved = localStorage.getItem('label-modal-pos');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { x: 0, y: 0 };
  });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{x:number;y:number}>({ x: 0, y: 0 });

  const colors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6366f1', // Indigo
  ];

  useEffect(() => {
    if (editLabel) {
      setNombre(editLabel.nombre);
      setColor(editLabel.color);
    } else {
      setNombre('');
      setColor('#3b82f6');
    }
    // Mantener posición previa entre aperturas
  }, [editLabel, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const onUp = () => {
      setDragging(false);
      try { localStorage.setItem('label-modal-pos', JSON.stringify(pos)); } catch {}
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragOffset, isOpen, pos]);

  const createMutation = useMutation({
    mutationFn: (data: { nombre: string; color: string }) => labelsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Etiqueta creada');
      onClose();
    },
    onError: () => {
      toast.error('Error al crear etiqueta');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nombre: string; color: string }) => 
      labelsAPI.update(editLabel!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Etiqueta actualizada');
      onClose();
    },
    onError: () => {
      toast.error('Error al actualizar etiqueta');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editLabel) {
      updateMutation.mutate({ nombre: nombre.trim(), color });
    } else {
      createMutation.mutate({ nombre: nombre.trim(), color });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div 
        className="glass-modal rounded-2xl p-6 w-96 absolute animate-scale-in"
        style={{ left: `calc(50% - 12rem)`, top: `25%`, transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between mb-5 cursor-move select-none"
          onMouseDown={(e) => { setDragging(true); setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y }); }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editLabel ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
          </h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/70 dark:bg-slate-800/60 text-gray-500 hover:text-gray-900 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Importante, Urgente, Personal..."
              className="input-elevated"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim() || createMutation.isPending || updateMutation.isPending}
              className="flex-1 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {editLabel
                ? updateMutation.isPending ? 'Guardando...' : 'Guardar'
                : createMutation.isPending ? 'Creando...' : 'Crear'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

