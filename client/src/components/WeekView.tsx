import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import TaskList from './TaskList';
import { tasksAPI } from '@/lib/api';

export default function WeekView() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'week'],
    queryFn: () => tasksAPI.getAll({ filter: 'week' }).then(res => res.data),
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Próximos 7 días
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Tareas programadas para esta semana
        </p>
      </div>

      <TaskList
        tasks={tasks || []}
        loading={isLoading}
        emptyMessage="No hay tareas programadas para esta semana"
      />
    </div>
  );
}

