import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Copy, Archive, ListPlus, BarChart3, List, LayoutGrid } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskList from './TaskList';
import TaskItem from './TaskItem';
import LabelFilter from './LabelFilter';
import BoardView from './BoardView';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { useTaskEditorStore, useUIStore } from '@/store/useStore';
import { useContextMenu } from '@/hooks/useContextMenu';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from '@/types/contextMenu';
import type { Task } from '@/types';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProjectView() {
  const { id } = useParams();
  const openEditor = useTaskEditorStore((state) => state.openEditor);
  const projectViewMode = useUIStore((state) => state.projectViewMode) as 'list' | 'board';
  const setProjectViewMode = useUIStore((state) => state.setProjectViewMode);
  const queryClient = useQueryClient();
  const sectionContextMenu = useContextMenu();
  const projectHeaderContextMenu = useContextMenu();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
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

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => projectsAPI.deleteSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Sección eliminada');
    },
  });

  const archiveCompletedTasksMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const sectionTasks = tasks?.filter(t => t.sectionId === sectionId && t.completada) || [];
      await Promise.all(sectionTasks.map(task => tasksAPI.delete(task.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tareas completadas archivadas');
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
    // Close any open context menus when dragging starts
    sectionContextMenu.hide();
    projectHeaderContextMenu.hide();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const allTasks = tasks || [];
    const activeTask = allTasks.find(t => t.id === active.id);

    if (!activeTask) return;

    // Get tasks in the same context (same section or no section)
    const contextTasks = allTasks.filter(t => 
      t.sectionId === activeTask.sectionId && !t.parentTaskId
    );

    const oldIndex = contextTasks.findIndex(t => t.id === active.id);
    const newIndex = contextTasks.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder tasks
    const reorderedTasks = [...contextTasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Create update array with new order values
    const taskUpdates = reorderedTasks.map((task, index) => ({
      id: task.id,
      orden: index,
    }));

    reorderMutation.mutate(taskUpdates);
  };

  // Separar tareas por sección
  const tasksWithoutSection = tasks?.filter(t => !t.sectionId && !t.parentTaskId) || [];
  const sections = project?.sections || [];

  // Si estamos en modo tablero, renderizar BoardView
  if (projectViewMode === 'board') {
    return <BoardView />;
  }

  const getProjectHeaderContextMenuItems = (): ContextMenuItem[] => {
    if (!project) return [];

    return [
      {
        id: 'edit',
        label: 'Editar proyecto',
        icon: Edit,
        onClick: () => toast.success('Función próximamente'),
      },
      {
        id: 'add-section',
        label: 'Añadir sección',
        icon: ListPlus,
        onClick: () => toast.success('Función próximamente'),
        separator: true,
      },
      {
        id: 'copy-link',
        label: 'Copiar enlace',
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`);
          toast.success('Enlace copiado');
        },
      },
      {
        id: 'stats',
        label: 'Ver estadísticas',
        icon: BarChart3,
        onClick: () => toast.success('Función próximamente'),
      },
    ];
  };

  const getSectionContextMenuItems = (sectionId: string): ContextMenuItem[] => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return [];

    const sectionTasks = tasks?.filter(t => t.sectionId === sectionId && t.completada) || [];
    const hasCompletedTasks = sectionTasks.length > 0;

    return [
      {
        id: 'add-task',
        label: 'Añadir tarea',
        icon: Plus,
        onClick: () => openEditor({ projectId, sectionId }),
        separator: true,
      },
      {
        id: 'edit',
        label: 'Editar nombre',
        icon: Edit,
        onClick: () => toast.success('Función próximamente'),
      },
      {
        id: 'archive',
        label: 'Archivar completadas',
        icon: Archive,
        onClick: () => archiveCompletedTasksMutation.mutate(sectionId),
        disabled: !hasCompletedTasks,
        separator: true,
      },
      {
        id: 'delete',
        label: 'Eliminar sección',
        icon: Trash2,
        onClick: () => deleteSectionMutation.mutate(sectionId),
        danger: true,
        requireConfirm: true,
      },
    ];
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-5xl mx-auto p-4 sm:p-6 w-full" style={{ overscrollBehavior: 'contain' }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 gap-4 flex-wrap sm:flex-nowrap">
            <div 
              className="flex items-center gap-3 group min-w-0"
              onContextMenu={projectHeaderContextMenu.show}
            >
              {project && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition cursor-context-menu truncate">
                {project?.nombre || 'Inbox'}
              </h1>
            </div>

            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setProjectViewMode('list')}
                className={`p-2 rounded transition ${
                  projectViewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setProjectViewMode('board')}
                className={
                  projectViewMode !== 'list'
                    ? 'p-2 rounded transition bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow'
                    : 'p-2 rounded transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }
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
        </div>

        <LabelFilter 
          selectedLabelId={selectedLabelId}
          onSelectLabel={setSelectedLabelId}
        />

        {/* Tareas sin sección */}
        {tasksWithoutSection.length > 0 && (
          <div className="mb-8">
            <SortableContext
              items={tasksWithoutSection.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <TaskList
                tasks={tasksWithoutSection}
                loading={isLoading}
                emptyMessage="No hay tareas en este proyecto"
              />
            </SortableContext>
          </div>
        )}

        {/* Secciones con tareas */}
        {sections.map((section) => {
          const sectionTasks = tasks?.filter(t => t.sectionId === section.id && !t.parentTaskId) || [];
          
          if (sectionTasks.length === 0) return null;

          return (
            <div key={section.id} className="mb-8">
              <div 
                className="flex items-center justify-between mb-4 group"
                onContextMenu={(e) => {
                  setSelectedSectionId(section.id);
                  sectionContextMenu.show(e);
                }}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition cursor-context-menu">
                  {section.nombre}
                </h2>
                <button
                  onClick={() => openEditor({ projectId, sectionId: section.id })}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <SortableContext
                items={sectionTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskList tasks={sectionTasks} />
              </SortableContext>
            </div>
          );
        })}

        {!isLoading && tasks?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay tareas en este proyecto
            </p>
            <button
              onClick={() => openEditor({ projectId })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Plus className="w-4 h-4" />
              Crear primera tarea
            </button>
          </div>
        )}

        {projectHeaderContextMenu.isVisible && (
          <ContextMenu
            items={getProjectHeaderContextMenuItems()}
            position={projectHeaderContextMenu.position}
            onClose={projectHeaderContextMenu.hide}
          />
        )}

        {sectionContextMenu.isVisible && selectedSectionId && (
          <ContextMenu
            items={getSectionContextMenuItems(selectedSectionId)}
            position={sectionContextMenu.position}
            onClose={sectionContextMenu.hide}
          />
        )}
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

