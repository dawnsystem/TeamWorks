import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Copy, Archive, ListPlus, BarChart3, List, LayoutGrid, Share2 } from 'lucide-react';
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
import SectionManager from './SectionManager';
import { projectsAPI, tasksAPI, projectSharesAPI } from '@/lib/api';
import { useTaskEditorStore, useUIStore } from '@/store/useStore';
import { useContextMenu } from '@/hooks/useContextMenu';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from '@/types/contextMenu';
import type { Task, ProjectRole } from '@/types';
import { useState, lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import { useTasksTree } from '@/hooks/useTasksTree';

const BoardViewLazy = lazy(() => import('./BoardView'));
const ProjectShareModalLazy = lazy(() => import('./ProjectShareModal').then((module) => ({ default: module.ProjectShareModal })));

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
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isSectionManagerOpen, setSectionManagerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');

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

  const projectRole: ProjectRole = project?.currentUserRole ?? 'owner';
  const canManageProject = projectRole === 'owner' || projectRole === 'manager';
  const canWriteProject = projectRole === 'owner' || projectRole === 'manager' || projectRole === 'editor';

  const { data: projectShares = [], refetch: refetchShares } = useQuery({
    queryKey: ['project', projectId, 'shares'],
    queryFn: () => projectId ? projectSharesAPI.list(projectId).then(res => res.data) : [],
    enabled: isShareModalOpen && !!projectId && canManageProject,
  });

  const {
    tasks: rootTasks,
    tasksMap,
    sectionMap,
    tasksWithoutSection,
    isLoading: isTasksLoading,
  } = useTasksTree({ projectId: projectId ?? undefined, labelId: selectedLabelId });
  const tasks = rootTasks;
  const isLoading = isTasksLoading;

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
      const sectionTasks = (sectionMap.get(sectionId) || []).filter((t) => t.completada);
      await Promise.all(sectionTasks.map((task) => tasksAPI.delete(task.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tareas completadas archivadas');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: { nombre?: string; color?: string }) =>
      projectsAPI.update(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Proyecto actualizado');
      setIsEditingProjectName(false);
    },
    onError: () => {
      toast.error('Error al actualizar el proyecto');
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
    if (!canWriteProject) return;
    const task = tasksMap.get(event.active.id as string);
    setActiveTask(task || null);
    // Close any open context menus when dragging starts
    sectionContextMenu.hide();
    projectHeaderContextMenu.hide();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canWriteProject) return;
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
  const sections = project?.sections || [];

  // Si estamos en modo tablero, renderizar BoardView
  if (projectViewMode === 'board') {
    return (
      <Suspense fallback={<div className="p-6 text-center text-gray-500 dark:text-gray-400">Cargando tablero...</div>}>
        <BoardViewLazy />
      </Suspense>
    );
  }

  const getProjectHeaderContextMenuItems = (): ContextMenuItem[] => {
    if (!project) return [];

    const items: ContextMenuItem[] = [];

    if (canWriteProject) {
      items.push(
        {
          id: 'edit',
          label: 'Editar proyecto',
          icon: Edit,
          onClick: () => {
            setIsEditingProjectName(true);
            setProjectNameInput(project.nombre);
          },
        },
        {
          id: 'add-section',
          label: 'Añadir sección',
          icon: ListPlus,
          onClick: () => {
            setEditingSection(null);
            setSectionManagerOpen(true);
          },
          separator: true,
        },
      );
    }

    items.push(
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
        onClick: () => {
          // Show basic statistics
          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter(t => t.completada).length || 0;
          const pendingTasks = totalTasks - completedTasks;
          toast.success(
            `📊 Estadísticas: ${totalTasks} total, ${completedTasks} completadas, ${pendingTasks} pendientes`,
            { duration: 5000 }
          );
        },
      },
    );

    return items;
  };

  const getSectionContextMenuItems = (sectionId: string): ContextMenuItem[] => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return [];

    const sectionTasks = sectionMap.get(sectionId) || [];
    const hasCompletedTasks = sectionTasks.some((t) => t.completada);

    return [
      {
        id: 'add-task',
        label: 'Añadir tarea',
        icon: Plus,
        onClick: () => {
          if (!canWriteProject) return;
          openEditor({ projectId, sectionId });
        },
        disabled: !canWriteProject,
        separator: true,
      },
      {
        id: 'edit',
        label: 'Editar nombre',
        icon: Edit,
        onClick: () => {
          setEditingSection(section);
          setSectionManagerOpen(true);
        },
        disabled: !canManageProject,
      },
      {
        id: 'archive',
        label: 'Archivar completadas',
        icon: Archive,
        onClick: () => {
          if (!canWriteProject) return;
          archiveCompletedTasksMutation.mutate(sectionId);
        },
        disabled: !hasCompletedTasks || !canWriteProject,
        separator: true,
      },
      {
        id: 'delete',
        label: 'Eliminar sección',
        icon: Trash2,
        onClick: () => {
          if (!canManageProject) {
            toast.error('No tienes permisos para eliminar secciones');
            return;
          }
          deleteSectionMutation.mutate(sectionId);
        },
        danger: true,
        requireConfirm: true,
        disabled: !canManageProject,
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
              {isEditingProjectName && project ? (
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  onBlur={() => {
                    if (projectNameInput.trim() && projectNameInput !== project.nombre) {
                      updateProjectMutation.mutate({ nombre: projectNameInput.trim() });
                    } else {
                      setIsEditingProjectName(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setIsEditingProjectName(false);
                      setProjectNameInput(project.nombre);
                    }
                  }}
                  autoFocus
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-red-500 outline-none px-1"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition cursor-context-menu truncate">
                  {project?.nombre || 'Inbox'}
                </h1>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {canManageProject && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="ui-button ui-button--ghost flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartir</span>
                </button>
              )}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
          </div>
          
          {canWriteProject && (
            <button
              onClick={() => openEditor({ projectId })}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar tarea</span>
            </button>
          )}
        </div>

        <LabelFilter 
          selectedLabelId={selectedLabelId}
          onSelectLabel={setSelectedLabelId}
        />

        {/* Sección virtual: Sin asignar */}
        {tasksWithoutSection.length > 0 && (
          <div className="mb-8">
            <div 
              className="flex items-center justify-between mb-4 group"
              onContextMenu={(e) => {
                setSelectedSectionId('unassigned');
                sectionContextMenu.show(e);
              }}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition cursor-context-menu">
                Sin asignar
              </h2>
              {canWriteProject && (
                <button
                  onClick={() => openEditor({ projectId })}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <SortableContext
              items={tasksWithoutSection.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <TaskList
                tasks={tasksWithoutSection}
                loading={isLoading}
                emptyMessage="No hay tareas sin asignar"
                projectRole={projectRole}
              />
            </SortableContext>
          </div>
        )}

        {/* Secciones con tareas */}
        {sections.map((section) => {
          const sectionTasks = sectionMap.get(section.id) || [];
          
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
                {canWriteProject && (
                  <button
                    onClick={() => openEditor({ projectId, sectionId: section.id })}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <SortableContext
                items={sectionTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <TaskList tasks={sectionTasks} projectRole={projectRole} />
              </SortableContext>
            </div>
          );
        })}

        {!isLoading && tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay tareas en este proyecto
            </p>
            {canWriteProject && (
              <button
                onClick={() => openEditor({ projectId })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Plus className="w-4 h-4" />
                Crear primera tarea
              </button>
            )}
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

        {canManageProject && (
          <Suspense fallback={null}>
            <ProjectShareModalLazy
              project={project}
              shares={projectShares}
              isOpen={isShareModalOpen}
              onClose={() => setShareModalOpen(false)}
              refetch={refetchShares}
            />
          </Suspense>
        )}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-3 scale-105 shadow-2xl">
            <TaskItem task={activeTask} role={projectRole} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Section Manager Modal */}
      {projectId && (
        <SectionManager
          isOpen={isSectionManagerOpen}
          onClose={() => {
            setSectionManagerOpen(false);
            setEditingSection(null);
          }}
          projectId={projectId}
          section={editingSection}
        />
      )}
    </DndContext>
  );
}

