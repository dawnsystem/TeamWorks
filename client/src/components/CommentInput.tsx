import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { commentsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CommentInputProps {
  taskId: string;
}

export default function CommentInput({ taskId }: CommentInputProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (contenido: string) =>
      commentsAPI.create(taskId, { contenido }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      setContent('');
      toast.success('Comentario añadido');
    },
    onError: () => {
      toast.error('Error al añadir comentario');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    createMutation.mutate(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un comentario... (Ctrl/Cmd + Enter para enviar)"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
        rows={3}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || createMutation.isPending}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition"
        >
          {createMutation.isPending ? (
            'Enviando...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Comentar
            </>
          )}
        </button>
      </div>
    </form>
  );
}

