import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { labelsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Label } from '@/types';
import { Button, Modal } from '@/components/ui';

interface LabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLabel?: Label | null;
}

const presetColors = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

export default function LabelModal({ isOpen, onClose, editLabel }: LabelModalProps) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('label-modal-pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* noop */
      }
    }
    return { x: 0, y: 0 };
  });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (editLabel) {
      setNombre(editLabel.nombre);
      setColor(editLabel.color);
    } else {
      setNombre('');
      setColor('#3b82f6');
    }
  }, [editLabel, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onMove = (event: MouseEvent) => {
      if (!dragging) return;
      setPos({ x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y });
    };

    const onUp = () => {
      setDragging(false);
      try {
        localStorage.setItem('label-modal-pos', JSON.stringify(pos));
      } catch {
        /* noop */
      }
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
    mutationFn: (data: { nombre: string; color: string }) => labelsAPI.update(editLabel!.id, data),
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

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

  const submitDisabled = !nombre.trim() || createMutation.isPending || updateMutation.isPending;

  const footer = (
    <div className="flex w-full items-center justify-between gap-3">
      <Button variant="ghost" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        disabled={submitDisabled}
        onClick={() => formRef.current?.requestSubmit()}
      >
        {editLabel
          ? updateMutation.isPending
            ? 'Guardando...'
            : 'Guardar'
          : createMutation.isPending
          ? 'Creando...'
          : 'Crear'}
      </Button>
    </div>
  );

  const title = editLabel ? 'Editar etiqueta' : 'Nueva etiqueta';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      hideCloseButton
      size="sm"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      footer={footer}
    >
      <div
        className="mb-6 h-10 cursor-move select-none rounded-lg bg-slate-100/60 dark:bg-slate-700/40"
        onMouseDown={(event) => {
          setDragging(true);
          setDragOffset({ x: event.clientX - pos.x, y: event.clientY - pos.y });
        }}
      />

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej: Importante, Urgente, Personal..."
            className="input-elevated"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`h-9 w-9 rounded-full transition-transform ${
                  color === preset ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
          <input
            type="text"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="input-elevated mt-3"
          />
        </div>
      </form>

      <button
        onClick={onClose}
        className="ui-button ui-button--ghost absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </Modal>
  );
}

