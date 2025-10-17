import { ChevronRight } from 'lucide-react';
import type { Task } from '@/types';

interface TaskBreadcrumbsProps {
  task: Task;
  onNavigate?: (taskId: string) => void;
}

export default function TaskBreadcrumbs({ task, onNavigate }: TaskBreadcrumbsProps) {
  // Build the breadcrumb trail by traversing up the parent hierarchy
  const buildBreadcrumbs = (currentTask: Task): Task[] => {
    const trail: Task[] = [];
    let node: Task | undefined = currentTask;
    
    while (node) {
      trail.unshift(node);
      node = node.parentTask;
    }
    
    return trail;
  };

  const breadcrumbs = buildBreadcrumbs(task);

  // If there's only one item (no parent), don't show breadcrumbs
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3" />}
          {index < breadcrumbs.length - 1 ? (
            <button
              onClick={() => onNavigate?.(crumb.id)}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
              title={crumb.titulo}
            >
              {crumb.titulo.length > 20
                ? `${crumb.titulo.substring(0, 20)}...`
                : crumb.titulo}
            </button>
          ) : (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {crumb.titulo.length > 30
                ? `${crumb.titulo.substring(0, 30)}...`
                : crumb.titulo}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
