import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Project, ProjectRole } from '@/types';
import { FolderOpen, Calendar, CheckCircle2, Users, MoreVertical, Edit, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project & { 
    _count?: { tasks?: number; collaborators?: number };
    tasks?: Array<{ id: string; completed?: boolean; completada?: boolean }>;
  };
  userRole: ProjectRole;
  onEdit?: (project: Project) => void;
  onArchive?: (projectId: string) => void;
}

export default function ProjectCard({ project, userRole, onEdit, onArchive }: ProjectCardProps) {
  const navigate = useNavigate();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Calculate task completion
  const taskCount = project._count?.tasks || project.tasks?.length || 0;
  // Note: 'completada' is the Spanish property name used in the database,
  // while 'completed' might be used in TypeScript types. Supporting both for compatibility.
  const completedTasks = project.tasks?.filter(t => t.completada || t.completed).length || 0;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  const canEdit = userRole === 'owner' || userRole === 'manager' || userRole === 'editor';
  const canArchive = userRole === 'owner' || userRole === 'manager';

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking context menu
    if (showContextMenu) return;
    navigate(`/projects/${project.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    onEdit?.(project);
  };

  const handleArchive = () => {
    setShowContextMenu(false);
    onArchive?.(project.id);
  };

  // Close context menu when clicking outside
  const handleClickOutside = () => {
    setShowContextMenu(false);
  };

  return (
    <>
      <div
        data-testid="project-card"
        className="glass-card p-5 rounded-xl cursor-pointer hover:-translate-y-1 transition-all relative"
        style={{
          borderLeft: `4px solid ${project.color}`,
          borderColor: project.color,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{project.icono || '📋'}</span>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {project.nombre}
            </h3>
            
            {project.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {project.descripcion}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              {taskCount > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{taskCount} tareas ({progress}%)</span>
                </div>
              )}

              {project._count?.collaborators && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{project._count.collaborators} colaboradores</span>
                </div>
              )}

              {project.updatedAt && (
                <div className="flex items-center gap-1">
                  <span>Actualizado {format(new Date(project.updatedAt), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              )}

              <div className="flex items-center gap-1 ml-auto">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                  {userRole}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {taskCount > 0 && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClickOutside}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[150px]"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
          >
            {canEdit && (
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            {canArchive && (
              <button
                onClick={handleArchive}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archivar
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
