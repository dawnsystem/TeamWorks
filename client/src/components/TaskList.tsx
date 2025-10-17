import TaskItem from './TaskItem';
import TaskItemSkeleton from './TaskItemSkeleton';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function TaskList({ tasks, loading, emptyMessage = 'No hay tareas' }: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

