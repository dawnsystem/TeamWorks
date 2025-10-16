import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Circle, CheckCircle2, Calendar, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Task } from '@/types';
import { tasksAPI } from '@/lib/api';
import { useTaskEditorStore } from '@/store/useStore';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const queryClient = useQueryClient();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const [subTasksOpen, setSubTasksOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => tasksAPI.toggle(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(task.completada ? 'Tarea marcada como pendiente' : 'Tarea completada');
    },
    onError: () => {
      toast.error('Error al actualizar tarea');
    },
  });

  const priorityColors = {
    1: 'border-l-priority-1',
    2: 'border-l-priority-2',
    3: 'border-l-priority-3',
    4: 'border-l-gray-300 dark:border-l-gray-600',
  };

  const priorityLabels = {
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: '',
  };

  const isOverdue = task.fechaVencimiento && new Date(task.fechaVencimiento) < new Date() && !task.completada;

  return (
    <div className="group">
      <div
        className={`bg-white dark:bg-gray-800 border-l-4 ${
          priorityColors[task.prioridad]
        } rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
          task.completada ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate();
            }}
            className="mt-0.5"
          >
            {task.completada ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>

          <div className="flex-1" onClick={() => openEditor({ taskId: task.id })}>
            <h3
              className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
                task.completada ? 'line-through' : ''
              }`}
            >
              {task.titulo}
            </h3>

            {task.descripcion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {task.descripcion}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {task.fechaVencimiento && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    isOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.fechaVencimiento), 'd MMM', { locale: es })}
                </span>
              )}

              {task.labels && task.labels.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.labels.map((tl) => (
                    <span
                      key={tl.labelId}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${tl.label.color}20`,
                        color: tl.label.color,
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      {tl.label.nombre}
                    </span>
                  ))}
                </div>
              )}

              {priorityLabels[task.prioridad] && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded`}
                  style={{ color: `var(--priority-${task.prioridad})` }}
                >
                  {priorityLabels[task.prioridad]}
                </span>
              )}

              {task._count && task._count.subTasks > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubTasksOpen(!subTasksOpen);
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      subTasksOpen ? 'rotate-90' : ''
                    }`}
                  />
                  {task._count.subTasks} subtarea{task._count.subTasks !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {subTasksOpen && task.subTasks && task.subTasks.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {task.subTasks.map((subTask) => (
            <TaskItem key={subTask.id} task={subTask} />
          ))}
        </div>
      )}
    </div>
  );
}

