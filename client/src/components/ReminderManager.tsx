import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { remindersAPI } from '@/lib/api';
import ReminderPicker from './ReminderPicker';

interface ReminderManagerProps {
  taskId: string;
}

export default function ReminderManager({ taskId }: ReminderManagerProps) {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', taskId],
    queryFn: () => remindersAPI.getByTask(taskId).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (fechaHora: Date) => remindersAPI.create(taskId, { fechaHora }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success('Recordatorio creado');
      setShowPicker(false);
    },
    onError: () => {
      toast.error('Error al crear recordatorio');
    },
  });

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Recordatorios
        </h3>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Añadir
        </button>
      </div>

      {showPicker && (
        <ReminderPicker
          onSelect={handleAddReminder}
          onCancel={() => setShowPicker(false)}
          loading={createMutation.isPending}
        />
      )}

      {reminders && reminders.length > 0 ? (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 flex-1">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(reminder.fechaHora), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </span>
                  {reminder.enviado && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Enviado</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(reminder.id)}
                disabled={deleteMutation.isPending}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          No hay recordatorios
        </p>
      )}
    </div>
  );
}
