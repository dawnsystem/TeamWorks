import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit2, X, Check } from 'lucide-react';
import { commentsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Comment } from '@/types';

interface CommentListProps {
  taskId: string;
}

export default function CommentList({ taskId }: CommentListProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsAPI.getByTask(taskId).then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, contenido }: { id: string; contenido: string }) =>
      commentsAPI.update(id, { contenido }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comentario actualizado');
      setEditingId(null);
    },
    onError: () => {
      toast.error('Error al actualizar comentario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success('Comentario eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar comentario');
    },
  });

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.contenido);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }
    updateMutation.mutate({ id, contenido: editContent });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'ahora' : `hace ${minutes}m`;
    }
    if (hours < 24) {
      return `hace ${hours}h`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `hace ${days}d`;
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios...</div>;
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No hay comentarios aún
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {comment.user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {comment.user?.nombre || 'Usuario'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={updateMutation.isPending}
                    className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={updateMutation.isPending}
                    className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="group">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                  {comment.contenido}
                </p>

                {currentUser?.id === comment.userId && (
                  <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Eliminar este comentario?')) {
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

