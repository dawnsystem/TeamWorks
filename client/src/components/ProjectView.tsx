import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TaskList from './TaskList';
import { projectsAPI, tasksAPI } from '@/lib/api';
import { useTaskEditorStore } from '@/store/useStore';

export default function ProjectView() {
  const { id } = useParams();
  const openEditor = useTaskEditorStore((state) => state.openEditor);

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
    queryKey: ['tasks', projectId],
    queryFn: () => tasksAPI.getAll({ projectId: projectId! }).then(res => res.data),
    enabled: !!projectId,
  });

  // Separar tareas por sección
  const tasksWithoutSection = tasks?.filter(t => !t.sectionId && !t.parentTaskId) || [];
  const sections = project?.sections || [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {project && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {project?.nombre || 'Inbox'}
          </h1>
        </div>
        
        <button
          onClick={() => openEditor({ projectId })}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mt-4"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar tarea</span>
        </button>
      </div>

      {/* Tareas sin sección */}
      {tasksWithoutSection.length > 0 && (
        <div className="mb-8">
          <TaskList
            tasks={tasksWithoutSection}
            loading={isLoading}
            emptyMessage="No hay tareas en este proyecto"
          />
        </div>
      )}

      {/* Secciones con tareas */}
      {sections.map((section) => {
        const sectionTasks = tasks?.filter(t => t.sectionId === section.id && !t.parentTaskId) || [];
        
        if (sectionTasks.length === 0) return null;

        return (
          <div key={section.id} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {section.nombre}
              </h2>
              <button
                onClick={() => openEditor({ projectId, sectionId: section.id })}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <TaskList tasks={sectionTasks} />
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
    </div>
  );
}

