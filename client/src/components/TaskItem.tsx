import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Circle, CheckCircle2, Calendar, Tag, ChevronRight, Edit, Copy, Trash2, Flag, FolderInput, ListPlus, Link2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types';
import type { ContextMenuItem } from '@/types/contextMenu';
import { tasksAPI, projectsAPI, labelsAPI } from '@/lib/api';
import { useTaskEditorStore, useTaskDetailStore, useTaskRelationshipStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { useContextMenu } from '@/hooks/useContextMenu';
import ContextMenu from './ContextMenu';

interface TaskItemProps {
  task: Task;
  depth?: number;
}

export default function TaskItem({ task, depth = 0 }: TaskItemProps) {
  const queryClient = useQueryClient();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const openDetail = useTaskDetailStore((state) => state.openDetail);
  const openRelationshipPopup = useTaskRelationshipStore((state) => state.openPopup);
  const [subTasksOpen, setSubTasksOpen] = useState(false);
  const contextMenu = useContextMenu();
  const [contextMenuTimer, setContextMenuTimer] = useState<number | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (contextMenuTimer) {
        clearTimeout(contextMenuTimer);
      }
    };
  }, [contextMenuTimer]);

  // Only make root tasks draggable (depth 0)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: depth > 0, // Disable dragging for subtasks
  });

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
    onSuccess: async () => {
      // Check if this is a subtask being completed and it's the last one
      if (task.parentTaskId && !task.completada) {
        // Fetch parent task to check if all subtasks will be completed
        try {
          const parentResponse = await tasksAPI.getOne(task.parentTaskId);
          const parentTask = parentResponse.data;
          
          // Count incomplete subtasks (excluding this one that will be completed)
          const incompleteSubtasks = parentTask.subTasks?.filter(
            (st: Task) => !st.completada && st.id !== task.id
          ) || [];
          
          // If this is the last subtask to complete, show relationship popup
          if (incompleteSubtasks.length === 0) {
            setTimeout(() => {
              openRelationshipPopup(parentTask.id, task.titulo);
            }, 300); // Small delay to ensure UI updates first
          }
        } catch (error) {
          console.error('Error checking parent task:', error);
        }
      }
      
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
    onError: (error: any) => {
      console.error('Error duplicating task:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al duplicar tarea';
      toast.error(errorMessage);
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
    1: 'task-priority-1',
    2: 'task-priority-2',
    3: 'task-priority-3',
    4: 'task-priority-4',
  } as const;

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition, // Remove transition during drag to prevent snap-back
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${depth * 24}px`,
  };

  // Calculate completed subtasks count
  const completedSubTasks = task.subTasks?.filter(st => st.completada).length || 0;
  const totalSubTasks = task._count?.subTasks || task.subTasks?.length || 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    // For root tasks (draggable), we need to handle context menu carefully
    if (depth === 0) {
      // On touch devices, prevent default context menu on long-press
      // This allows drag to work properly
      // Context menu can still be accessed via right-click on desktop
      if ('ontouchstart' in window) {
        e.preventDefault();
        return;
      }
      
      // Clear any existing timer
      if (contextMenuTimer) {
        clearTimeout(contextMenuTimer);
        setContextMenuTimer(null);
      }
      
      // Show context menu for actual right-clicks (desktop)
      if (e.button === 2 || e.type === 'contextmenu') {
        contextMenu.show(e);
      }
    } else {
      // For subtasks, show context menu normally
      contextMenu.show(e);
    }
  };

  return (
    <div className="group" ref={setNodeRef} style={style}>
      <div
        className={`glass-card ${priorityColors[task.prioridad]} rounded-xl p-5 transition-smooth soft-shadow ${
          task.completada ? 'opacity-60' : ''
        } ${
          depth === 0 ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : 'cursor-pointer'
        } w-full`}
        style={{
          userSelect: depth === 0 ? 'none' : undefined,
          WebkitUserSelect: depth === 0 ? 'none' : undefined,
          touchAction: 'manipulation',
        }}
        onContextMenu={handleContextMenu}
        {...(depth === 0 ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Drag Handle - visual indicator for depth 0 (root tasks) */}
          {depth === 0 && (
            <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}

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

          <div 
            className="flex-1 cursor-pointer min-w-0" 
            style={{
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
            onClick={(e) => {
              e.stopPropagation();
              openDetail(task.id);
            }}
          >
            <h3
              className={`text-sm font-medium text-gray-900 dark:text-gray-100 break-words ${
                task.completada ? 'line-through' : ''
              }`}
            >
              {task.titulo}
            </h3>

            {task.descripcion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                {task.descripcion}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2 mt-2">
              {task.fechaVencimiento && (
                <span
                  className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                    isOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">{format(new Date(task.fechaVencimiento), 'd MMM', { locale: es })}</span>
                </span>
              )}

              {task.labels && task.labels.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap" title={`Etiquetas: ${task.labels.map(tl => tl.label.nombre).join(', ')}`}>
                  {task.labels.slice(0, 3).map((tl) => (
                    <span
                      key={tl.labelId}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:opacity-90 transition-smooth cursor-pointer flex-shrink-0 backdrop-blur-sm shadow-sm"
                      style={{
                        backgroundColor: `${tl.label.color}20`,
                        color: tl.label.color,
                      }}
                      title={tl.label.nombre}
                    >
                      <Tag className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">{tl.label.nombre}</span>
                    </span>
                  ))}
                  {task.labels.length > 3 && (
                    <span
                      className="px-2 py-0.5 rounded text-xs text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-slate-800/70 cursor-pointer hover:bg-white/90 dark:hover:bg-slate-700 transition-smooth backdrop-blur-sm shadow-sm"
                      title={`Más etiquetas: ${task.labels.slice(3).map(tl => tl.label.nombre).join(', ')}`}
                    >
                      +{task.labels.length - 3}
                    </span>
                  )}
                </div>
              )}

              {priorityLabels[task.prioridad] && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0`}
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
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                >
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      subTasksOpen ? 'rotate-90' : ''
                    }`}
                  />
                  {completedSubTasks}/{totalSubTasks} completada{totalSubTasks !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {subTasksOpen && task.subTasks && task.subTasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {task.subTasks.map((subTask) => (
            <TaskItem key={subTask.id} task={subTask} depth={depth + 1} />
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

