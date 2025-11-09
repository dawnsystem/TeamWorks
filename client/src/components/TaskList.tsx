import TaskItem from './TaskItem';
import TaskItemSkeleton from './TaskItemSkeleton';
import type { Task, ProjectRole } from '@/types';
import { Sparkles, PlusCircle } from 'lucide-react';
import { useTaskEditorStore } from '@/store/useStore';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  emptyMessage?: string;
  projectRole?: ProjectRole | null;
}

export default function TaskList({ tasks, loading, emptyMessage = 'No hay tareas', projectRole }: TaskListProps) {
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const isEmpty = !loading && tasks.length === 0;
  const canWrite = projectRole ? projectRole !== 'viewer' : true;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="empty-state-card glass-card max-w-xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/70 dark:bg-slate-800/60 flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{emptyMessage}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Empieza añadiendo una tarea para mantener tu día bajo control. Puedes vincular etiquetas, fechas y secciones para una organización impecable.
            </p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={() => openEditor()}
              className="btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              Crear la primera tarea
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full" role="list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} role={projectRole ?? undefined} />
      ))}
    </div>
  );
}

