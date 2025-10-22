import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, List, LayoutGrid } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from '@dnd-kit/core';
import BoardColumn from './BoardColumn';
import TaskItem from './TaskItem';
import LabelFilter from './LabelFilter';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { useTaskEditorStore, useUIStore } from '@/store/useStore';
import type { Task } from '@/types';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BoardView() {
  const { id } = useParams();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const setProjectViewMode = useUIStore((state) => state.setProjectViewMode);
  const queryClient = useQueryClient();
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensors for drag and drop
  // MouseSensor for desktop (no delay) and TouchSensor for mobile (with delay for scrolling)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Si no hay ID, buscar el proyecto Inbox
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });

  const inboxProject = projects?.find(p => p.nombre === 'Inbox');
  const projectId = id || inboxProject?.id;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? projectsAPI.getOne(projectId).then(res => res.data) : null,
    enabled: !!projectId,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId, selectedLabelId],
    queryFn: () => tasksAPI.getAll({ 
      projectId: projectId!,
      labelId: selectedLabelId || undefined
    }).then(res => res.data),
    enabled: !!projectId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      toast.error('Error al mover tarea');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: tasksAPI.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      toast.error('Error al reordenar tareas');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks?.find(t => t.id === active.id);
    const overTask = tasks?.find(t => t.id === over.id);

    if (!activeTask) return;

    // Si estamos sobre una columna (sección)
    if (over.id.toString().startsWith('section-')) {
      const sectionId = over.id.toString().replace('section-', '');
      if (activeTask.sectionId !== sectionId) {
        // Actualizar optimísticamente
        queryClient.setQueryData(['tasks', projectId, selectedLabelId], (old: Task[] | undefined) => {
          if (!old) return old;
          return old.map(t => 
            t.id === activeTask.id 
              ? { ...t, sectionId }
              : t
          );
        });
      }
    }
    // Si estamos sobre una tarea
    else if (overTask && overTask.sectionId !== activeTask.sectionId) {
      // Mover a la misma sección que la tarea sobre la que estamos
      queryClient.setQueryData(['tasks', projectId, selectedLabelId], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(t => 
          t.id === activeTask.id 
            ? { ...t, sectionId: overTask.sectionId }
            : t
        );
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks?.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determinar la sección destino
    let targetSectionId: string | null = null;
    
    if (over.id.toString().startsWith('section-')) {
      // Se soltó sobre una columna
      targetSectionId = over.id.toString().replace('section-', '') || null;
    } else {
      // Se soltó sobre una tarea
      const overTask = tasks?.find(t => t.id === over.id);
      targetSectionId = overTask?.sectionId || null;
    }

    // Si cambió de sección, actualizar
    if (activeTask.sectionId !== targetSectionId) {
      updateTaskMutation.mutate({
        id: activeTask.id,
        data: { sectionId: targetSectionId }
      });
    }

    // Si no cambió de sección pero cambió de posición, reordenar
    if (activeTask.sectionId === targetSectionId && active.id !== over.id) {
      const sectionTasks = tasks?.filter(t => 
        t.sectionId === targetSectionId && !t.parentTaskId
      ) || [];

      const oldIndex = sectionTasks.findIndex(t => t.id === active.id);
      const newIndex = sectionTasks.findIndex(t => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reordenar tareas
      const reorderedTasks = [...sectionTasks];
      const [movedTask] = reorderedTasks.splice(oldIndex, 1);
      reorderedTasks.splice(newIndex, 0, movedTask);

      // Crear array de actualizaciones
      const taskUpdates = reorderedTasks.map((task, index) => ({
        id: task.id,
        orden: index,
      }));

      reorderMutation.mutate(taskUpdates);
    }
  };

  // Separar tareas por sección
  const sections = project?.sections || [];
  
  // Crear una sección "Sin sección" para las tareas sin sección
  const noSectionColumn = {
    id: 'no-section',
    nombre: 'Sin sección',
    tasks: tasks?.filter(t => !t.sectionId && !t.parentTaskId) || [],
  };

  // Crear columnas para cada sección
  const sectionColumns = sections.map(section => ({
    id: section.id,
    nombre: section.nombre,
    tasks: tasks?.filter(t => t.sectionId === section.id && !t.parentTaskId) || [],
  }));

  // Combinar todas las columnas
  const columns = noSectionColumn.tasks.length > 0 
    ? [noSectionColumn, ...sectionColumns]
    : sectionColumns;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col w-full overflow-hidden" style={{ overscrollBehavior: 'contain', height: 'calc(100% - 64px)' }}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-4">
          <div className="flex items-center justify-between mb-2 gap-4 flex-wrap sm:flex-nowrap min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              {project && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {project?.nombre || 'Inbox'}
              </h1>
            </div>

            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setProjectViewMode('list')}
                className="p-2 rounded transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setProjectViewMode('board')}
                className="p-2 rounded transition bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow"
                title="Vista de tablero"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => openEditor({ projectId })}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mt-4"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar tarea</span>
          </button>

          <div className="mt-4">
            <LabelFilter 
              selectedLabelId={selectedLabelId}
              onSelectLabel={setSelectedLabelId}
            />
          </div>
        </div>

        {/* Board Columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-6 w-full" style={{ minHeight: 0 }}>
          <div className="flex gap-4 h-full min-w-min">
            {isLoading ? (
              <div className="flex items-center justify-center w-full">
                <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
              </div>
            ) : columns.length === 0 ? (
              <div className="flex items-center justify-center w-full">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No hay secciones en este proyecto
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Agrega secciones para organizar tus tareas en columnas
                  </p>
                </div>
              </div>
            ) : (
              columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  sectionId={column.id === 'no-section' ? null : column.id}
                  title={column.nombre}
                  tasks={column.tasks}
                  projectId={projectId || ''}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-3 scale-105 shadow-2xl">
            <TaskItem task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
