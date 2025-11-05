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
import { useState, useEffect, useRef } from 'react';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useIsMobile } from '@/hooks/useMediaQuery';
import ContextMenu from './ContextMenu';
import LabelModal from './LabelModal';
import LabelManager from './LabelManager';
import type { ContextMenuItem } from '@/types/contextMenu';
import type { Label } from '@/types';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';

const PROJECT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function Sidebar() {
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const isMobile = useIsMobile();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [modalPos, setModalPos] = useState<{x:number;y:number}>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{x:number;y:number}>({ x: 0, y: 0 });
  const newProjectFormRef = useRef<HTMLFormElement | null>(null);
  const editProjectFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!showNewProjectModal) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      setModalPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragOffset, showNewProjectModal]);
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
      setDragging(false);
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
      <Modal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title="Editar proyecto"
        hideCloseButton
        size="sm"
        footer={(
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setEditingProject(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!editProjectName.trim() || updateProjectMutation.isPending}
              onClick={() => editProjectFormRef.current?.requestSubmit()}
            >
              {updateProjectMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      >
        <form
          ref={editProjectFormRef}
          onSubmit={(event) => {
            event.preventDefault();
            if (editingProject && editProjectName.trim()) {
              updateProjectMutation.mutate({
                id: editingProject,
                data: {
                  nombre: editProjectName.trim(),
                  color: editProjectColor,
                },
              });
            }
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nombre
            </label>
            <input
              type="text"
              value={editProjectName}
              onChange={(event) => setEditProjectName(event.target.value)}
              className="input-elevated"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditProjectColor(color)}
                  className={`h-9 w-9 rounded-full transition-transform ${
                    editProjectColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setEditingProject(null)}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </Button>
      </Modal>

      <Modal
        isOpen={showNewProjectModal}
        onClose={() => {
          setShowNewProjectModal(false);
          setDragging(false);
        }}
        title="Nuevo proyecto"
        hideCloseButton
        size="sm"
        style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
        footer={(
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewProjectModal(false);
                setDragging(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
              onClick={() => newProjectFormRef.current?.requestSubmit()}
            >
              {createProjectMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        )}
      >
        <div
          className="mb-6 h-10 cursor-move select-none rounded-lg bg-slate-100/60 dark:bg-slate-700/40"
          onMouseDown={(event) => {
            setDragging(true);
            setDragOffset({ x: event.clientX - modalPos.x, y: event.clientY - modalPos.y });
          }}
        />

        <form
          ref={newProjectFormRef}
          onSubmit={(event) => {
            event.preventDefault();
            if (newProjectName.trim()) {
              createProjectMutation.mutate({
                nombre: newProjectName.trim(),
                color: newProjectColor,
              });
            }
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nombre
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Ej: Trabajo, Personal, Estudios..."
              className="input-elevated"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewProjectColor(color)}
                  className={`h-9 w-9 rounded-full transition-transform ${
                    newProjectColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setShowNewProjectModal(false);
            setDragging(false);
          }}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </Button>
      </Modal>

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

