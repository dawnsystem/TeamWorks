import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Send, Sparkles, Loader2, CheckCircle2, AlertCircle, ClipboardList, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAIStore, useSettingsStore } from '@/store/useStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { aiAPI, projectsAPI } from '@/lib/api';
import type { AIAction, AIPlan, AIPlannerResponse, Project } from '@/types';
import { Button, Input, Select, ScrollArea, Card } from '@/components/ui';

const formatDateFromToday = (days?: number) => {
  if (typeof days !== 'number' || Number.isNaN(days)) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, Math.floor(days)));
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const priorityFromPlan = (value?: number) => {
  if (typeof value !== 'number') return 3 as 1 | 2 | 3 | 4;
  const clamped = Math.min(Math.max(Math.round(value), 1), 4) as 1 | 2 | 3 | 4;
  return clamped;
};

export default function AIAssistant() {
  const queryClient = useQueryClient();
  const { isOpen, autoExecute, toggleAI, setAutoExecute } = useAIStore();
  const aiProvider = useSettingsStore((state) => state.aiProvider);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'assistant' | 'planner'>('assistant');

  // Assistant state
  const [command, setCommand] = useState('');
  const [actions, setActions] = useState<AIAction[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [providerUsed, setProviderUsed] = useState<string>(aiProvider);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);

  // Planner state
  const [plannerGoal, setPlannerGoal] = useState('');
  const [plannerMode, setPlannerMode] = useState<'auto' | 'interactive'>('auto');
  const [plannerQuestions, setPlannerQuestions] = useState<string[]>([]);
  const [plannerAnswers, setPlannerAnswers] = useState<string[]>([]);
  const [plannerPlan, setPlannerPlan] = useState<AIPlan | null>(null);
  const [plannerNotes, setPlannerNotes] = useState<string[]>([]);
  const [plannerProvider, setPlannerProvider] = useState<string | null>(null);
  const [plannerProjectId, setPlannerProjectId] = useState<string>('');
  const [plannerSectionId, setPlannerSectionId] = useState<string>('');

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then((res) => res.data),
    staleTime: 1000 * 60,
  });

  const { data: projectDetail } = useQuery({
    queryKey: ['planner-project', plannerProjectId],
    queryFn: () => projectsAPI.getOne(plannerProjectId).then((res) => res.data),
    enabled: Boolean(plannerProjectId),
  });

  useEffect(() => {
    if (!plannerProjectId && projects && projects.length > 0) {
      setPlannerProjectId(projects[0].id);
    }
  }, [projects, plannerProjectId]);

  useEffect(() => {
    if (projectDetail?.sections?.length) {
      setPlannerSectionId(projectDetail.sections[0].id);
    } else {
      setPlannerSectionId('');
    }
  }, [projectDetail]);

  const plannerSections = useMemo(
    () => projectDetail?.sections ?? [],
    [projectDetail],
  );

  const processMutation = useMutation({
    mutationFn: (cmd: string) => aiAPI.process(cmd, autoExecute, aiProvider),
    onSuccess: (response) => {
      const data = response.data;
      setProviderUsed(data.providerUsed ?? aiProvider);
      if (data.message) {
        setAssistantMessage(data.message);
      } else {
        setAssistantMessage(null);
      }
      setActions(data.actions);
      if (data.results) {
        setResults(data.results);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast.success('Comandos ejecutados con éxito');
      }
      setCommand('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al procesar comando');
    },
  });

  const executeMutation = useMutation({
    mutationFn: (actionsToExecute: AIAction[]) => aiAPI.execute(actionsToExecute),
    onSuccess: (response) => {
      setResults(response.data.results);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Acciones ejecutadas');
      setActions([]);
    },
    onError: () => {
      toast.error('Error al ejecutar acciones');
    },
  });

  const plannerMutation = useMutation({
    mutationFn: (payload: { goal: string; mode: 'auto' | 'interactive'; answers?: string[] }) =>
      aiAPI.planner({ ...payload, provider: aiProvider }),
    onSuccess: (response) => {
      const data: AIPlannerResponse = response.data;
      setPlannerProvider(data.providerUsed);

      if (data.status === 'questions') {
        if (data.questions.length === 0) {
          // No hay preguntas, pedir plan directamente
          plannerMutation.mutate({ goal: plannerGoal, mode: 'interactive', answers: [] });
          return;
        }
        setPlannerQuestions(data.questions);
        setPlannerAnswers(Array.from({ length: data.questions.length }).map(() => ''));
        setPlannerPlan(null);
        setPlannerNotes([]);
        toast('El plan necesita más detalles antes de generarse.', { icon: '💬' });
      } else {
        setPlannerPlan(data.plan);
        setPlannerNotes(data.notes ?? []);
        setPlannerQuestions([]);
        setPlannerAnswers([]);
        toast.success('Plan generado con éxito');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'No se pudo generar el plan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    processMutation.mutate(command);
  };

  const handleExecute = () => {
    if (actions.length > 0) {
      executeMutation.mutate(actions);
    }
  };

  const resetPlanner = () => {
    setPlannerPlan(null);
    setPlannerQuestions([]);
    setPlannerAnswers([]);
    setPlannerNotes([]);
    setPlannerProvider(null);
  };

  const handlePlannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerGoal.trim()) {
      toast.error('Describe el objetivo que quieres planificar');
      return;
    }
    resetPlanner();
    plannerMutation.mutate({ goal: plannerGoal, mode: plannerMode });
  };

  const handleQuestionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plannerAnswers.some((answer) => !answer.trim())) {
      toast.error('Responde todas las preguntas para continuar');
      return;
    }
    plannerMutation.mutate({ goal: plannerGoal, mode: 'interactive', answers: plannerAnswers });
  };

  const handleConvertPlan = () => {
    if (!plannerPlan) return;
    const project = projects?.find((p) => p.id === plannerProjectId);
    if (!project) {
      toast.error('Selecciona un proyecto para crear las tareas del plan');
      return;
    }

    const actionsToExecute: AIAction[] = [];

    plannerPlan.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        const due = formatDateFromToday(task.dueInDays);
        const descripcion = [phase.title, phase.description, task.description]
          .filter(Boolean)
          .join(' — ');

        actionsToExecute.push({
          type: 'create',
          entity: 'task',
          data: {
            titulo: task.title,
            descripcion: descripcion || undefined,
            prioridad: priorityFromPlan(task.priority),
            fechaVencimiento: due,
            projectName: project.nombre,
            ...(plannerSectionId && { sectionName: plannerSections.find((s) => s.id === plannerSectionId)?.nombre }),
          },
          confidence: 0.9,
          explanation: `Crear tarea del plan (${phase.title}): ${task.title}`,
        });
      });
    });

    if (!actionsToExecute.length) {
      toast.error('No hay tareas en el plan para crear');
      return;
    }

    executeMutation.mutate(actionsToExecute);
  };

  const assistTab = (
    <>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Proveedor</label>
        <span className="text-sm font-medium text-purple-600 dark:text-purple-300">{providerUsed.toUpperCase()}</span>
        {assistantMessage && (
          <span className="text-xs text-yellow-600 dark:text-yellow-300">{assistantMessage}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Escribe un comando para la IA..."
          className="flex-1 input-elevated"
        />
        <Button type="submit" disabled={processMutation.isPending} className="shrink-0" variant="primary">
          {processMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="autoExecute"
          checked={autoExecute}
          onChange={(e) => setAutoExecute(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
        />
        <label htmlFor="autoExecute" className="text-sm text-gray-700 dark:text-gray-300">
          Ejecutar automáticamente
        </label>
      </div>

      {actions.length === 0 && results.length === 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Ejemplos:</p>
          <div className="space-y-1">
            {[ 'añadir comprar leche para mañana prioridad alta', 'completar la tarea de hacer ejercicio', 'qué tengo pendiente esta semana', 'eliminar tareas completadas', ].map((example, i) => (
              <button
                key={i}
                onClick={() => setCommand(example)}
                className="block w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && !autoExecute && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Acciones sugeridas:</p>
          {actions.map((action, i) => (
            <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {action.confidence >= 0.8 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{action.explanation}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Confianza: {Math.round(action.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={handleExecute} disabled={executeMutation.isPending} className="w-full">
            {executeMutation.isPending ? 'Ejecutando...' : 'Ejecutar acciones'}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resultados:</p>
          {results.map((result, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <p className="text-sm text-gray-900 dark:text-gray-100">{result.action.explanation}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {result.success ? '✓ Completado' : `✗ Error: ${result.error}`}
              </p>
            </div>
          ))}
          <Button variant="secondary" onClick={() => { setResults([]); setActions([]); }}>
            Limpiar resultados
          </Button>
        </div>
      )}
    </>
  );

  const plannerTab = (
    <div className="space-y-6">
      <form onSubmit={handlePlannerSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-500" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Planner</h4>
          {plannerProvider && (
            <span className="text-xs font-medium text-purple-600 dark:text-purple-300 uppercase">
              {plannerProvider}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ¿Qué objetivo quieres planificar?
          </label>
          <textarea
            value={plannerGoal}
            onChange={(e) => setPlannerGoal(e.target.value)}
            className="input-elevated w-full min-h-[100px]"
            placeholder="Ej: Lanzar una campaña de marketing en 6 semanas"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo del planner:</label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="planner-auto"
              checked={plannerMode === 'auto'}
              onChange={() => setPlannerMode('auto')}
            />
            <label htmlFor="planner-auto" className="text-sm text-gray-600 dark:text-gray-300">
              Automático (sin preguntas)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="planner-interactive"
              checked={plannerMode === 'interactive'}
              onChange={() => setPlannerMode('interactive')}
            />
            <label htmlFor="planner-interactive" className="text-sm text-gray-600 dark:text-gray-300">
              Interactivo (IA solicita datos)
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={plannerMutation.isPending}>
            {plannerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar plan'}
          </Button>
          <Button type="button" variant="ghost" onClick={resetPlanner}>
            Limpiar
          </Button>
        </div>
      </form>

      {plannerQuestions.length > 0 && (
        <Card className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">La IA necesita más información</h5>
          <form onSubmit={handleQuestionsSubmit} className="space-y-3">
            {plannerQuestions.map((question, index) => (
              <div key={question} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {question}
                </label>
                <Input
                  value={plannerAnswers[index] ?? ''}
                  onChange={(e) => {
                    const updated = [...plannerAnswers];
                    updated[index] = e.target.value;
                    setPlannerAnswers(updated);
                  }}
                  placeholder="Tu respuesta"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="submit" disabled={plannerMutation.isPending}>
                {plannerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar plan con respuestas'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetPlanner}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {plannerPlan && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-500" />
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Resumen del plan</h5>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{plannerPlan.summary}</p>
            {plannerPlan.assumptions && plannerPlan.assumptions.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Supuestos</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {plannerPlan.assumptions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {plannerPlan.timeline && plannerPlan.timeline.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Timeline</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {plannerPlan.timeline.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <ScrollArea className="max-h-[280px] pr-2">
            <div className="space-y-4">
              {plannerPlan.phases.map((phase, index) => (
                <Card key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Fase {index + 1}: {phase.title}
                    </h6>
                    {phase.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{phase.duration}</span>
                    )}
                  </div>
                  {phase.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{phase.description}</p>
                  )}
                  <div className="space-y-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/80 dark:bg-slate-800/50">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Prioridad: P{priorityFromPlan(task.priority)}</span>
                          {typeof task.dueInDays === 'number' && (
                            <span>En {task.dueInDays} días</span>
                          )}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <span>Dependencias: {task.dependencies.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {plannerNotes.length > 0 && (
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notas</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {plannerNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="space-y-3">
            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Crear tareas desde el plan</h6>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1">
                  Proyecto destino
                </label>
                <Select value={plannerProjectId} onChange={(e) => setPlannerProjectId(e.target.value)}>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-1">
                  Sección (opcional)
                </label>
                <Select
                  value={plannerSectionId}
                  onChange={(e) => setPlannerSectionId(e.target.value)}
                >
                  <option value="">(Sin sección)</option>
                  {plannerSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConvertPlan} disabled={executeMutation.isPending}>
                {executeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear tareas del plan'}
              </Button>
              <Button variant="secondary" onClick={resetPlanner}>
                Limpiar plan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleAI}
        />
      )}

      <div
        className={`
        fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50
        ${isMobile 
          ? 'inset-x-4 bottom-20 top-20' 
          : 'bottom-6 right-6 w-[420px]'
        }
      `}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Asistente IA</h3>
          </div>
          <button
            onClick={toggleAI}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className={`p-4 overflow-y-auto ${isMobile ? 'max-h-full' : 'max-h-[520px]'}`}>
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'assistant' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('assistant')}
            >
              Comandos IA
            </Button>
            <Button
              variant={activeTab === 'planner' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('planner')}
            >
              AI Planner
            </Button>
          </div>

          {activeTab === 'assistant' ? assistTab : plannerTab}
        </div>
      </div>
    </>
  );
}

