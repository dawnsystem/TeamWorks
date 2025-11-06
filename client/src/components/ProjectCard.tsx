import { useNavigate } from 'react-router-dom';
import type { Project, ProjectRole } from '@/types';
import { FolderOpen, Calendar, CheckCircle2, Users } from 'lucide-react';

interface ProjectCardProps {
  project: Project & { 
    _count?: { tasks?: number; collaborators?: number };
    tasks?: Array<{ id: string; completed?: boolean; completada?: boolean }>;
  };
  userRole: ProjectRole;
}

export default function ProjectCard({ project, userRole }: ProjectCardProps) {
  const navigate = useNavigate();

  // Calculate task completion
  const taskCount = project._count?.tasks || project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.completed || t.completada).length || 0;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div
      data-testid="project-card"
      className="glass-card p-5 rounded-xl cursor-pointer hover:-translate-y-1 transition-all"
      style={{
        borderLeft: `4px solid ${project.color}`,
      }}
      onClick={handleClick}
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
  );
}
