import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Flag, Tag, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskEditorStore } from '@/store/useStore';
import { tasksAPI, projectsAPI, labelsAPI } from '@/lib/api';
import LabelModal from './LabelModal';
import { Button, Modal, ScrollArea } from '@/components/ui';

export default function TaskEditor() {
  const queryClient = useQueryClient();
  const { isOpen, taskId, projectId: defaultProjectId, sectionId: initialSectionId, parentTaskId, closeEditor } = useTaskEditorStore();

  const formRef = useRef<HTMLFormElement | null>(null);

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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (response.data?.automationNotes?.length) {
        response.data.automationNotes.forEach((note: string) => toast.success(note));
      } else {
        toast.success('Tarea creada');
      }
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (response.data?.automationNotes?.length) {
        response.data.automationNotes.forEach((note: string) => toast.success(note));
      } else {
        toast.success('Tarea actualizada');
      }
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

  const handleDelete = () => {
    if (!taskId) return;
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      deleteMutation.mutate();
    }
  };

  const submitDisabled = createMutation.isPending || updateMutation.isPending;

  const modalFooter = (
    <div className="flex w-full items-center justify-between gap-3">
      {taskId ? (
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={closeEditor}>
          Cancelar
        </Button>
        <Button
          onClick={() => formRef.current?.requestSubmit()}
          disabled={submitDisabled}
        >
          {submitDisabled ? (taskId ? 'Guardando...' : 'Creando...') : taskId ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeEditor}
        title={taskId ? 'Editar tarea' : 'Nueva tarea'}
        size="xl"
        footer={modalFooter}
      >
        <ScrollArea className="max-h-[70vh] pr-2">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="space-y-3">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre de la tarea"
              autoFocus
              className="input-elevated text-lg font-semibold bg-transparent"
            />

            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe los detalles, notas o próximos pasos"
              rows={4}
              className="input-elevated resize-none min-h-[120px]"
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
                className="input-elevated bg-transparent"
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
                className="input-elevated"
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
                className="input-elevated bg-transparent"
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
                    className="input-elevated bg-transparent"
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
              {initialSectionId && projectDetail?.sections && (
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                  En sección: {projectDetail.sections.find((s: any) => s.id === initialSectionId)?.nombre || 'Sin sección'}
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
                    className="input-elevated pl-10"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
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
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-smooth shadow-sm backdrop-blur ${
                          selectedLabels.includes(label.id)
                            ? 'ring-2 ring-offset-1 ring-offset-white/70 dark:ring-offset-slate-900/70'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${label.color}22`,
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
          </form>
        </ScrollArea>
      </Modal>

      <LabelModal isOpen={showLabelModal} onClose={() => setShowLabelModal(false)} />
    </>
  );
}

