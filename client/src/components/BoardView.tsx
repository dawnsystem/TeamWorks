import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, List, LayoutGrid, ListPlus } from 'lucide-react';
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
} from '@dnd-kit/core';
import BoardColumn from './BoardColumn';
import TaskItem from './TaskItem';
import LabelFilter from './LabelFilter';
import SectionManager from './SectionManager';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { useTaskEditorStore, useUIStore } from '@/store/useStore';
import type { Task } from '@/types';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTasksTree } from '@/hooks/useTasksTree';

export default function BoardView() {
  const { id } = useParams();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const setProjectViewMode = useUIStore((state) => state.setProjectViewMode);
  const queryClient = useQueryClient();
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);

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

  const {
    tasksMap,
    sectionMap,
    tasksWithoutSection,
    isLoading,
  } = useTasksTree({ projectId: projectId ?? undefined, labelId: selectedLabelId });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksAPI.update(id, data).then(res => res.data),
    onSuccess: () => {
      // Invalidar solo las queries específicas del proyecto
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: () => {
      toast.error('Error al mover tarea');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: tasksAPI.reorder,
    onSuccess: () => {
      // Invalidar solo las queries específicas del proyecto
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: () => {
      toast.error('Error al reordenar tareas');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasksMap.get(event.active.id as string);
    setActiveTask(task || null);
  };

  const handleDragOver = () => {
    // Deshabilitado para evitar conflictos con el drag end
    // La actualización optimista se hará solo en handleDragEnd
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasksMap.get(active.id as string);
    if (!activeTask) return;

    // Determinar la sección destino
    let targetSectionId: string | null = null;
    
    if (over.id.toString().startsWith('section-')) {
      // Se soltó sobre una columna
      const sectionIdString = over.id.toString().replace('section-', '');
      targetSectionId = sectionIdString === 'no-section' ? null : sectionIdString;
    } else {
      // Se soltó sobre una tarea
      const overTask = tasksMap.get(over.id as string);
      targetSectionId = overTask?.sectionId || null;
    }

    // Si cambió de sección, actualizar
    if (activeTask.sectionId !== targetSectionId) {
      // Actualización optimista - actualizar la query actual
      const currentQueryKey = ['tasks', projectId, selectedLabelId];
      
      queryClient.setQueryData(currentQueryKey, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(t => 
          t.id === activeTask.id 
            ? { ...t, sectionId: targetSectionId }
            : t
        );
      });

      // Hacer la mutación en el servidor
      updateTaskMutation.mutate({
        id: activeTask.id,
        data: { sectionId: targetSectionId }
      }, {
        onSuccess: () => {
          // Refrescar todas las queries de tasks para mantener consistencia
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: () => {
          // Si hay error, revertir el cambio optimista
          queryClient.invalidateQueries({ queryKey: currentQueryKey });
        }
      });
      return; // Salir aquí para evitar conflictos con reordenamiento
    }

    // Si no cambió de sección pero cambió de posición, reordenar
    if (activeTask.sectionId === targetSectionId && active.id !== over.id) {
      const sectionTasks = (targetSectionId === null
        ? tasksWithoutSection
        : (sectionMap.get(targetSectionId) || [])
      ).filter((t) => !t.parentTaskId);

      const oldIndex = sectionTasks.findIndex(t => t.id === active.id);
      const newIndex = sectionTasks.findIndex(t => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reordenar tareas
      const reorderedTasks = [...sectionTasks];
      const [movedTask] = reorderedTasks.splice(oldIndex, 1);
      reorderedTasks.splice(newIndex, 0, movedTask);

      // Actualización optimista - actualizar la query actual
      const currentQueryKey = ['tasks', projectId, selectedLabelId];
      
      queryClient.setQueryData(currentQueryKey, (old: Task[] | undefined) => {
        if (!old) return old;
        
        // Crear un mapa de las nuevas posiciones
        const orderMap = new Map(reorderedTasks.map((task, index) => [task.id, index]));
        
        return old.map(t => {
          const newOrder = orderMap.get(t.id);
          return newOrder !== undefined ? { ...t, orden: newOrder } : t;
        });
      });

      // Crear array de actualizaciones
      const taskUpdates = reorderedTasks.map((task, index) => ({
        id: task.id,
        orden: index,
      }));

      reorderMutation.mutate(taskUpdates, {
        onSuccess: () => {
          // Refrescar todas las queries de tasks para mantener consistencia
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: () => {
          // Si hay error, revertir el cambio optimista
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedLabelId] });
        }
      });
    }
  };

  // Separar tareas por sección
  const sections = project?.sections || [];
  
  // Crear una sección "Sin sección" para las tareas sin sección
  const noSectionColumn = {
    id: 'no-section',
    nombre: 'Sin asignar',
    tasks: tasksWithoutSection,
  };

  // Crear columnas para cada sección
  const sectionColumns = sections.map((section) => ({
    id: section.id,
    nombre: section.nombre,
    tasks: (sectionMap.get(section.id) || []).filter((t) => !t.parentTaskId),
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

            {/* View Mode Switcher + Add Section Button */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {/* Add Section Button (Mobile) */}
              <button
                onClick={() => setIsSectionManagerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-sm text-sm font-medium"
                title="Agregar sección"
              >
                <ListPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sección</span>
              </button>

              {/* View Switcher */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
        <div 
          className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-6 w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 snap-x snap-mandatory scroll-smooth lg:snap-none" 
          style={{ minHeight: 0 }}
        >
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
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Agrega secciones para organizar tus tareas en columnas
                  </p>
                  <button
                    onClick={() => setIsSectionManagerOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Crear primera sección
                  </button>
                </div>
              </div>
            ) : (
              <>
                {columns.map((column) => (
                  <BoardColumn
                    key={column.id}
                    sectionId={column.id === 'no-section' ? null : column.id}
                    title={column.nombre}
                    tasks={column.tasks}
                    projectId={projectId || ''}
                  />
                ))}
                
                {/* Botón para agregar nueva sección */}
                <div className="flex-shrink-0 w-[85vw] sm:w-80 lg:w-96 snap-center">
                  <button
                    onClick={() => setIsSectionManagerOpen(true)}
                    className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-sm font-medium">Agregar Sección</span>
                  </button>
                </div>
              </>
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

      {/* Section Manager Modal */}
      <SectionManager
        isOpen={isSectionManagerOpen}
        onClose={() => setIsSectionManagerOpen(false)}
        projectId={projectId || ''}
      />
    </DndContext>
  );
}
