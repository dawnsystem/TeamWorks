import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { remindersAPI } from '@/lib/api';
import type { Reminder } from '@/types';
import ReminderPicker from './ReminderPicker';

interface ReminderManagerProps {
  taskId: string;
  taskDate?: string | null;
}

export default function ReminderManager({ taskId, taskDate }: ReminderManagerProps) {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  // Obtener recordatorios
  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', taskId],
    queryFn: () => remindersAPI.getByTask(taskId).then(res => res.data),
  });

  // Crear recordatorio
  const createMutation = useMutation({
    mutationFn: (fechaHora: Date) => remindersAPI.create(taskId, { fechaHora }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success('Recordatorio añadido');
      setShowPicker(false);
    },
    onError: () => {
      toast.error('Error al crear recordatorio');
    },
  });

  // Eliminar recordatorio
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remindersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success('Recordatorio eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar recordatorio');
    },
  });

  const handleAddReminder = (date: Date) => {
    createMutation.mutate(date);
  };

  const handleDeleteReminder = (id: string) => {
    if (window.confirm('¿Eliminar este recordatorio?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Recordatorios
        </h3>
        {!showPicker && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Plus className="h-3 w-3" />
            Añadir
          </button>
        )}
      </div>

      {/* Lista de recordatorios */}
      {reminders && reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder: Reminder) => {
            const reminderDate = new Date(reminder.fechaHora);
            const isPast = reminderDate < new Date();
            
            return (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-2 rounded-md border ${
                  isPast
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Bell className={`h-4 w-4 flex-shrink-0 ${
                    isPast
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${
                      isPast
                        ? 'text-gray-600 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {format(reminderDate, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                    {reminder.enviado && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enviado
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors flex-shrink-0"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje vacío */}
      {reminders && reminders.length === 0 && !showPicker && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          No hay recordatorios configurados
        </p>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="mt-2">
          <ReminderPicker
            taskDate={taskDate}
            onSelect={handleAddReminder}
            onCancel={() => setShowPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
