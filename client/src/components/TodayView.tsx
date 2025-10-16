import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TaskList from './TaskList';
import { tasksAPI } from '@/lib/api';

export default function TodayView() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksAPI.getAll({ filter: 'today' }).then(res => res.data),
  });

  const today = new Date();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hoy</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {format(today, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      <TaskList
        tasks={tasks || []}
        loading={isLoading}
        emptyMessage="No hay tareas para hoy. ¡Disfruta tu día!"
      />
    </div>
  );
}

