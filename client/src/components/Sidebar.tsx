import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Inbox, 
  Calendar, 
  CalendarDays, 
  FolderPlus, 
  ChevronRight,
  Tag,
  X,
  Edit,
  Copy,
  Trash2,
  FolderOpen,
  Link2,
  Plus
} from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { projectsAPI, labelsAPI } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useIsMobile } from '@/hooks/useMediaQuery';
import ContextMenu from './ContextMenu';
import LabelModal from './LabelModal';
import LabelManager from './LabelManager';
import type { ContextMenuItem } from '@/types/contextMenu';
import type { Label } from '@/types';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const isMobile = useIsMobile();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);

  const queryClient = useQueryClient();
  const projectContextMenu = useContextMenu();
  const labelContextMenu = useContextMenu();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });

  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { nombre: string; color: string }) => projectsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectColor('#3b82f6');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nombre: string; color: string } }) => 
      projectsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      toast.success('Proyecto actualizado');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Proyecto eliminado');
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => labelsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Etiqueta eliminada');
    },
  });

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setSidebarOpen]);

  if (!sidebarOpen) return null;

  const navItems = [
    { icon: Inbox, label: 'Inbox', path: '/', color: 'text-blue-600' },
    { icon: Calendar, label: 'Hoy', path: '/today', color: 'text-green-600' },
    { icon: CalendarDays, label: 'Próximos 7 días', path: '/week', color: 'text-purple-600' },
  ];

  const getProjectContextMenuItems = (projectId: string): ContextMenuItem[] => {
    const project = projects?.find(p => p.id === projectId);
    if (!project) return [];

    return [
      {
        id: 'open',
        label: 'Abrir proyecto',
        icon: FolderOpen,
        onClick: () => window.location.href = `/project/${projectId}`,
      },
      {
        id: 'edit',
        label: 'Editar nombre y color',
        icon: Edit,
        onClick: () => {
          setEditingProject(projectId);
          setEditProjectName(project.nombre);
          setEditProjectColor(project.color);
        },
        separator: true,
      },
      {
        id: 'copy',
        label: 'Duplicar proyecto',
        icon: Copy,
        onClick: () => {
          createProjectMutation.mutate({
            nombre: `${project.nombre} (copia)`,
            color: project.color,
          });
        },
      },
      {
        id: 'link',
        label: 'Copiar enlace',
        icon: Link2,
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`);
          toast.success('Enlace copiado');
        },
        separator: true,
      },
      {
        id: 'delete',
        label: 'Eliminar proyecto',
        icon: Trash2,
        onClick: () => deleteProjectMutation.mutate(projectId),
        danger: true,
        requireConfirm: true,
        disabled: project.nombre === 'Inbox',
      },
    ];
  };

  const getLabelContextMenuItems = (labelId: string): ContextMenuItem[] => {
    const label = labels?.find(l => l.id === labelId);
    if (!label) return [];

    return [
      {
        id: 'filter',
        label: 'Ver tareas con esta etiqueta',
        icon: Tag,
        onClick: () => toast.success('Función próximamente'),
      },
      {
        id: 'edit',
        label: 'Editar etiqueta',
        icon: Edit,
        onClick: () => {
          setEditingLabel(label);
          setShowLabelModal(true);
        },
        separator: true,
      },
      {
        id: 'delete',
        label: 'Eliminar etiqueta',
        icon: Trash2,
        onClick: () => deleteLabelMutation.mutate(labelId),
        danger: true,
        requireConfirm: true,
      },
    ];
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
        ${isMobile ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300' : ''}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TeamWorks</h1>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? '' : item.color}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <span>Proyectos</span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                projectsExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          {projectsExpanded && (
            <div className="mt-1 space-y-1">
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    location.pathname === `/project/${project.id}`
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onContextMenu={(e) => {
                    setSelectedProjectId(project.id);
                    projectContextMenu.show(e);
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-sm">{project.nombre}</span>
                  {project._count && project._count.tasks > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {project._count.tasks}
                    </span>
                  )}
                </Link>
              ))}

              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm">Nuevo proyecto</span>
              </button>
            </div>
          )}
        </div>

        {labels && labels.length > 0 && (
          <div className="pt-6">
            <button
              onClick={() => setLabelsExpanded(!labelsExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <span>Etiquetas</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  labelsExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>

            {labelsExpanded && (
              <div className="mt-1 space-y-1">
                {labels.map((label) => (
                  <Link
                    key={label.id}
                    to={`/label/${label.id}`}
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full"
                    onContextMenu={(e) => {
                      setSelectedLabelId(label.id);
                      labelContextMenu.show(e);
                    }}
                  >
                    <Tag className="w-4 h-4" style={{ color: label.color }} />
                    <span className="text-sm">{label.nombre}</span>
                    {label._count && label._count.tasks > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {label._count.tasks}
                      </span>
                    )}
                  </Link>
                ))}

                <button
                  onClick={() => {
                    setEditingLabel(null);
                    setShowLabelModal(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Nueva etiqueta</span>
                </button>
                <button
                  onClick={() => setShowLabelManager(true)}
                  className="flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full"
                  title="Gestionar todas las etiquetas"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">Gestionar etiquetas</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Context Menus */}
      {projectContextMenu.isVisible && selectedProjectId && (
        <ContextMenu
          items={getProjectContextMenuItems(selectedProjectId)}
          position={projectContextMenu.position}
          onClose={projectContextMenu.hide}
        />
      )}

      {labelContextMenu.isVisible && selectedLabelId && (
        <ContextMenu
          items={getLabelContextMenuItems(selectedLabelId)}
          position={labelContextMenu.position}
          onClose={labelContextMenu.hide}
        />
      )}

      {/* Modal Editar Proyecto */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingProject(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Proyecto</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editProjectName.trim()) {
                  updateProjectMutation.mutate({
                    id: editingProject,
                    data: {
                      nombre: editProjectName.trim(),
                      color: editProjectColor,
                    },
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditProjectColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          editProjectColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editProjectName.trim() || updateProjectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {updateProjectMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proyecto */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewProjectModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Proyecto</h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newProjectName.trim()) {
                  createProjectMutation.mutate({
                    nombre: newProjectName.trim(),
                    color: newProjectColor,
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ej: Trabajo, Personal, Estudios..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          newProjectColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || createProjectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {createProjectMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Etiqueta */}
      <LabelModal
        isOpen={showLabelModal}
        onClose={() => {
          setShowLabelModal(false);
          setEditingLabel(null);
        }}
        editLabel={editingLabel}
      />

      {/* Label Manager */}
      <LabelManager
        isOpen={showLabelManager}
        onClose={() => setShowLabelManager(false)}
      />
    </aside>
    </>
  );
}

