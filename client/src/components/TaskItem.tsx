import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Circle, CheckCircle2, Calendar, Tag, ChevronRight, Edit, Copy, Trash2, Flag, FolderInput, ListPlus, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Task } from '@/types';
import type { ContextMenuItem } from '@/types/contextMenu';
import { tasksAPI, projectsAPI, labelsAPI } from '@/lib/api';
import { useTaskEditorStore, useTaskDetailStore } from '@/store/useStore';
import { useState } from 'react';
import { useContextMenu } from '@/hooks/useContextMenu';
import ContextMenu from './ContextMenu';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const queryClient = useQueryClient();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const openDetail = useTaskDetailStore((state) => state.openDetail);
  const [subTasksOpen, setSubTasksOpen] = useState(false);
  const contextMenu = useContextMenu();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });

  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });

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

  const deleteMutation = useMutation({
    mutationFn: () => tasksAPI.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Tarea eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar tarea');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => tasksAPI.create({
      titulo: `${task.titulo} (copia)`,
      descripcion: task.descripcion || undefined,
      prioridad: task.prioridad,
      fechaVencimiento: task.fechaVencimiento || undefined,
      projectId: task.projectId,
      sectionId: task.sectionId || undefined,
      labelIds: task.labels?.map(l => l.labelId) || [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Tarea duplicada');
    },
    onError: () => {
      toast.error('Error al duplicar tarea');
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (prioridad: 1 | 2 | 3 | 4) => tasksAPI.update(task.id, { prioridad }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Prioridad actualizada');
    },
  });

  const updateDateMutation = useMutation({
    mutationFn: (fechaVencimiento: string | null) => tasksAPI.update(task.id, { fechaVencimiento }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Fecha actualizada');
    },
  });

  const moveToProjectMutation = useMutation({
    mutationFn: (newProjectId: string) => tasksAPI.update(task.id, { projectId: newProjectId, sectionId: null }),
    onSuccess: (_, newProjectId) => {
      const oldProjectId = task.projectId;
      const projectName = projects?.find(p => p.id === newProjectId)?.nombre || 'proyecto';
      
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Todas las tareas
      queryClient.invalidateQueries({ queryKey: ['tasks', oldProjectId] }); // Tareas del proyecto antiguo
      queryClient.invalidateQueries({ queryKey: ['tasks', newProjectId] }); // Tareas del proyecto nuevo
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Lista de proyectos
      queryClient.invalidateQueries({ queryKey: ['project', oldProjectId] }); // Proyecto antiguo (contador)
      queryClient.invalidateQueries({ queryKey: ['project', newProjectId] }); // Proyecto nuevo (contador)
      
      toast.success(`Tarea movida a ${projectName}`);
    },
    onError: () => {
      toast.error('Error al mover tarea');
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

  const getToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString();
  };

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow.toISOString();
  };

  const getNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return nextWeek.toISOString();
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'edit',
      label: 'Editar tarea',
      icon: Edit,
      onClick: () => openEditor({ taskId: task.id }),
    },
    {
      id: 'toggle',
      label: task.completada ? 'Marcar como pendiente' : 'Completar',
      icon: task.completada ? Circle : CheckCircle2,
      onClick: () => toggleMutation.mutate(),
    },
    {
      id: 'duplicate',
      label: 'Duplicar tarea',
      icon: Copy,
      onClick: () => duplicateMutation.mutate(),
      separator: true,
    },
    {
      id: 'priority',
      label: 'Cambiar prioridad',
      icon: Flag,
      submenu: [
        {
          id: 'p1',
          label: 'P1 - Alta',
          onClick: () => updatePriorityMutation.mutate(1),
        },
        {
          id: 'p2',
          label: 'P2 - Media',
          onClick: () => updatePriorityMutation.mutate(2),
        },
        {
          id: 'p3',
          label: 'P3 - Baja',
          onClick: () => updatePriorityMutation.mutate(3),
        },
        {
          id: 'p4',
          label: 'P4 - Sin prioridad',
          onClick: () => updatePriorityMutation.mutate(4),
        },
      ],
    },
    {
      id: 'date',
      label: 'Cambiar fecha',
      icon: Calendar,
      submenu: [
        {
          id: 'today',
          label: 'Hoy',
          onClick: () => updateDateMutation.mutate(getToday()),
        },
        {
          id: 'tomorrow',
          label: 'Mañana',
          onClick: () => updateDateMutation.mutate(getTomorrow()),
        },
        {
          id: 'next-week',
          label: 'Próximos 7 días',
          onClick: () => updateDateMutation.mutate(getNextWeek()),
        },
        {
          id: 'no-date',
          label: 'Sin fecha',
          onClick: () => updateDateMutation.mutate(null),
        },
      ],
    },
    {
      id: 'move',
      label: 'Mover a proyecto',
      icon: FolderInput,
      submenu: projects?.map(project => ({
        id: project.id,
        label: project.nombre,
        onClick: () => moveToProjectMutation.mutate(project.id),
        disabled: project.id === task.projectId,
      })) || [],
    },
    {
      id: 'labels',
      label: 'Añadir etiqueta',
      icon: Tag,
      submenu: labels?.map(label => ({
        id: label.id,
        label: label.nombre,
        onClick: () => {
          const currentLabels = task.labels?.map(l => l.labelId) || [];
          tasksAPI.update(task.id, { labelIds: [...currentLabels, label.id] }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Etiqueta añadida');
          });
        },
        disabled: task.labels?.some(l => l.labelId === label.id),
      })) || [],
      separator: true,
    },
    {
      id: 'subtask',
      label: 'Crear subtarea',
      icon: ListPlus,
      onClick: () => openEditor({ projectId: task.projectId, parentTaskId: task.id }),
    },
    {
      id: 'copy-link',
      label: 'Copiar enlace',
      icon: Link2,
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/task/${task.id}`);
        toast.success('Enlace copiado');
      },
      separator: true,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => deleteMutation.mutate(),
      danger: true,
      requireConfirm: true,
    },
  ];

  return (
    <div className="group">
      <div
        className={`bg-white dark:bg-gray-800 border-l-4 ${
          priorityColors[task.prioridad]
        } rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
          task.completada ? 'opacity-60' : ''
        }`}
        onContextMenu={contextMenu.show}
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

          <div className="flex-1" onClick={() => openDetail(task.id)}>
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

      {contextMenu.isVisible && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={contextMenu.hide}
        />
      )}
    </div>
  );
}

