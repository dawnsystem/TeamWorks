import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Flag, Tag, Trash2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskEditorStore } from '@/store/useStore';
import { tasksAPI, projectsAPI, labelsAPI } from '@/lib/api';
import LabelModal from './LabelModal';

export default function TaskEditor() {
  const queryClient = useQueryClient();
  const { isOpen, taskId, projectId: defaultProjectId, sectionId: initialSectionId, parentTaskId, closeEditor } = useTaskEditorStore();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<1 | 2 | 3 | 4>(4);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSectionId || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);

  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskId ? tasksAPI.getOne(taskId).then(res => res.data) : null,
    enabled: !!taskId,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(res => res.data),
  });

  const { data: projectDetail } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? projectsAPI.getOne(projectId).then(res => res.data) : null,
    enabled: !!projectId,
  });

  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsAPI.getAll().then(res => res.data),
  });

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo);
      setDescripcion(task.descripcion || '');
      setPrioridad(task.prioridad);
      setFechaVencimiento(task.fechaVencimiento ? task.fechaVencimiento.split('T')[0] : '');
      setProjectId(task.projectId);
      setSelectedSectionId(task.sectionId || '');
      setSelectedLabels(
        // Compatibilidad: backend puede devolver task_labels o labels
        (task as any).task_labels?.map((tl: any) => tl.labelId) ||
        task.labels?.map((tl: any) => tl.labelId) ||
        []
      );
    } else {
      setTitulo('');
      setDescripcion('');
      setPrioridad(4);
      // Por defecto: hoy (YYYY-MM-DD) y proyecto Inbox si existe
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setFechaVencimiento(`${yyyy}-${mm}-${dd}`);
      setProjectId(defaultProjectId || projects?.find(p => p.nombre === 'Inbox')?.id || '');
      setSelectedSectionId('');
      setSelectedLabels([]);
    }
  }, [task, defaultProjectId, projects]);

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Tarea creada');
      closeEditor();
    },
    onError: (error: any) => {
      console.error('Error creating task:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear tarea';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.update(taskId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Tarea actualizada');
      closeEditor();
    },
    onError: (error: any) => {
      console.error('Error updating task:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al actualizar tarea';
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksAPI.delete(taskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Tarea eliminada');
      closeEditor();
    },
    onError: (error: any) => {
      console.error('Error deleting task:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al eliminar tarea';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!projectId) {
      toast.error('Selecciona un proyecto');
      return;
    }

    const data = {
      titulo,
      descripcion: descripcion || undefined,
      prioridad,
      fechaVencimiento: fechaVencimiento || undefined,
      projectId,
      sectionId: selectedSectionId || undefined,
      parentTaskId, // Incluir parentTaskId para subtareas
      labelIds: selectedLabels,
    };

    if (taskId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  const priorityOptions = [
    { value: 1, label: 'P1 - Alta', color: 'bg-priority-1' },
    { value: 2, label: 'P2 - Media', color: 'bg-priority-2' },
    { value: 3, label: 'P3 - Baja', color: 'bg-priority-3' },
    { value: 4, label: 'P4 - Ninguna', color: 'bg-priority-4' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {taskId ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button
            onClick={closeEditor}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre de la tarea"
              autoFocus
              className="w-full text-lg font-medium px-0 py-2 border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-red-500 focus:ring-0 outline-none dark:text-white"
            />
          </div>

          <div>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="w-4 h-4 inline mr-2" />
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Show project/section selector only if not creating a subtask */}
          {!parentTaskId ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                disabled={!!taskId && !!task?.parentTaskId}
              >
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nombre}
                  </option>
                ))}
              </select>

              {/* Selector de sección cuando hay proyecto seleccionado */}
              {!!projectId && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sección
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    <option value="">(Sin sección)</option>
                    {projectDetail?.sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📌 Se creará como subtarea
              </p>
              {/* Mostrar breadcrumb de sección si viene del contexto */}
              {sectionId && projectDetail?.sections && (
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                  En sección: {projectDetail.sections.find((s: any) => s.id === sectionId)?.nombre || 'Sin sección'}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag className="w-4 h-4 inline mr-2" />
                Etiquetas
              </label>
              <button
                type="button"
                onClick={() => setShowLabelModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition"
              >
                <Plus className="w-3 h-3" />
                Nueva etiqueta
              </button>
            </div>
            
            {labels && labels.length > 0 && (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar etiquetas..."
                    value={labelSearchQuery}
                    onChange={(e) => setLabelSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {labels
                    .filter(label => 
                      labelSearchQuery === '' || 
                      label.nombre.toLowerCase().includes(labelSearchQuery.toLowerCase())
                    )
                    .map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => {
                          if (selectedLabels.includes(label.id)) {
                            setSelectedLabels(selectedLabels.filter(id => id !== label.id));
                          } else {
                            setSelectedLabels([...selectedLabels, label.id]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          selectedLabels.includes(label.id)
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                        }}
                      >
                        {label.nombre}
                      </button>
                    ))}
                </div>
                
                {selectedLabels.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Seleccionadas ({selectedLabels.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedLabels.map(labelId => {
                        const label = labels.find(l => l.id === labelId);
                        return label ? (
                          <span
                            key={labelId}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: label.color,
                              color: 'white',
                            }}
                          >
                            {label.nombre}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {(!labels || labels.length === 0) && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay etiquetas. 
                <button
                  type="button"
                  onClick={() => setShowLabelModal(true)}
                  className="ml-1 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Crear la primera
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            {taskId && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                    deleteMutation.mutate();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {taskId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Label Modal */}
      <LabelModal isOpen={showLabelModal} onClose={() => setShowLabelModal(false)} />
    </div>
  );
}

