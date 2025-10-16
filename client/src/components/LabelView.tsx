import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Loader2, Tag } from 'lucide-react';
import { tasksAPI, labelsAPI } from '@/lib/api';
import TaskList from './TaskList';

export default function LabelView() {
  const { id } = useParams<{ id: string }>();

  const { data: label, isLoading: labelLoading } = useQuery({
    queryKey: ['labels', id],
    queryFn: () => labelsAPI.getOne(id!).then(res => res.data),
    enabled: !!id,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'label', id],
    queryFn: () => tasksAPI.getByLabel(id!).then(res => res.data),
    enabled: !!id,
  });

  if (labelLoading || !label) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${label.color}20` }}
          >
            <Tag
              className="h-6 w-6"
              style={{ color: label.color }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {label.nombre}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {tasks?.length || 0} {tasks?.length === 1 ? 'tarea' : 'tareas'}
        </p>
      </div>

      {/* Task List */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <TaskList tasks={tasks || []} />
      )}
    </div>
  );
}
