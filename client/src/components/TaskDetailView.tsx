import { useQuery } from '@tanstack/react-query';
import { X, Edit, Calendar, Flag, Tag, FolderOpen, Loader2, ListPlus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { tasksAPI } from '@/lib/api';
import { useTaskDetailStore, useTaskEditorStore } from '@/store/useStore';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import ReminderManager from './ReminderManager';
import TaskBreadcrumbs from './TaskBreadcrumbs';
import TaskSubscriptionButton from './TaskSubscriptionButton';

const priorityColors = {
  1: 'text-red-600 dark:text-red-400',
  2: 'text-orange-600 dark:text-orange-400',
  3: 'text-blue-600 dark:text-blue-400',
  4: 'text-gray-600 dark:text-gray-400',
};

const priorityLabels = {
  1: 'P1 - Alta',
  2: 'P2 - Media',
  3: 'P3 - Baja',
  4: 'P4 - Ninguna',
};

export default function TaskDetailView() {
  const { isOpen, taskId, closeDetail } = useTaskDetailStore();
  const openEditor = useTaskEditorStore((state) => state.openEditor);

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksAPI.getOne(taskId!).then(res => res.data),
    enabled: !!taskId,
  });

  if (!isOpen) return null;

  const handleEdit = () => {
    if (task) {
      openEditor({ taskId: task.id });
      closeDetail();
    }
  };

  const handleAddSubtask = () => {
    if (task) {
      openEditor({ 
        projectId: task.projectId, 
        parentTaskId: task.id,
        sectionId: task.sectionId || undefined,
      });
    }
  };

  const handleBreadcrumbNavigate = (taskId: string) => {
    // Open the parent task detail view
    closeDetail();
    setTimeout(() => {
      useTaskDetailStore.getState().openDetail(taskId);
    }, 100);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={closeDetail}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {isLoading || !task ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Breadcrumbs */}
            <TaskBreadcrumbs task={task} onNavigate={handleBreadcrumbNavigate} />

            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1 pr-4">
                {task.titulo}
              </h2>
              <div className="flex items-center gap-2">
                <TaskSubscriptionButton taskId={task.id} />
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Editar tarea"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={closeDetail}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Descripción */}
            {task.descripcion && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {task.descripcion}
                </p>
              </div>
            )}

            {/* Información de la tarea */}
            <div className="space-y-3 py-4 border-y border-gray-200 dark:border-gray-700">
              {/* Proyecto */}
              <div className="flex items-center gap-3 text-sm">
                <FolderOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Proyecto</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {/* Project name would be fetched from project data */}
                  {task.projectId}
                </span>
              </div>

              {/* Prioridad */}
              <div className="flex items-center gap-3 text-sm">
                <Flag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Prioridad</span>
                <span className={`font-medium ${priorityColors[task.prioridad]}`}>
                  {priorityLabels[task.prioridad]}
                </span>
              </div>

              {/* Fecha de vencimiento */}
              {task.fechaVencimiento && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Vencimiento</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {format(new Date(task.fechaVencimiento), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
              )}

              {/* Etiquetas */}
              {task.labels && task.labels.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Tag className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">Etiquetas</span>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((tl) => (
                      <span
                        key={tl.labelId}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: `${tl.label.color}20`,
                          color: tl.label.color,
                        }}
                      >
                        {tl.label.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtareas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Subtareas {task._count?.subTasks ? `(${task._count.subTasks})` : ''}
                </h3>
                <button
                  onClick={handleAddSubtask}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <ListPlus className="h-4 w-4" />
                  Añadir subtarea
                </button>
              </div>
              {task.subTasks && task.subTasks.length > 0 ? (
                <div className="space-y-2">
                  {task.subTasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                    >
                      <p className={`font-medium ${subtask.completada ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {subtask.titulo}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay subtareas
                </p>
              )}
            </div>

            {/* Recordatorios */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <ReminderManager 
                taskId={task.id} 
                taskDate={task.fechaVencimiento}
              />
            </div>

            {/* Comentarios */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Comentarios {task._count?.comments ? `(${task._count.comments})` : ''}
              </h3>
              <CommentList taskId={task.id} />
              <CommentInput taskId={task.id} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
