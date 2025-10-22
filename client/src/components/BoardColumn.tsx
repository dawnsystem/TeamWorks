import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskList from './TaskList';
import { useTaskEditorStore } from '@/store/useStore';
import type { Task } from '@/types';

interface BoardColumnProps {
  sectionId: string | null;
  title: string;
  tasks: Task[];
  projectId: string;
}

export default function BoardColumn({ sectionId, title, tasks, projectId }: BoardColumnProps) {
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  
  const { setNodeRef, isOver } = useDroppable({
    id: sectionId ? `section-${sectionId}` : 'section-no-section',
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors h-full ${
        isOver ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            <TaskList tasks={tasks} />
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No hay tareas
              </p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => openEditor({ projectId, sectionId: sectionId || undefined })}
          className="w-full flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Agregar tarea</span>
        </button>
      </div>
    </div>
  );
}
