import { useQuery } from '@tanstack/react-query';
import { X, Edit, Calendar, Tag, Flag, FolderOpen, CheckCircle, Circle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { tasksAPI } from '@/lib/api';
import { useTaskDetailStore, useTaskEditorStore } from '@/store/useStore';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import ReminderManager from './ReminderManager';

export default function TaskDetailView() {
  const { isOpen, taskId, closeDetail } = useTaskDetailStore();
  const openEditor = useTaskEditorStore((state) => state.openEditor);

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => (taskId ? tasksAPI.getOne(taskId).then(res => res.data) : null),
    enabled: !!taskId && isOpen,
  });

  if (!isOpen || !taskId) return null;

  const priorityColors = {
    1: 'text-priority-1',
    2: 'text-priority-2',
    3: 'text-priority-3',
    4: 'text-gray-400',
  };

  const priorityLabels = {
    1: 'P1 - Alta',
    2: 'P2 - Media',
    3: 'P3 - Baja',
    4: 'P4 - Sin prioridad',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeDetail}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white dark:bg-gray-900 z-50 shadow-2xl overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : task ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={() => {
                    if (task.completada) {
                      // TODO: Add toggle completion mutation
                    }
                  }}
                  className="p-1"
                >
                  {task.completada ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      openEditor({ taskId: task.id });
                      closeDetail();
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                    title="Editar tarea"
                  >
                    <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={closeDetail}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <h2 className={`text-2xl font-bold mb-3 ${task.completada ? 'line-through opacity-60' : ''} text-gray-900 dark:text-white`}>
                {task.titulo}
              </h2>

              {task.descripcion && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
                  {task.descripcion}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2">
                {/* Proyecto */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FolderOpen className="w-4 h-4" />
                  <span>{task.project?.nombre || 'Sin proyecto'}</span>
                </div>

                {/* Prioridad */}
                <div className="flex items-center gap-2 text-sm">
                  <Flag className={`w-4 h-4 ${priorityColors[task.prioridad]}`} />
                  <span className={priorityColors[task.prioridad]}>
                    {priorityLabels[task.prioridad]}
                  </span>
                </div>

                {/* Fecha de vencimiento */}
                {task.fechaVencimiento && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(task.fechaVencimiento), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}

                {/* Etiquetas */}
                {task.labels && task.labels.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    {task.labels.map((taskLabel) => (
                      <span
                        key={taskLabel.labelId}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `${taskLabel.label.color}20`,
                          color: taskLabel.label.color,
                        }}
                      >
                        {taskLabel.label.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Subtareas */}
              {task.subTasks && task.subTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Subtareas ({task._count?.subTasks || 0})
                    </h3>
                    <button
                      onClick={() => {
                        openEditor({ projectId: task.projectId, parentTaskId: task.id });
                        closeDetail();
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Añadir
                    </button>
                  </div>
                  <div className="space-y-2">
                    {task.subTasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        {subtask.completada ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${subtask.completada ? 'line-through opacity-60' : ''} text-gray-900 dark:text-white`}>
                          {subtask.titulo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recordatorios */}
              <ReminderManager taskId={task.id} />

              {/* Comentarios */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Comentarios ({task._count?.comments || 0})
                </h3>
                <CommentList taskId={task.id} />
                <div className="mt-4">
                  <CommentInput taskId={task.id} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Tarea no encontrada
          </div>
        )}
      </div>
    </>
  );
}
