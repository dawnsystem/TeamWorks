import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle2, MessageSquare, Plus, ArrowRight, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksAPI, commentsAPI } from '@/lib/api';
import type { Task } from '@/types';

interface TaskRelationshipPopupProps {
  parentTask: Task;
  completedSubTaskTitle: string;
  onClose: () => void;
}

type ActionType = 'complete' | 'comment' | 'new_subtask' | 'move' | 'next' | 'dismiss';

export default function TaskRelationshipPopup({ 
  parentTask, 
  completedSubTaskTitle, 
  onClose 
}: TaskRelationshipPopupProps) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const completeParentMutation = useMutation({
    mutationFn: () => tasksAPI.toggle(parentTask.id),
    onSuccess: () => {
      toast.success('Tarea padre completada');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: () => {
      toast.error('Error al completar tarea padre');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => commentsAPI.create(parentTask.id, { contenido: comment }),
    onSuccess: () => {
      toast.success('Comentario añadido');
      queryClient.invalidateQueries({ queryKey: ['tasks', parentTask.id] });
      queryClient.invalidateQueries({ queryKey: ['comments', parentTask.id] });
      onClose();
    },
    onError: () => {
      toast.error('Error al añadir comentario');
    }
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) => tasksAPI.create({
      titulo: title,
      prioridad: parentTask.prioridad,
      projectId: parentTask.projectId,
      sectionId: parentTask.sectionId || undefined,
      parentTaskId: parentTask.id,
      descripcion: undefined,
      fechaVencimiento: undefined,
      orden: 0
    }),
    onSuccess: () => {
      toast.success('Nueva subtarea creada');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating subtask:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear subtarea';
      toast.error(errorMessage);
    }
  });

  const handleComplete = () => {
    completeParentMutation.mutate();
  };

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }
    addCommentMutation.mutate(commentText);
  };

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      toast.error('El título no puede estar vacío');
      return;
    }
    createSubtaskMutation.mutate(newSubtaskTitle);
  };

  const handleDismiss = () => {
    onClose();
  };

  const completedCount = (parentTask._count?.subTasks || 0);
  const totalSubTasks = completedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-8 h-8 text-white" />
                <h2 className="text-2xl font-bold text-white">
                  🎉 ¡Última subtarea completada!
                </h2>
              </div>
              <p className="text-green-50 text-sm">
                Has completado "{completedSubTaskTitle}"
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Tarea padre: {parentTask.titulo}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    ✓ {totalSubTasks} subtareas completadas
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    parentTask.prioridad === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    parentTask.prioridad === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                    parentTask.prioridad === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    P{parentTask.prioridad}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection or Form */}
          {selectedAction === null ? (
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                ¿Qué te gustaría hacer ahora?
              </p>

              {/* Complete Parent */}
              <button
                onClick={handleComplete}
                disabled={completeParentMutation.isPending}
                className="w-full flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition group"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-300">
                    Completar tarea padre también
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Marcar "{parentTask.titulo}" como completada
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </button>

              {/* Add Comment */}
              <button
                onClick={() => {
                  setSelectedAction('comment');
                  setCommentText(`Todas las subtareas completadas el ${new Date().toLocaleDateString('es-ES')}`);
                }}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    Añadir un comentario
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Registrar progreso o notas adicionales
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </button>

              {/* Create New Subtask */}
              <button
                onClick={() => setSelectedAction('new_subtask')}
                className="w-full flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    Crear nueva subtarea
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ¿Olvidaste algo? Añade otra subtarea
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
              </button>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition group"
              >
                <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    No hacer nada por ahora
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Cerrar este mensaje
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ) : selectedAction === 'comment' ? (
            /* Comment Form */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAction(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                ← Volver
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comentario
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                  placeholder="Escribe tu comentario aquí..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addCommentMutation.isPending ? 'Añadiendo...' : 'Añadir comentario'}
                </button>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : selectedAction === 'new_subtask' ? (
            /* New Subtask Form */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAction(null)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                ← Volver
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título de la nueva subtarea
                </label>
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Ej: Revisar documentación final"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateSubtask}
                  disabled={createSubtaskMutation.isPending || !newSubtaskTitle.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSubtaskMutation.isPending ? 'Creando...' : 'Crear subtarea'}
                </button>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
